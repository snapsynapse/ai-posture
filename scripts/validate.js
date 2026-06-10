#!/usr/bin/env node
'use strict';

// AI Posture reference validator. Zero dependencies, Node builtins only.
//
// Validates:
//   - an AI Posture declaration (/.well-known/ai-posture.json) against its
//     published JSON Schema, plus the semantic rules the schema cannot express
//     (weakest-link coherence, N/A handling, decay).
//   - an AI Posture EARL document against the v0 profile structural shapes,
//     including weakest-link coherence.
//
// Usage:
//   node scripts/validate.js                      validate the shipped examples
//   node scripts/validate.js declaration <file>   validate a declaration
//   node scripts/validate.js earl <file>          validate an EARL document
//
// Exit code 0 = valid (warnings allowed), 1 = invalid, 2 = usage/IO error.

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DECLARATION_SCHEMA = path.join(ROOT, 'docs/schema/declaration/v1/ai-posture-declaration.schema.json');

const LEVEL_NAMES = ['N/A', 'Perceiving', 'Assessing', 'Integrating', 'Calibrating', 'Engineering'];
const VECTORS = ['People', 'Infrastructure', 'Regulation'];
const OUTCOMES = ['earl:passed', 'earl:failed', 'earl:cantTell', 'earl:inapplicable', 'earl:untested'];

// ── minimal JSON Schema subset validator ──────────────────────────────────────
// Supports the constructs used by the declaration schema: type (incl. null and
// arrays of types), const, enum, required, properties, additionalProperties:false,
// $ref to #/$defs, items, minItems/maxItems, minimum/maximum, minLength, pattern,
// and format (date, date-time, uri).

function isDate(s)     { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)); }
function isDateTime(s) { return typeof s === 'string' && !Number.isNaN(Date.parse(s)) && /T/.test(s); }
function isUri(s)      { return typeof s === 'string' && /^[a-z][a-z0-9+.-]*:\S/i.test(s); }

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (Number.isInteger(v)) return 'integer';
  return typeof v; // string | number | boolean | object
}

function checkType(v, t) {
  if (Array.isArray(t)) return t.some(x => checkType(v, x));
  if (t === 'integer') return Number.isInteger(v);
  if (t === 'number')  return typeof v === 'number';
  if (t === 'null')    return v === null;
  return typeOf(v) === t;
}

