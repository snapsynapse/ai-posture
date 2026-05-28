import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidPayload, generateRunId } from '../src/deliver.js';

test('isValidPayload accepts a realistic AI Posture artifact', () => {
  const p = {
    type: 'AI Posture Pre-Assessment Result',
    version: '0.3.2',
    generated_at: '2026-05-28T12:00:00Z',
    source: 'https://aiposture.org/assess/',
    estimate_label: 'estimated AI Posture',
    scope: { label: null },
    aggregate: { level: 2, level_name: 'Assessing' },
    constraining_vectors: ['Regulation'],
    vectors: { People: {}, Infrastructure: {}, Regulation: {} },
    notice: 'This is an estimate, not a verified assertion.',
  };
  assert.equal(isValidPayload(p), true);
});

test('isValidPayload rejects null, primitives, and arrays', () => {
  assert.equal(isValidPayload(null), false);
  assert.equal(isValidPayload(undefined), false);
  assert.equal(isValidPayload('string'), false);
  assert.equal(isValidPayload(42), false);
  assert.equal(isValidPayload([]), false);
});

test('isValidPayload rejects payloads with the wrong type marker', () => {
  assert.equal(isValidPayload({ type: 'something else', aggregate: {}, vectors: {} }), false);
  assert.equal(isValidPayload({ aggregate: {}, vectors: {} }), false);
});

test('isValidPayload rejects payloads missing aggregate or vectors', () => {
  assert.equal(isValidPayload({ type: 'AI Posture x', vectors: {} }), false);
  assert.equal(isValidPayload({ type: 'AI Posture x', aggregate: {} }), false);
  assert.equal(isValidPayload({ type: 'AI Posture x', aggregate: {}, vectors: 'bad' }), false);
});

test('generateRunId returns a 64-hex opaque ID and is unique', () => {
  const a = generateRunId();
  const b = generateRunId();
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.notEqual(a, b);
});
