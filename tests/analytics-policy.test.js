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
  vm.runInNewContext(source, { window: { posthog }, posthog, document: {} });
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
