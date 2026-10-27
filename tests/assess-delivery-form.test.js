const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const APP = fs.readFileSync(path.join(ROOT, 'docs/assess/js/app.js'), 'utf8');
const ASSESS_HTML = fs.readFileSync(path.join(ROOT, 'docs/assess/index.html'), 'utf8');
const PRIVACY = fs.readFileSync(path.join(ROOT, 'docs/privacy/index.html'), 'utf8');
const TERMS = fs.readFileSync(path.join(ROOT, 'docs/terms/index.html'), 'utf8');

test('assess app builds a delivery form on the result screen', () => {
  assert.match(APP, /function buildDeliveryForm\(\)/);
  assert.match(APP, /\/api\/deliver/);
  assert.match(APP, /delivery_requested/);
});

test('assess app prefills delivery email from newsletter sessionStorage key', () => {
  assert.match(APP, /aiposture\.newsletter\.email/);
});

test('assess app rejects malformed emails before submit and surfaces rate_limited', () => {
  assert.match(APP, /Enter a valid email address/);
  assert.match(APP, /rate_limited/);
});

test('assess CSS covers the delivery form and hides it in print', () => {
  assert.match(ASSESS_HTML, /\.delivery\s*\{/);
  assert.match(ASSESS_HTML, /\.delivery,\s*\.not-panel\s*\{\s*display:\s*none\s*!important/);
});

test('privacy policy qualifies new-record handling and discloses legacy records and abuse controls', () => {
  assert.match(PRIVACY, /Completed-assessment record/);
  assert.match(PRIVACY, /For new requests handled after the updated delivery service is activated, the delivery email address is not added to the assessment record/);
  assert.match(PRIVACY, /Earlier service versions could store the delivery address/);
  assert.match(PRIVACY, /does not automatically erase historical records/);
  assert.match(PRIVACY, /scope label or other accepted text can identify a person, team or organization/);
  assert.doesNotMatch(PRIVACY, /record does not contain your name, organization|Any future backend components/);
  assert.match(PRIVACY, /keyed hash of the recipient address/);
  assert.match(PRIVACY, /IP addresses in hourly request-limit buckets/);
  assert.match(PRIVACY, /run ID/);
});

test('privacy policy lists delivery_requested as a permitted analytics event', () => {
  assert.match(PRIVACY, /<code>delivery_requested<\/code>/);
});

test('privacy and terms distinguish preparation from publication and disclose delivery', () => {
  for (const page of [PRIVACY, TERMS]) {
    assert.match(page, /Revision prepared <time/);
    assert.match(page, /Effective on publication/);
  }
  assert.match(TERMS, /request email delivery of your JSON estimate artifact/);
});

test('PRIV-R2 terms prohibit extracting personal data without denying its existence', () => {
  assert.match(TERMS, /<li>Reverse-engineer the service to extract personal data about other users\.<\/li>/);
  assert.doesNotMatch(TERMS, /no such data exists|does not collect personal data during the flow/);
});
