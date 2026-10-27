const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '../docs/assess/index.html'), 'utf8');
const privacy = fs.readFileSync(path.join(__dirname, '../docs/privacy/index.html'), 'utf8');
const EVENTS = ['$pageview', 'assessment_started', 'question_answered', 'assessment_completed', 'email_captured', 'delivery_requested', 'pdf_requested', 'handoff_clicked'];

function config() {
  let configuration;
  const posthog = { __loaded: true, init(_key, options) { configuration = options; } };
  const source = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]).find(script => script.includes('posthog.init('));
  vm.runInNewContext(source, { window: { posthog }, posthog, document: {}, URL });
  return configuration;
}

test('SEC-010 assessment explicitly disables pageleave and retains private analytics settings', () => {
  const options = config();
  assert.equal(options.capture_pageleave, false);
  assert.equal(options.capture_pageview, true);
  assert.equal(options.persistence, 'memory');
  assert.equal(options.person_profiles, 'never');
  assert.equal(options.autocapture, false);
  assert.equal(options.disable_session_recording, true);
  assert.equal(options.save_campaign_params, false);
});

test('SEC-010 analytics only allows disclosed events and drops new SDK event types', () => {
  const options = config();
  assert.equal(typeof options.before_send, 'function');
  for (const name of EVENTS) {
    const event = { event: name, properties: {} };
    assert.equal(options.before_send(event), event);
    assert.ok(privacy.includes(`<code>${name}</code>`));
  }
  for (const name of ['$pageleave', '$autocapture', '$identify', 'new_sdk_event', 'constructor', '__proto__']) {
    assert.equal(options.before_send({ event: name }), null);
  }
  assert.equal(options.before_send(null), null);
});

test('PRIV-002 sanitizes current and initial URLs on every allowed event without losing metrics', () => {
  const options = config();
  for (const name of EVENTS) {
    const event = { event: name, properties: {
      $current_url: 'https://user:secret@aiposture.org/assess/?email=alex%40example.test#token',
      $initial_current_url: 'https://aiposture.org/assess/?first=private#initial',
      $host: 'user:secret@aiposture.org', $initial_host: 'private',
      $pathname: '/assess/?email=private#token',
      $initial_pathname: '/assess/?first=private#initial',
      question_id: 'P1', people_level: 3, in_scope_count: 2, distinct_id: 'session-only-id'
    } };
    const properties = options.before_send(event).properties;
    assert.equal(properties.$current_url, 'https://aiposture.org/assess/');
    assert.equal(properties.$initial_current_url, 'https://aiposture.org/assess/');
    assert.equal(properties.$pathname, '/assess/');
    assert.equal(properties.$initial_pathname, '/assess/');
    assert.equal(properties.$host, 'aiposture.org');
    assert.equal(properties.$initial_host, 'aiposture.org');
    assert.equal(properties.question_id, 'P1');
    assert.equal(properties.people_level, 3);
    assert.equal(properties.in_scope_count, 2);
    assert.equal(properties.distinct_id, 'session-only-id');
  }
});

test('PRIV-002 keeps only referrer origins and removes copied campaign/search values', () => {
  const event = { event: '$pageview', properties: {
    $referrer: 'https://user:secret@referrer.example/people/alex?email=private#token',
    $initial_referrer: 'https://first.example/people/alex?email=private#token',
    $referring_domain: 'referrer.example', $initial_referring_domain: 'first.example',
    utm_source: 'private', utm_campaign: 'private', $initial_utm_content: 'private',
    $search_engine: 'search', ph_keyword: 'private', $initial_ph_keyword: 'private',
    $initial_search_engine: 'search'
  } };
  const properties = config().before_send(event).properties;
  assert.equal(properties.$referrer, 'https://referrer.example');
  assert.equal(properties.$initial_referrer, 'https://first.example');
  assert.equal(properties.$referring_domain, 'referrer.example');
  assert.equal(properties.$initial_referring_domain, 'first.example');
  for (const key of ['utm_source', 'utm_campaign', '$initial_utm_content', '$search_engine', 'ph_keyword', '$initial_ph_keyword', '$initial_search_engine']) {
    assert.equal(Object.hasOwn(properties, key), false, key);
  }
});

test('PRIV-002 handoff URLs retain the destination path without credentials, query or fragment', () => {
  for (const url of ['https://user:secret@aiposture.org/criteria/v1/?email=private#token', '/criteria/v1/?email=private#token']) {
    const result = config().before_send({ event: 'handoff_clicked', properties: { destination: 'criteria', url } });
    assert.equal(result.properties.url, 'https://aiposture.org/criteria/v1/');
    assert.equal(result.properties.destination, 'criteria');
  }
});

