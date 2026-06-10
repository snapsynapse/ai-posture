const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SCHEMA_PATH = 'docs/schema/declaration/v1/ai-posture-declaration.schema.json';

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

const MINIMAL_VALID = {
  type: 'AI Posture Declaration',
  spec_version: 'v1.1.0',
  generated_at: '2026-06-10T00:00:00Z',
  next_review: '2026-12-10',
  subject: { name: 'Acme Corp', domain: 'https://acme.example.com/' },
  assertion_basis: 'self-assertion',
  aggregate: { level: 2, level_name: 'Assessing' },
  constraining_vectors: ['Regulation'],
  vectors: {
    Infrastructure: { in_scope: true,  level: 3, level_name: 'Integrating', at_level_since: '2026-01-01' },
    Regulation:     { in_scope: true,  level: 2, level_name: 'Assessing',   at_level_since: null },
    People:         { in_scope: false, level: null, level_name: 'N/A',      at_level_since: null }
  }
};

test('declaration schema file exists and is valid JSON', () => {
  const raw = read(SCHEMA_PATH);
  const schema = JSON.parse(raw);
  assert.equal(schema.$id, 'https://aiposture.org/schema/declaration/v1/ai-posture-declaration.schema.json');
  assert.equal(schema.title, 'AI Posture Declaration');
  assert.ok(schema.properties, 'schema must have properties');
});

test('declaration schema has required fields declared', () => {
  const schema = JSON.parse(read(SCHEMA_PATH));
  const required = schema.required;
  for (const field of ['type', 'spec_version', 'generated_at', 'next_review', 'subject', 'assertion_basis', 'aggregate', 'constraining_vectors', 'vectors']) {
    assert.ok(required.includes(field), `schema required[] must include "${field}"`);
  }
});

test('declaration schema assertion_basis enum is complete', () => {
  const schema = JSON.parse(read(SCHEMA_PATH));
  const values = schema.properties.assertion_basis.enum;
  assert.deepEqual(values.sort(), ['self-assertion', 'self-estimate', 'verified'].sort());
});

test('declaration schema vector_declaration requires at_level_since', () => {
  const schema = JSON.parse(read(SCHEMA_PATH));
  const vectorDef = schema.$defs.vector_declaration;
  assert.ok(vectorDef.required.includes('at_level_since'), 'vector_declaration must require at_level_since');
});

test('minimal valid declaration satisfies schema required fields', () => {
  const schema = JSON.parse(read(SCHEMA_PATH));
  const decl = MINIMAL_VALID;
  for (const field of schema.required) {
    assert.ok(field in decl, `minimal declaration missing required field: ${field}`);
  }
  for (const vector of ['Infrastructure', 'Regulation', 'People']) {
    assert.ok(vector in decl.vectors, `vectors missing: ${vector}`);
    const v = decl.vectors[vector];
    for (const vfield of schema.$defs.vector_declaration.required) {
      assert.ok(vfield in v, `vector ${vector} missing required field: ${vfield}`);
    }
  }
});

test('declaration schema subject requires name and domain', () => {
  const schema = JSON.parse(read(SCHEMA_PATH));
  const subjectRequired = schema.properties.subject.required;
  assert.ok(subjectRequired.includes('name'), 'subject must require name');
  assert.ok(subjectRequired.includes('domain'), 'subject must require domain');
});

test('declaration schema evidence field is not required', () => {
  const schema = JSON.parse(read(SCHEMA_PATH));
  assert.ok(!schema.required.includes('evidence'), 'evidence must be optional');
  assert.ok('evidence' in schema.properties, 'evidence must be present in properties');
});
