import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidPayload, generateRunId } from '../src/deliver.js';

function vectorResult(overrides = {}) {
  return {
    in_scope: true,
    level: 2,
    level_name: 'Assessing',
    posterior: [0, 0.1, 0.75, 0.1, 0.05, 0],
    evidence_checklist: ['Show the supporting artifact.'],
    ...overrides,
  };
}

function validPayload(overrides = {}) {
  return {
    type: 'AI Posture Pre-Assessment Result',
    version: '0.3.2',
    generated_at: '2026-05-28T12:00:00Z',
    source: 'https://aiposture.org/assess/',
    estimate_label: 'estimated AI Posture',
    scope: { label: null },
    aggregate: { level: 2, level_name: 'Assessing' },
    constraining_vectors: ['Regulation'],
    vectors: {
      Infrastructure: vectorResult(),
      Regulation: vectorResult(),
      People: vectorResult(),
    },
    notice: 'This is an estimate, not a verified assertion.',
    ...overrides,
  };
}

test('isValidPayload accepts a realistic AI Posture artifact', () => {
  const p = validPayload();
  assert.equal(isValidPayload(p), true);
});

test('isValidPayload rejects null, primitives, and arrays', () => {
  assert.equal(isValidPayload(null), false);
  assert.equal(isValidPayload(undefined), false);
  assert.equal(isValidPayload('string'), false);
  assert.equal(isValidPayload(42), false);
  assert.equal(isValidPayload([]), false);
  class Artifact {
    constructor() {
      Object.assign(this, validPayload());
    }
  }
  assert.equal(isValidPayload(new Artifact()), false);
});

test('isValidPayload rejects spoofed or missing top-level constants', () => {
  assert.equal(isValidPayload(validPayload({ type: 'not really AI Posture but contains AI Posture words' })), false);
  assert.equal(isValidPayload(validPayload({ source: 'https://attacker.example/assess/' })), false);
  assert.equal(isValidPayload(validPayload({ estimate_label: 'verified AI Posture' })), false);
  assert.equal(isValidPayload(validPayload({ notice: 'Verified assertion.' })), false);
});

test('isValidPayload rejects missing and extra top-level fields', () => {
  const missingNotice = validPayload();
  delete missingNotice.notice;
  assert.equal(isValidPayload(missingNotice), false);
  assert.equal(isValidPayload(validPayload({ unexpected: true })), false);
});

test('isValidPayload rejects malformed aggregate and vector levels', () => {
  assert.equal(isValidPayload(validPayload({ aggregate: { level: 2, level_name: '<img src=x onerror=alert(1)>' } })), false);
  assert.equal(isValidPayload(validPayload({ aggregate: { level: 6, level_name: 'Engineering' } })), false);
  assert.equal(isValidPayload(validPayload({
    vectors: {
      Infrastructure: vectorResult({ level_name: 'Calibrated' }),
      Regulation: vectorResult(),
      People: vectorResult(),
    },
  })), false);
});

test('isValidPayload rejects malformed vector objects', () => {
  assert.equal(isValidPayload(validPayload({ vectors: 'bad' })), false);
  assert.equal(isValidPayload(validPayload({
    vectors: {
      Infrastructure: vectorResult(),
      Regulation: vectorResult(),
    },
  })), false);
  assert.equal(isValidPayload(validPayload({
    vectors: {
      Infrastructure: vectorResult(),
      Regulation: vectorResult(),
      People: vectorResult(),
      Legal: vectorResult(),
    },
  })), false);
  assert.equal(isValidPayload(validPayload({
    vectors: {
      Infrastructure: vectorResult({ posterior: [0, 0.5, 0.5] }),
      Regulation: vectorResult(),
      People: vectorResult(),
    },
  })), false);
  assert.equal(isValidPayload(validPayload({
    vectors: {
      Infrastructure: vectorResult({ posterior: [0, 0.5, 0.5, 0, 0, 1.1] }),
      Regulation: vectorResult(),
      People: vectorResult(),
    },
  })), false);
  assert.equal(isValidPayload(validPayload({
    vectors: {
      Infrastructure: { ...vectorResult(), extra: true },
      Regulation: vectorResult(),
      People: vectorResult(),
    },
  })), false);
});

test('isValidPayload rejects malformed constraining vectors and metadata', () => {
  assert.equal(isValidPayload(validPayload({ constraining_vectors: ['Regulation', 'Regulation'] })), false);
  assert.equal(isValidPayload(validPayload({ constraining_vectors: ['Legal'] })), false);
  assert.equal(isValidPayload(validPayload({ generated_at: 'not a date' })), false);
  assert.equal(isValidPayload(validPayload({ generated_at: '2026-02-30T12:00:00Z' })), false);
  assert.equal(isValidPayload(validPayload({ generated_at: '2026-05-28' })), false);
  assert.equal(isValidPayload(validPayload({ generated_at: '2026-05-28T12:00:00+00:00' })), false);
  assert.equal(isValidPayload(validPayload({ scope: { label: null, extra: true } })), false);
});

test('generateRunId returns a 64-hex opaque ID and is unique', () => {
  const a = generateRunId();
  const b = generateRunId();
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.notEqual(a, b);
});
