import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from '../src/index.js';
import { readJsonBody } from '../src/request.js';

const EMAIL = 'fixture@example.org';
const ORIGIN = 'https://aiposture.org';
function artifact() {
  const vector = () => ({ in_scope: true, level: 2, level_name: 'Assessing', posterior: [0, .1, .75, .1, .05, 0], evidence_checklist: ['Show evidence.'] });
  return { type: 'AI Posture Pre-Assessment Result', version: '1.0.0', generated_at: '2026-10-26T12:00:00Z', source: ORIGIN + '/assess/', estimate_label: 'estimated AI Posture', scope: { label: null }, aggregate: { level: 2, level_name: 'Assessing' }, constraining_vectors: ['Infrastructure', 'Regulation', 'People'], vectors: { Infrastructure: vector(), Regulation: vector(), People: vector() }, notice: 'This is an estimate, not a verified assertion.' };
}

function fixture(t, options = {}) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'));
  t.after(() => sqlite.close());
  const messages = [], queries = [];
  let ip = 0;
  const env = { RESEND_API_KEY: 'mock-test-key', RESEND_FROM: 'test@example.org', API_ORIGIN: 'https://api.aiposture.org', DB: { prepare(sql) {
    return { bind(...args) {
      queries.push({ sql, args });
      return { async first() { return sqlite.prepare(sql).get(...args) || null; }, async run() {
        if (options.failSql?.test(sql)) throw Error('simulated D1 failure');
        return sqlite.prepare(sql).run(...args);
      } };
    } };
  } } };
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(url, 'https://api.resend.com/emails', 'no real network requests');
    messages.push(JSON.parse(init.body));
    if (options.providerThrows) throw Error('simulated provider network failure');
    return new Response(options.providerFails ? 'failure' : '{"id":"mock"}', { status: options.providerFails ? 502 : 200 });
  });
  const post = (route, body, headers = {}) => worker.fetch(new Request('https://api.aiposture.org' + route, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: ORIGIN, 'CF-Connecting-IP': '192.0.2.' + (++ip), ...headers }, body: JSON.stringify(body) }), env);
  return { env, sqlite, messages, queries, post };
}

test('SEC-001 delivery success stores only an anonymous record without email cleanup', async t => {
  const f = fixture(t, { failSql: /UPDATE assessments|DELETE FROM assessments/ });
  const response = await f.post('/api/deliver', { email: EMAIL, payload: artifact() });
  assert.equal(response.status, 200);
  const row = f.sqlite.prepare('SELECT * FROM assessments').get();
  assert.equal(row.email, null);
  assert.ok(row.delivered_at);
  assert.equal(f.messages.length, 1);
  assert.ok(f.queries.filter(q => /assessments/.test(q.sql)).every(q => !q.args.includes(EMAIL)));
});

for (const failure of ['providerFails', 'providerThrows']) {
  test(`SEC-001 ${failure} leaves no assessment even if cleanup is unavailable`, async t => {
    const f = fixture(t, { [failure]: true, failSql: /DELETE FROM assessments/ });
    const response = await f.post('/api/deliver', { email: EMAIL, payload: artifact() });
    assert.equal(response.status, 502);
    assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM assessments').get().n, 0);
  });
}

test('SEC-001 post-send persistence failure returns a bounded error without retaining email', async t => {
  const f = fixture(t, { failSql: /INSERT INTO assessments/ });
  const response = await f.post('/api/deliver', { email: EMAIL, payload: artifact() });
  assert.equal(response.status, 503);
  assert.equal(f.messages.length, 1);
  assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM assessments').get().n, 0);
});

test('SEC-002 distributed newsletter retries send once and keep the original token usable', async t => {
  const f = fixture(t);
  const first = await f.post('/api/newsletter', { email: EMAIL });
  const token = f.sqlite.prepare('SELECT confirm_token FROM newsletter').get().confirm_token;
  const again = await f.post('/api/newsletter', { email: ' FIXTURE@example.org ' });
  assert.deepEqual(await first.json(), await again.json());
  assert.equal(f.messages.length, 1);
  assert.equal(f.sqlite.prepare('SELECT confirm_token FROM newsletter').get().confirm_token, token);
  const response = await worker.fetch(new Request('https://api.aiposture.org/api/newsletter/confirm?t=' + token), f.env);
  assert.match(await response.text(), /Subscription confirmed/);
});