function resolveRef(ref, root) {
  // only supports local #/$defs/Name
  const m = ref.match(/^#\/\$defs\/(.+)$/);
  if (!m || !root.$defs || !root.$defs[m[1]]) throw new Error('unsupported $ref: ' + ref);
  return root.$defs[m[1]];
}

function validateAgainst(schema, value, root, pathStr, errors) {
  if (schema.$ref) schema = resolveRef(schema.$ref, root);

  if ('const' in schema && value !== schema.const) {
    errors.push(`${pathStr}: must equal ${JSON.stringify(schema.const)}`);
    return;
  }
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${pathStr}: must be one of ${JSON.stringify(schema.enum)}`);
  }
  if (schema.type && !checkType(value, schema.type)) {
    errors.push(`${pathStr}: expected type ${JSON.stringify(schema.type)}, got ${typeOf(value)}`);
    return; // further checks assume the type held
  }
  if (typeof value === 'string') {
    if (schema.minLength != null && value.length < schema.minLength) errors.push(`${pathStr}: shorter than minLength ${schema.minLength}`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${pathStr}: does not match pattern ${schema.pattern}`);
    if (schema.format === 'date' && !isDate(value)) errors.push(`${pathStr}: not a valid date`);
    if (schema.format === 'date-time' && !isDateTime(value)) errors.push(`${pathStr}: not a valid date-time`);
    if (schema.format === 'uri' && !isUri(value)) errors.push(`${pathStr}: not a valid URI`);
  }
  if (typeof value === 'number') {
    if (schema.minimum != null && value < schema.minimum) errors.push(`${pathStr}: below minimum ${schema.minimum}`);
    if (schema.maximum != null && value > schema.maximum) errors.push(`${pathStr}: above maximum ${schema.maximum}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems != null && value.length < schema.minItems) errors.push(`${pathStr}: fewer than minItems ${schema.minItems}`);
    if (schema.maxItems != null && value.length > schema.maxItems) errors.push(`${pathStr}: more than maxItems ${schema.maxItems}`);
    if (schema.items) value.forEach((it, i) => validateAgainst(schema.items, it, root, `${pathStr}[${i}]`, errors));
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const props = schema.properties || {};
    (schema.required || []).forEach(k => {
      if (!(k in value)) errors.push(`${pathStr}: missing required property "${k}"`);
    });
    for (const k of Object.keys(value)) {
      if (props[k]) validateAgainst(props[k], value[k], root, `${pathStr}.${k}`, errors);
      else if (schema.additionalProperties === false) errors.push(`${pathStr}: unexpected property "${k}"`);
    }
  }
}

// ── declaration semantics beyond JSON Schema ──────────────────────────────────

function declarationSemantics(d, errors, warnings) {
  const inScope = VECTORS.filter(v => d.vectors && d.vectors[v] && d.vectors[v].in_scope);
  // N/A handling
  for (const v of VECTORS) {
    const e = d.vectors && d.vectors[v];
    if (!e) continue;
    if (e.in_scope === false && (e.level !== null || e.level_name !== 'N/A')) {
      errors.push(`vectors.${v}: in_scope false must have level null and level_name "N/A"`);
    }
    if (e.in_scope === true && (e.level == null || e.level_name === 'N/A')) {
      errors.push(`vectors.${v}: in_scope true must have a level 1-5 and a non-N/A level_name`);
    }
    if (e.level != null && e.level_name && LEVEL_NAMES[e.level] !== e.level_name) {
      errors.push(`vectors.${v}: level ${e.level} does not match level_name "${e.level_name}"`);
    }
  }
  // weakest-link coherence
  if (inScope.length === 0) {
    if (d.aggregate && d.aggregate.level !== null) errors.push('aggregate.level must be null when all vectors are N/A');
  } else {
    const levels = inScope.map(v => d.vectors[v].level);
    const min = Math.min(...levels);
    if (d.aggregate.level !== min) errors.push(`aggregate.level ${d.aggregate.level} must equal the minimum in-scope vector level ${min}`);
    const constraining = inScope.filter(v => d.vectors[v].level === min).sort();
    const declared = [...(d.constraining_vectors || [])].sort();
    if (JSON.stringify(constraining) !== JSON.stringify(declared)) {
      errors.push(`constraining_vectors ${JSON.stringify(declared)} must equal in-scope vectors at the minimum ${JSON.stringify(constraining)}`);
    }
  }
  // decay
  if (d.next_review && isDate(d.next_review) && Date.parse(d.next_review) < Date.now()) {
    warnings.push(`declaration is stale: next_review ${d.next_review} is in the past (weight as a weaker signal)`);
  }
}

function validateDeclaration(d) {
  const errors = [], warnings = [];
  const schema = JSON.parse(fs.readFileSync(DECLARATION_SCHEMA, 'utf8'));
  validateAgainst(schema, d, schema, 'declaration', errors);
  if (errors.length === 0) declarationSemantics(d, errors, warnings);
  return { errors, warnings };
}

// ── EARL profile structural validation ────────────────────────────────────────

function validateEarl(doc) {
  const errors = [], warnings = [];
  const req = (cond, msg) => { if (!cond) errors.push(msg); };

  req(doc['@type'] === 'PostureReport' || doc['@type'] === 'apos:PostureReport', '@type must be PostureReport');
  req(typeof doc.specVersion === 'string' && /^v\d+\.\d+(\.\d+)?$/.test(doc.specVersion), 'specVersion must match v<major>.<minor>[.<patch>]');
  req(doc.subject != null, 'missing subject');
  req(isDate(doc.nextReview), 'nextReview must be an ISO date');

  const assertions = Array.isArray(doc.assertion) ? doc.assertion : [];
  req(assertions.length >= 1, 'at least one assertion required');

  const inScopeLevels = [];
  assertions.forEach((a, i) => {
    const at = `assertion[${i}]`;
    req(a.assertedBy != null, `${at}: missing assertedBy`);
    req(a.subject != null, `${at}: missing subject`);
    req(VECTORS.includes(a.vector), `${at}: vector must be one of ${VECTORS.join(', ')}`);
    req(typeof a.test === 'string' && isUri(a.test), `${at}: test must be a criterion IRI`);
    const r = a.result || {};
    req(OUTCOMES.includes(r.outcome), `${at}: result.outcome must be one of ${OUTCOMES.join(', ')}`);
    req(isDateTime(r.date), `${at}: result.date must be an ISO date-time`);
    if (a.inScope === false || r.outcome === 'earl:inapplicable') {
      // N/A: excluded from minimum
    } else {
      req(Number.isInteger(r.level) && r.level >= 1 && r.level <= 5, `${at}: result.level must be 1-5 for in-scope assertions`);
      req(r.source != null, `${at}: a passed assertion must carry a dct:source evidence pointer`);
      if (Number.isInteger(r.level)) inScopeLevels.push({ vector: a.vector, level: r.level });
      if (r.level != null && r.levelName && LEVEL_NAMES[r.level] !== r.levelName) {
        errors.push(`${at}: level ${r.level} does not match levelName "${r.levelName}"`);
      }
    }
  });

  // weakest-link coherence
  if (inScopeLevels.length > 0) {
    const min = Math.min(...inScopeLevels.map(x => x.level));
    req(doc.postureLevel === min, `postureLevel ${doc.postureLevel} must equal the minimum in-scope level ${min}`);
    const constraining = [...new Set(inScopeLevels.filter(x => x.level === min).map(x => x.vector))].sort();
    const declared = [].concat(doc.constrainingVector || []).sort();
    if (JSON.stringify(constraining) !== JSON.stringify(declared)) {
      errors.push(`constrainingVector ${JSON.stringify(declared)} must equal in-scope vectors at the minimum ${JSON.stringify(constraining)}`);
    }
  }
  if (isDate(doc.nextReview) && Date.parse(doc.nextReview) < Date.now()) {
    warnings.push(`EARL report is stale: nextReview ${doc.nextReview} is in the past`);
  }
  return { errors, warnings };
}

// ── CLI ───────────────────────────────────────────────────────────────────────

function report(label, res) {
  res.warnings.forEach(w => console.warn(`  warn  ${label}: ${w}`));
  if (res.errors.length === 0) { console.log(`  ok    ${label}`); return true; }
  res.errors.forEach(e => console.error(`  FAIL  ${label}: ${e}`));
  return false;
}

function main(argv) {
  const [mode, file] = argv;
  try {
    if (!mode) {
      // self-test on shipped examples
      let ok = true;
      ok = report('declaration example', validateDeclaration(JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/schema/declaration/v1/example.json'), 'utf8')))) && ok;
      ok = report('EARL example', validateEarl(JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/schema/earl/v0/example.jsonld'), 'utf8')))) && ok;
      process.exit(ok ? 0 : 1);
    }
    if (!file) { console.error('usage: node scripts/validate.js [declaration|earl] <file>'); process.exit(2); }
    const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
    const res = mode === 'declaration' ? validateDeclaration(doc)
              : mode === 'earl'        ? validateEarl(doc)
              : null;
    if (!res) { console.error(`unknown mode "${mode}"`); process.exit(2); }
    process.exit(report(`${mode} ${file}`, res) ? 0 : 1);
  } catch (e) {
    console.error('error:', e.message);
    process.exit(2);
  }
}

if (require.main === module) main(process.argv.slice(2));

module.exports = { validateDeclaration, validateEarl };
