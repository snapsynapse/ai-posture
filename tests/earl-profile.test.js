const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const { validateDeclaration, validateEarl } = require('../scripts/validate.js');

function read(rel) { return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')); }
function clone(o)  { return JSON.parse(JSON.stringify(o)); }

const DECL = 'docs/schema/declaration/v1/example.json';
const EARL = 'docs/schema/earl/v0/example.jsonld';

test('shipped declaration example validates clean', () => {
  const res = validateDeclaration(read(DECL));
  assert.deepEqual(res.errors, [], res.errors.join('; '));
});

test('shipped EARL example validates clean', () => {
  const res = validateEarl(read(EARL));
  assert.deepEqual(res.errors, [], res.errors.join('; '));
});

test('declaration validator catches a broken weakest-link aggregate', () => {
  const d = clone(read(DECL));
  d.aggregate.level = 4;            // claim Calibrating while Regulation is Assessing (2)
  d.aggregate.level_name = 'Calibrating';
  const res = validateDeclaration(d);
  assert.ok(res.errors.some(e => /minimum in-scope vector level/.test(e)), res.errors.join('; '));
});

test('declaration validator catches aggregate level_name mismatch', () => {
  const d = clone(read(DECL));
  d.aggregate.level_name = 'Engineering';
  const res = validateDeclaration(d);
  assert.ok(res.errors.some(e => /aggregate\.level_name/.test(e)), res.errors.join('; '));
});

test('declaration validator catches level/level_name mismatch', () => {
  const d = clone(read(DECL));
  d.vectors.People.level_name = 'Engineering';   // level is 4 (Calibrating)
  const res = validateDeclaration(d);
  assert.ok(res.errors.some(e => /does not match level_name/.test(e)), res.errors.join('; '));
});

test('declaration validator enforces N/A coherence', () => {
  const d = clone(read(DECL));
  d.vectors.Regulation = { in_scope: false, level: 2, level_name: 'Assessing', at_level_since: null };
  const res = validateDeclaration(d);
  assert.ok(res.errors.some(e => /in_scope false must have level null/.test(e)), res.errors.join('; '));
});

test('declaration validator requires empty constraining_vectors when all vectors are N/A', () => {
  const d = clone(read(DECL));
  for (const vector of ['Infrastructure', 'Regulation', 'People']) {
    d.vectors[vector] = { in_scope: false, level: null, level_name: 'N/A', at_level_since: null };
  }
  d.aggregate = { level: null, level_name: 'N/A' };
  d.constraining_vectors = ['People'];
  const res = validateDeclaration(d);
  assert.ok(res.errors.some(e => /constraining_vectors must be empty/.test(e)), res.errors.join('; '));
});

test('declaration validator rejects reserved verified assertion_basis', () => {
  const d = clone(read(DECL));
  d.assertion_basis = 'verified';
  const res = validateDeclaration(d);
  assert.ok(res.errors.some(e => /verified/.test(e) && /reserved/.test(e)), res.errors.join('; '));
});

test('declaration validator rejects impossible calendar dates', () => {
  const d = clone(read(DECL));
  d.next_review = '2026-02-31';
  const res = validateDeclaration(d);
  assert.ok(res.errors.some(e => /not a valid date/.test(e)), res.errors.join('; '));
});

test('declaration validator enforces unique constraining_vectors from schema', () => {
  const d = clone(read(DECL));
  d.vectors.People.level = 2;
  d.vectors.People.level_name = 'Assessing';
  d.constraining_vectors = ['People', 'People', 'Regulation'];
  const res = validateDeclaration(d);
  assert.ok(res.errors.some(e => /items must be unique/.test(e)), res.errors.join('; '));
});

test('declaration validator rejects an unknown property (schema additionalProperties false)', () => {
  const d = clone(read(DECL));
  d.surprise = true;
  const res = validateDeclaration(d);
  assert.ok(res.errors.some(e => /unexpected property "surprise"/.test(e)), res.errors.join('; '));
});

test('EARL validator catches a broken weakest-link postureLevel', () => {
  const e = clone(read(EARL));
  e.postureLevel = 4;
  const res = validateEarl(e);
  assert.ok(res.errors.some(m => /must equal the minimum in-scope level/.test(m)), res.errors.join('; '));
});

test('EARL validator requires an evidence pointer on a passed assertion', () => {
  const e = clone(read(EARL));
  delete e.assertion[2].result.source;
  const res = validateEarl(e);
  assert.ok(res.errors.some(m => /dct:source evidence pointer/.test(m)), res.errors.join('; '));
});

test('SEC-005 EARL rejects contradictory N/A scope and an inflated minimum', () => {
  const e = read(EARL);
  e.assertion[2].result.outcome = 'earl:inapplicable';
  delete e.assertion[2].result.level;
  e.postureLevel = 3;
  e.constrainingVector = ['Infrastructure'];
  assert.ok(validateEarl(e).errors.length > 0);
  const reverse = read(EARL);
  reverse.assertion[2].inScope = false;
  assert.ok(validateEarl(reverse).errors.length > 0);
});

test('SEC-005 EARL validates mixed scope and all-N/A aggregate fields', () => {
  const e = read(EARL);
  function exclude(a) { a.inScope = false; a.result.outcome = 'earl:inapplicable'; delete a.result.level; delete a.result.levelName; delete a.result.source; }
  exclude(e.assertion[2]);
  e.postureLevel = 3;
  e.postureLevelName = 'Integrating';
  e.constrainingVector = ['Infrastructure'];
  assert.deepEqual(validateEarl(e).errors, []);
  e.assertion.forEach(exclude);
  assert.ok(validateEarl(e).errors.length > 0);
  delete e.postureLevel;
  delete e.postureLevelName;
  delete e.constrainingVector;
  assert.deepEqual(validateEarl(e).errors, []);
  e.postureLevel = null;
  e.constrainingVector = [];
  assert.deepEqual(validateEarl(e).errors, []);
  e.constrainingVector = ['People'];
  assert.ok(validateEarl(e).errors.length > 0);
});

test('SEC-006 EARL rejects malformed input with errors rather than throwing', () => {
  for (const value of [null, 1, [], 'report', { assertion: [null] }]) {
    assert.ok(validateEarl(value).errors.length > 0);
  }
  for (const value of [null, [], 'assertion']) {
    const e = read(EARL); e.assertion[0] = value;
    assert.ok(validateEarl(e).errors.length > 0);
  }
});

test('SEC-006 EARL requires report provenance, typed scope, IRIs and nonempty evidence', () => {
  const mutations = [
    e => { delete e.assertedBy; }, e => { delete e.date; },
    e => { e.subject = { nonsense: true }; }, e => { e.assertedBy = 123; },
    e => { e.assertion[0].assertedBy = 123; }, e => { e.assertion[0].subject = false; },
    e => { delete e.assertion[0].inScope; }, e => { e.assertion[0].inScope = 'true'; },
    e => { e.assertion[0].result.source = []; }, e => { e.assertion[0].result.source = [false]; },
    e => { e.assertion[0].result.source = ['https://acme.example/good', 'not an IRI']; },
    e => { e.assertion[0].result.source = 'https://acme.example/has space'; },
    e => { e.assertion[0].result.source = 'https://acme.example/back\\slash'; },
    e => { e.assertion[0].result.source = 'https://acme.example/%zz'; },
    e => { e.assertion[0].result.atLevelSince = '2026-02-31'; },
    e => { e.assertion[0].result = []; }, e => { e.assertion[0].test = 'not an IRI'; }
  ];
  for (const mutate of mutations) {
    const e = read(EARL); mutate(e);
    assert.ok(validateEarl(e).errors.length > 0, mutate.toString());
  }
});

test('SEC-006 EARL criterion IRIs must match the declared vector and level', () => {
  for (const iri of ['https://aiposture.org/criteria/v1/regulation/4', 'https://aiposture.org/criteria/v1/people/1', 'https://unrelated.example/anything']) {
    const e = read(EARL); e.assertion[0].test = iri;
    assert.ok(validateEarl(e).errors.some(error => /criterion IRI/.test(error)));
  }
});

test('SEC-006 EARL accepts string and JSON-LD IRI references and evidence arrays', () => {
  const e = read(EARL);
  e.subject = e.subject['@id'];
  e.assertedBy = e.assertedBy['@id'];
  e.assertion[0].subject = { '@id': e.subject };
  e.assertion[0].assertedBy = { '@id': e.assertedBy };
  e.assertion[0].result.source = ['https://acme.example/a', { '@id': 'urn:example:evidence' }];
  assert.deepEqual(validateEarl(e).errors, []);
});

test('criterion IRI registry covers three vectors x five levels', () => {
  const reg = read('docs/criteria/v1/index.json');
  assert.equal(reg.criteria.length, 15);
  const vectors = new Set(reg.criteria.map(c => c.vector));
  assert.deepEqual([...vectors].sort(), ['Infrastructure', 'People', 'Regulation']);
  for (const c of reg.criteria) {
    assert.match(c.iri, /^https:\/\/aiposture\.org\/criteria\/v1\/(people|infrastructure|regulation)\/[1-5]$/);
    assert.ok(c.level >= 1 && c.level <= 5);
    assert.ok(c.assertion && c.evidence.length >= 1);
  }
});

test('EARL example test IRIs all resolve to registry criteria', () => {
  const reg = read('docs/criteria/v1/index.json');
  const known = new Set(reg.criteria.map(c => c.iri));
  for (const a of read(EARL).assertion) {
    assert.ok(known.has(a.test), `EARL test IRI ${a.test} is not in the criterion registry`);
  }
});

test('EARL profile surfaces are published', () => {
  for (const f of ['context.jsonld', 'shapes.ttl', 'profile.md', 'example.jsonld']) {
    assert.ok(fs.existsSync(path.join(ROOT, 'docs/schema/earl/v0', f)), `${f} must exist`);
  }
});

test('every criterion in the registry has a resolvable HTML page', () => {
  const reg = read('docs/criteria/v1/index.json');
  for (const c of reg.criteria) {
    const route = c.vector.toLowerCase();
    const rel = path.join('docs', 'criteria', 'v1', route, String(c.level), 'index.html');
    assert.ok(fs.existsSync(path.join(ROOT, rel)), `missing criterion page for ${c.iri} (expected ${rel}). Run npm run build.`);
  }
});

test('criterion registry index and per-vector index pages are published', () => {
  assert.ok(fs.existsSync(path.join(ROOT, 'docs/criteria/v1/index.html')), 'docs/criteria/v1/index.html missing. Run npm run build.');
  for (const v of ['people', 'infrastructure', 'regulation']) {
    assert.ok(fs.existsSync(path.join(ROOT, 'docs/criteria/v1', v, 'index.html')), `docs/criteria/v1/${v}/index.html missing. Run npm run build.`);
  }
});

test('criterion page content carries assertion text and canonical IRI', () => {
  const reg = read('docs/criteria/v1/index.json');
  const sample = reg.criteria.find(c => c.vector === 'Regulation' && c.level === 2);
  const html = fs.readFileSync(path.join(ROOT, 'docs/criteria/v1/regulation/2/index.html'), 'utf8');
  assert.ok(html.includes(sample.iri), 'criterion page must include its IRI');
  assert.ok(html.includes(sample.assertion), 'criterion page must include the rubric assertion');
  assert.ok(/application\/ld\+json/.test(html), 'criterion page must carry JSON-LD');
});

test('EARL example carries a draft Obligation-First linkage block pending steward review', () => {
  const e = read(EARL);
  assert.ok(e._draftObligationFirstLinkage, 'EARL example must carry _draftObligationFirstLinkage');
  assert.ok(/DRAFT/.test(e._draftObligationFirstLinkage._status), 'draft marker must say DRAFT');
  assert.ok(Array.isArray(e._draftObligationFirstLinkage.linkages) && e._draftObligationFirstLinkage.linkages.length > 0, 'linkages array must be non-empty');
  for (const link of e._draftObligationFirstLinkage.linkages) {
    assert.match(link.criterion, /^https:\/\/aiposture\.org\/criteria\/v1\/regulation\/[1-5]$/);
    assert.ok(link.proposedSource.every(s => /^https:\/\/everyailaw\.com\//.test(s)), 'proposed sources must point at everyailaw.com');
  }
});