test('SEC-002 concurrent newsletter requests reserve only one recipient send', async t => {
  const f = fixture(t);
  const responses = await Promise.all(Array.from({ length: 8 }, () => f.post('/api/newsletter', { email: EMAIL })));
  assert.ok(responses.every(r => r.status === 200));
  assert.equal(f.messages.length, 1);
});

test('SEC-002 newsletter cooldown spans hourly buckets and preserves pending token after cooldown', async t => {
  const f = fixture(t);
  let now = Date.UTC(2026, 9, 26, 12, 59, 59);
  t.mock.method(Date, 'now', () => now);
  await f.post('/api/newsletter', { email: EMAIL });
  const token = f.sqlite.prepare('SELECT confirm_token FROM newsletter').get().confirm_token;
  now += 2000;
  await f.post('/api/newsletter', { email: EMAIL });
  assert.equal(f.messages.length, 1);
  now += 3600_000;
  await f.post('/api/newsletter', { email: EMAIL });
  assert.equal(f.messages.length, 2);
  assert.equal(f.sqlite.prepare('SELECT confirm_token FROM newsletter').get().confirm_token, token);
});

test('SEC-002 delivery cooldown blocks other IPs but permits another send after ten minutes', async t => {
  const f = fixture(t);
  let now = Date.now();
  t.mock.method(Date, 'now', () => now);
  assert.equal((await f.post('/api/deliver', { email: EMAIL, payload: artifact() })).status, 200);
  assert.equal((await f.post('/api/deliver', { email: EMAIL, payload: artifact() })).status, 429);
  now += 600_000;
  assert.equal((await f.post('/api/deliver', { email: EMAIL, payload: artifact() })).status, 200);
  assert.equal(f.messages.length, 2);
});

test('SEC-002 newsletter and delivery have separate recipient cooldowns and one global sending cap', async t => {
  const f = fixture(t);
  t.mock.method(Date, 'now', () => Date.UTC(2026, 9, 26, 12));
  await f.post('/api/newsletter', { email: EMAIL });
  assert.equal((await f.post('/api/deliver', { email: EMAIL, payload: artifact() })).status, 200);
  for (let i = 0; i < 98; i++) {
    assert.equal((await f.post('/api/newsletter', { email: `fixture-${i}@example.org` })).status, 200);
  }
  assert.equal((await f.post('/api/deliver', { email: 'beyond-cap@example.org', payload: artifact() })).status, 429);
  assert.equal((await f.post('/api/newsletter', { email: 'another@example.org' })).status, 429);
  assert.equal(f.messages.length, 100);
});

test('SEC-002 repeated suppressed recipients do not consume the global sending budget', async t => {
  const f = fixture(t);
  await f.post('/api/newsletter', { email: EMAIL });
  for (let i = 0; i < 105; i++) await f.post('/api/newsletter', { email: EMAIL });
  assert.equal((await f.post('/api/newsletter', { email: 'other@example.org' })).status, 200);
  assert.equal(f.messages.length, 2);
  const guards = f.sqlite.prepare('SELECT recipient_key FROM mail_cooldown').all();
  assert.ok(guards.every(row => /^[a-f0-9]{64}$/.test(row.recipient_key)));
  assert.ok(!JSON.stringify(guards).includes(EMAIL));
});

