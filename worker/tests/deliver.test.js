import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isValidPayload, generateRunId } from '../src/deliver.js';

// Captured from a complete adaptive flow in the 696b42b frontend: O1=a,
// O2=[eu], O3=a, then option index 1 for each selected bank question.
// Timestamp is fixed for reproducibility; estimates and posteriors are unchanged.
const LEGACY_RESULT = JSON.parse(readFileSync(new URL('./fixtures/estimate-1.0.0.json', import.meta.url), 'utf8'));

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
    constraining_vectors: ['Infrastructure', 'Regulation', 'People'],
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

test('SEC-007 rejects contradictory level names, scope, posterior and aggregate fields', () => {
  const mutations = [
    p => { p.aggregate.level = 5; },
    p => { p.aggregate.level_name = 'Perceiving'; },
    p => { p.vectors.People.level_name = 'Engineering'; },
    p => { p.vectors.People.level = null; },
    p => { p.vectors.People.in_scope = false; },
    p => { p.vectors.People.posterior = [1, 1, 1, 1, 1, 1]; },
    p => { p.vectors.People.posterior = [0, .75, .1, .1, .05, 0]; },
    p => { p.constraining_vectors = ['Regulation']; },
    p => { p.constraining_vectors = []; }
  ];
  for (const mutate of mutations) {
    const payload = validPayload(); mutate(payload);
    assert.equal(isValidPayload(payload), false, mutate.toString());
  }
});

test('SEC-007 accepts mixed scope with the complete minimum-vector set', () => {
  const p = validPayload();
  p.vectors.People = vectorResult({ in_scope: false, level: null, level_name: 'N/A', posterior: [1, 0, 0, 0, 0, 0], evidence_checklist: [] });
  p.constraining_vectors = ['Regulation', 'Infrastructure'];
  assert.equal(isValidPayload(p), true);
  p.vectors.People.posterior = [0, .1, .75, .1, .05, 0];
  assert.equal(isValidPayload(p), false);
});

test('SEC-007 accepts all-N/A only with a null aggregate and no constraining vectors', () => {
  const p = validPayload({ aggregate: { level: null, level_name: 'N/A' }, constraining_vectors: [] });
  for (const name of Object.keys(p.vectors)) {
    p.vectors[name] = vectorResult({ in_scope: false, level: null, level_name: 'N/A', posterior: [1, 0, 0, 0, 0, 0], evidence_checklist: [] });
  }
  assert.equal(isValidPayload(p), true);
  p.aggregate = { level: 2, level_name: 'Assessing' };
  assert.equal(isValidPayload(p), false);
  p.aggregate = { level: null, level_name: 'N/A' };
  p.constraining_vectors = ['People'];
  assert.equal(isValidPayload(p), false);
});

test('SEC-007 posterior normalization tolerates six-decimal exports and rounded modal ties', () => {
  const p = validPayload();
  p.vectors.People.posterior = [0, .333333, .333333, .333333, 0, 0];
  assert.equal(isValidPayload(p), true);
  p.vectors.People.posterior = [0, .33333, .33333, .33333, 0, 0];
  assert.equal(isValidPayload(p), false);
  p.vectors.People.posterior = [0, .1, NaN, .1, .05, 0];
  assert.equal(isValidPayload(p), false);
});

test('R2 accepts a real old-client estimate with nonzero slot-zero probabilities', () => {
  assert.ok(Object.values(LEGACY_RESULT.vectors).every(vector => vector.posterior[0] > 0));
  assert.equal(isValidPayload(LEGACY_RESULT), true);
});

test('R2 posterior compatibility is limited to exact version 1.0.0', () => {
  for (const version of ['1.1.0', '2.0.0', '1.0.0 ', 'v1.0.0']) {
    assert.equal(isValidPayload({ ...LEGACY_RESULT, version }), false, version);
  }
});

test('R2 legacy version does not bypass semantic or level-zero rejection', () => {
  const mutations = [
    p => { p.aggregate.level = 5; },
    p => { p.aggregate.level_name = 'Perceiving'; },
    p => { p.vectors.People.level_name = 'Engineering'; },
    p => { p.vectors.People.in_scope = false; },
    p => { p.vectors.People.posterior = [1, 1, 1, 1, 1, 1]; },
    p => { p.vectors.People.posterior = [.9, 0, 0, .1, 0, 0]; },
    p => { p.vectors.People.level = 0; p.vectors.People.level_name = 'Ignoring'; },
    p => { p.constraining_vectors = []; }
  ];
  for (const mutate of mutations) {
    const payload = structuredClone(LEGACY_RESULT); mutate(payload);
    assert.equal(isValidPayload(payload), false, mutate.toString());
  }
});
