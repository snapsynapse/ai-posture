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

test('privacy policy describes the completed-assessment record and email dissociation as deployed', () => {
  assert.match(PRIVACY, /Completed-assessment record/);
  assert.match(PRIVACY, /removed after delivery|email column nulled|after delivery/i);
  assert.match(PRIVACY, /run ID/);
});

test('privacy policy lists delivery_requested as a permitted analytics event', () => {
  assert.match(PRIVACY, /<code>delivery_requested<\/code>/);
});

test('privacy and terms carry the v1.0 effective date and delivery disclosure', () => {
  assert.match(PRIVACY, /datetime="2026-05-29"/);
  assert.match(TERMS, /datetime="2026-05-29"/);
  assert.match(TERMS, /request email delivery of your JSON estimate artifact/);
});