for (const route of ['/api/newsletter', '/api/deliver']) {
  test(`SEC-003 ${route} rejects a large complete request before parsing`, async t => {
    const f = fixture(t);
    const response = await f.post(route, { email: EMAIL, payload: artifact(), padding: 'x'.repeat(1024 * 1024) });
    assert.equal(response.status, 413);
    assert.equal(f.messages.length, 0);
  });

  test(`SEC-003 ${route} rejects unknown envelope fields and wrong content types`, async t => {
    const f = fixture(t);
    const body = route.endsWith('deliver') ? { email: EMAIL, payload: artifact() } : { email: EMAIL };
    assert.equal((await f.post(route, { ...body, extra: true })).status, 400);
    assert.equal((await f.post(route, body, { 'Content-Type': 'text/plain' })).status, 415);
    assert.equal((await f.post(route, body, { 'Content-Type': 'application/json; charset=UTF-8' })).status, 200);
  });
}

test('SEC-003 chunked request is stopped without Content-Length or after a misleading length', async t => {
  const f = fixture(t);
  for (const length of [null, '1']) {
    let chunks = 0, cancelled = false;
    const stream = new ReadableStream({ pull(controller) { if (chunks === 64) { controller.close(); return; } chunks++; controller.enqueue(new TextEncoder().encode('x'.repeat(1024))); }, cancel() { cancelled = true; } });
    const headers = { 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.150' };
    if (length) headers['Content-Length'] = length;
    const request = new Request('https://api.aiposture.org/api/deliver', { method: 'POST', headers, body: stream, duplex: 'half' });
    const response = await worker.fetch(request, f.env);
    assert.equal(response.status, 413);
    assert.ok(chunks < 40, 'must stop consuming the stream near the byte budget');
    assert.equal(cancelled, true);
  }
  assert.equal(f.messages.length, 0);
});

test('SEC-003 declared oversized body returns 413 even when stream cancellation stalls', async () => {
  const stream = new ReadableStream({ cancel() { return new Promise(() => {}); } });
  const request = new Request('https://api.aiposture.org/api/newsletter', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': '1000000' }, body: stream, duplex: 'half'
  });
  let timer;
  try {
    const result = await Promise.race([readJsonBody(request, 1024, ['email']), new Promise(resolve => { timer = setTimeout(() => resolve({ stalled: true }), 100); })]);
    assert.equal(result.status, 413);
  } finally { clearTimeout(timer); }
});

test('SEC-007 invalid semantics are rejected before sending or storing an assessment', async t => {
  const f = fixture(t);
  const p = artifact(); p.aggregate = { level: 5, level_name: 'Perceiving' };
  assert.equal((await f.post('/api/deliver', { email: EMAIL, payload: p })).status, 400);
  assert.equal(f.messages.length, 0);
  assert.equal(f.sqlite.prepare('SELECT count(*) AS n FROM assessments').get().n, 0);
});

for (const [label, age, valid] of [['fresh', 86399, true], ['exact expiry', 86400, false], ['old', 86401, false], ['future timestamp', -1, false]]) {
  test(`SEC-009 confirmation ${label} respects the 24-hour boundary`, async t => {
    const f = fixture(t);
    const now = 1_800_000_000;
    t.mock.method(Date, 'now', () => now * 1000);
    const token = 'a'.repeat(64);
    f.sqlite.prepare("INSERT INTO newsletter (email, status, confirm_token, created_at) VALUES (?, 'pending', ?, ?)").run(EMAIL, token, now - age);
    const response = await worker.fetch(new Request('https://api.aiposture.org/api/newsletter/confirm?t=' + token), f.env);
    const text = await response.text();
    assert.equal(text.includes('Subscription confirmed'), valid);
    const row = f.sqlite.prepare('SELECT status, confirm_token FROM newsletter WHERE email = ?').get(EMAIL);
    assert.equal(row?.status === 'confirmed', valid);
    if (valid) assert.equal(row.confirm_token, null);
  });
}

test('SEC-009 concurrent confirmation consumes a fresh token only once', async t => {
  const f = fixture(t);
  const token = 'b'.repeat(64);
  f.sqlite.prepare("INSERT INTO newsletter (email, status, confirm_token, created_at) VALUES (?, 'pending', ?, ?)").run(EMAIL, token, Math.floor(Date.now() / 1000));
  const confirm = () => worker.fetch(new Request('https://api.aiposture.org/api/newsletter/confirm?t=' + token), f.env).then(r => r.text());
  const results = await Promise.all([confirm(), confirm()]);
  assert.equal(results.filter(text => text.includes('Subscription confirmed')).length, 1);
});

