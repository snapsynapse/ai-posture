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
const {
  LEVEL_NAMES,
  VECTORS,
  isDate,
  isDateTime,
  isUri,
  validateDeclaration
} = require('../docs/check/validator.js');

const ROOT = path.join(__dirname, '..');
const OUTCOMES = ['earl:passed', 'earl:failed', 'earl:cantTell', 'earl:inapplicable', 'earl:untested'];

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
