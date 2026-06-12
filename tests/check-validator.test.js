const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const CHECK_HTML = fs.readFileSync(path.join(ROOT, 'docs/check/index.html'), 'utf8');
const { validateDeclaration } = require('../docs/check/validator.js');

function read(rel) { return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')); }
function clone(o) { return JSON.parse(JSON.stringify(o)); }

const DECL = 'docs/schema/declaration/v1/example.json';

test('/check loads the shared declaration validator', () => {
  assert.equal(CHECK_HTML.includes('<script src="/check/validator.js"></script>'), true);
  assert.equal(CHECK_HTML.includes('window.AIPostureDeclarationValidator'), true);
  assert.equal(CHECK_HTML.includes('function validate(d)'), false);
});

test('/check shared validator accepts the worked example', () => {
  const res = validateDeclaration(read(DECL));
  assert.deepEqual(res.errors, [], res.errors.join('; '));
});

test('/check shared validator rejects reserved verified assertion_basis', () => {
  const d = clone(read(DECL));
  d.assertion_basis = 'verified';
  const res = validateDeclaration(d);
  assert.ok(res.errors.some(e => /verified/.test(e) && /reserved/.test(e)), res.errors.join('; '));
});

test('/check shared validator rejects impossible next_review dates', () => {
  const d = clone(read(DECL));
  d.next_review = '2026-02-31';
  const res = validateDeclaration(d);
  assert.ok(res.errors.some(e => /not a valid date/.test(e)), res.errors.join('; '));
});

test('/check shared validator rejects all-N/A declarations with constraining vectors', () => {
  const d = clone(read(DECL));
  for (const vector of ['Infrastructure', 'Regulation', 'People']) {
    d.vectors[vector] = { in_scope: false, level: null, level_name: 'N/A', at_level_since: null };
  }
  d.aggregate = { level: null, level_name: 'N/A' };
  d.constraining_vectors = ['People'];
  const res = validateDeclaration(d);
  assert.ok(res.errors.some(e => /constraining_vectors must be empty/.test(e)), res.errors.join('; '));
});