test('SEC-009 resubscription replaces an expired token but preserves confirmed subscriptions during cleanup', async t => {
  const f = fixture(t);
  let now = Date.UTC(2026, 9, 26, 12);
  t.mock.method(Date, 'now', () => now);
  await f.post('/api/newsletter', { email: EMAIL });
  const oldToken = f.sqlite.prepare('SELECT confirm_token FROM newsletter WHERE email = ?').get(EMAIL).confirm_token;
  f.sqlite.prepare("INSERT INTO newsletter (email, status, created_at) VALUES (?, 'confirmed', 0)").run('confirmed@example.org');
  now += 86400_000;
  await f.post('/api/newsletter', { email: EMAIL });
  const row = f.sqlite.prepare('SELECT confirm_token, created_at FROM newsletter WHERE email = ?').get(EMAIL);
  assert.notEqual(row.confirm_token, oldToken);
  assert.equal(row.created_at, now / 1000);
  assert.equal(f.sqlite.prepare('SELECT status FROM newsletter WHERE email = ?').get('confirmed@example.org').status, 'confirmed');
  const old = await worker.fetch(new Request('https://api.aiposture.org/api/newsletter/confirm?t=' + oldToken), f.env);
  assert.doesNotMatch(await old.text(), /Subscription confirmed/);
  const fresh = await worker.fetch(new Request('https://api.aiposture.org/api/newsletter/confirm?t=' + row.confirm_token), f.env);
  assert.match(await fresh.text(), /Subscription confirmed/);
});

test('R2 old-client estimate is delivered and stored unchanged through the new Worker', async t => {
  const f = fixture(t);
  const payload = JSON.parse(readFileSync(new URL('./fixtures/estimate-1.0.0.json', import.meta.url), 'utf8'));
  const response = await f.post('/api/deliver', { email: EMAIL, payload });
  assert.equal(response.status, 200);
  assert.equal(f.messages.length, 1);
  const stored = f.sqlite.prepare('SELECT email, payload FROM assessments').get();
  assert.equal(stored.email, null);
  assert.deepEqual(JSON.parse(stored.payload), payload);
  assert.deepEqual(JSON.parse(Buffer.from(f.messages[0].attachments[0].content, 'base64').toString('utf8')), payload);
});

test('R3 near-expiry resends show the original absolute deadline in both email formats', async t => {
  const f = fixture(t);
  const issued = Date.UTC(2026, 9, 26, 12);
  let now = issued;
  t.mock.method(Date, 'now', () => now);
  await f.post('/api/newsletter', { email: EMAIL });
  const originalToken = f.sqlite.prepare('SELECT confirm_token FROM newsletter WHERE email = ?').get(EMAIL).confirm_token;
  now += 23 * 3600_000;
  await f.post('/api/newsletter', { email: EMAIL });
  assert.equal(f.messages.length, 2);
  const deadline = new Date(issued + 24 * 3600_000).toISOString();
  const misleadingDeadline = new Date(now + 24 * 3600_000).toISOString();
  for (const message of f.messages) {
    for (const content of [message.text, message.html]) {
      assert.ok(content.includes(deadline));
      assert.ok(!content.includes(misleadingDeadline));
      assert.doesNotMatch(content, /expires after 24 hours/);
    }
  }
  assert.equal(f.sqlite.prepare('SELECT confirm_token FROM newsletter WHERE email = ?').get(EMAIL).confirm_token, originalToken);
  now = issued + 24 * 3600_000;
  const result = await worker.fetch(new Request('https://api.aiposture.org/api/newsletter/confirm?t=' + originalToken), f.env);
  assert.doesNotMatch(await result.text(), /Subscription confirmed/);
});
