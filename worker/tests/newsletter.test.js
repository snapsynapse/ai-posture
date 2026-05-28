import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidEmail, normalizeEmail, generateToken } from '../src/newsletter.js';

test('isValidEmail accepts plain addresses', () => {
  assert.equal(isValidEmail('a@b.co'), true);
  assert.equal(isValidEmail('first.last+tag@example.org'), true);
});

test('isValidEmail rejects non-strings, empty, whitespace, malformed', () => {
  assert.equal(isValidEmail(null), false);
  assert.equal(isValidEmail(undefined), false);
  assert.equal(isValidEmail(123), false);
  assert.equal(isValidEmail(''), false);
  assert.equal(isValidEmail('   '), false);
  assert.equal(isValidEmail('not-an-email'), false);
  assert.equal(isValidEmail('a@b'), false);
  assert.equal(isValidEmail('a@.b'), false);
  assert.equal(isValidEmail('a b@c.d'), false);
});

test('isValidEmail rejects pathologically long addresses', () => {
  const long = 'a'.repeat(250) + '@b.co';
  assert.equal(isValidEmail(long), false);
});

test('normalizeEmail lowercases and trims', () => {
  assert.equal(normalizeEmail('  Foo@Example.COM  '), 'foo@example.com');
});

test('generateToken returns 64 hex characters and is unique', () => {
  const a = generateToken();
  const b = generateToken();
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.match(b, /^[0-9a-f]{64}$/);
  assert.notEqual(a, b);
});