test('PRIV-002 drops invalid and non-web URL values without throwing or discarding the event', () => {
  const options = config();
  for (const value of [null, undefined, 42, {}, [], '', 'not a URL', 'https://[', 'javascript:alert(1)', 'data:text/plain,private', 'mailto:alex@example.test']) {
    const properties = Object.fromEntries(['$current_url', '$initial_current_url', '$referrer', '$initial_referrer', '$pathname', '$initial_pathname', 'url'].map(key => [key, value]));
    const result = options.before_send({ event: '$pageview', properties });
    assert.equal(Object.keys(result.properties).length, 0, String(value));
  }
  assert.equal(options.before_send({ event: '$pageview' }).event, '$pageview');
  const direct = options.before_send({ event: '$pageview', properties: { $referrer: '$direct', $initial_referrer: '$direct' } });
  assert.equal(direct.properties.$referrer, '$direct');
  assert.equal(direct.properties.$initial_referrer, '$direct');
});

test('PRIV-002 omits orphaned host/domain fields and preserves clean non-default ports', () => {
  const options = config();
  const orphaned = options.before_send({ event: '$pageview', properties: {
    $host: 'private', $initial_host: 'private', $referring_domain: 'private', $initial_referring_domain: 'private'
  } });
  assert.equal(Object.keys(orphaned.properties).length, 0);
  const clean = options.before_send({ event: '$pageview', properties: {
    $current_url: 'https://aiposture.org:8443/assess/', $referrer: 'https://referrer.example:8443/',
    $referring_domain: 'referrer.example'
  } });
  assert.equal(clean.properties.$current_url, 'https://aiposture.org:8443/assess/');
  assert.equal(clean.properties.$referrer, 'https://referrer.example:8443');
  assert.equal(clean.properties.$referring_domain, 'referrer.example');
});

test('PRIV-002 cannot leak URLs through unused person updates or copied ad-click identifiers', () => {
  const properties = { question_id: 'P1',
    $set: { $current_url: 'https://aiposture.org/?email=private' },
    $set_once: { $initial_referrer: 'https://referrer.example/?token=private' }
  };
  const campaigns = ['gclid', 'gclsrc', 'dclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid', 'twclid', 'li_fat_id', 'igshid', 'ttclid', 'rdt_cid', 'epik', 'qclid', 'sccid', 'oppref', 'bfcid', 'irclid', '_kx', 'gad_source', 'mc_cid'];
  for (const key of campaigns) {
    properties[key] = 'private';
    properties['$initial_' + key] = 'private';
  }
  const result = config().before_send({ event: 'question_answered', properties,
    $set: { $current_url: 'https://aiposture.org/?email=private' },
    $set_once: { $initial_current_url: 'https://aiposture.org/?token=private' }
  });
  assert.equal(Object.hasOwn(result, '$set'), false);
  assert.equal(Object.hasOwn(result, '$set_once'), false);
  assert.deepEqual(result.properties, { question_id: 'P1' });
});

test('PRIV-R1 drops SDK session-entry attribution on every permitted event while retaining metrics', () => {
  const options = config();
  for (const event of EVENTS) {
    const properties = {
      $session_entry_url: 'https://user:secret@aiposture.org/assess/?email=private#token',
      $session_entry_referrer: 'https://referrer.example/people/alex?token=private#secret',
      $session_entry_pathname: '/assess/?email=private#token',
      $session_entry_referring_domain: 'referrer.example',
      $session_entry_host: 'aiposture.org',
      $session_entry_utm_source: 'private', $session_entry_gclid: 'private',
      $session_entry_search_engine: 'search', $session_entry_ph_keyword: 'private',
      $current_url: 'https://aiposture.org/assess/?email=private#token',
      question_id: 'P1', people_level: 3, in_scope_count: 2,
      distinct_id: 'session-only-id', $session_id: 'session-id'
    };
    const result = options.before_send({ event, properties });
    assert.equal(result.event, event);
    assert.equal(Object.keys(result.properties).some(key => key.startsWith('$session_entry_')), false);
    assert.equal(result.properties.$current_url, 'https://aiposture.org/assess/');
    assert.equal(result.properties.question_id, 'P1');
    assert.equal(result.properties.people_level, 3);
    assert.equal(result.properties.in_scope_count, 2);
    assert.equal(result.properties.distinct_id, 'session-only-id');
    assert.equal(result.properties.$session_id, 'session-id');
  }
});

test('PRIV-R1 omits unknown session-entry fields regardless of value type', () => {
  const options = config();
  for (const value of ['private', null, undefined, 42, {}, ['private']]) {
    const result = options.before_send({ event: '$pageview', properties: {
      $session_entry_future_sdk_field: value, $referrer: '$direct'
    } });
    assert.deepEqual(result.properties, { $referrer: '$direct' });
  }
});
