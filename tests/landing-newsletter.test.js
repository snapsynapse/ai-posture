const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const HOME = fs.readFileSync(path.join(ROOT, 'docs/index.html'), 'utf8');
const PRIVACY = fs.readFileSync(path.join(ROOT, 'docs/privacy/index.html'), 'utf8');
const TERMS = fs.readFileSync(path.join(ROOT, 'docs/terms/index.html'), 'utf8');

test('landing page contains newsletter form with email input and submit', () => {
  assert.match(HOME, /id="newsletter-form"/);
  assert.match(HOME, /id="newsletter-email"/);
  assert.match(HOME, /id="newsletter-submit"/);
  assert.match(HOME, /type="email"/);
  assert.match(HOME, /required/);
  assert.match(HOME, /autocomplete="email"/);
});

test('landing page newsletter form has accessible label and status region', () => {
  assert.match(HOME, /<label[^>]*for="newsletter-email"[^>]*>Email address<\/label>/);
  assert.match(HOME, /id="newsletter-status"[^>]*aria-live="polite"/);
});

test('landing page newsletter JS posts to api.aiposture.org in production', () => {
  assert.match(HOME, /https:\/\/api\.aiposture\.org/);
  assert.match(HOME, /\/api\/newsletter/);
  assert.match(HOME, /sessionStorage/);
  assert.match(HOME, /email_captured/);
});

test('landing page links privacy from newsletter section', () => {
  assert.match(HOME, /<section id="newsletter"[\s\S]*?href="\/privacy\/"[\s\S]*?<\/section>/);
});

test('privacy policy discloses Resend as a processor for newsletter', () => {
  assert.match(PRIVACY, /resend\.com/i);
  assert.match(PRIVACY, /double opt-in/i);
  assert.match(PRIVACY, /Cloudflare D1/);
});

test('privacy policy has deletion path for newsletter subscribers', () => {
  assert.match(PRIVACY, /privacy@paice\.work/);
});

test('terms disclose Cloudflare and Resend as processors and cover the newsletter', () => {
  assert.match(TERMS, /Cloudflare/);
  assert.match(TERMS, /Resend/);
  assert.match(TERMS, /AI Posture newsletter/);
});

test('privacy and terms carry the v1.0 effective date', () => {
  assert.match(PRIVACY, /datetime="2026-05-29"/);
  assert.match(TERMS, /datetime="2026-05-29"/);
});
