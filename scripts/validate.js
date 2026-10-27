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
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const iri = value => {
    if (typeof value !== 'string' || /[\s\u0000-\u001f\u007f<>"{}|\\^`]/u.test(value) || /%(?![0-9a-f]{2})/i.test(value)) return false;
    try { return Boolean(new URL(value).protocol); } catch { return false; }
  };
  // JSON-LD permits an IRI string or an identified node with descriptive fields.
  const reference = value => iri(value) || (object(value) && iri(value['@id']));
  const evidence = value => Array.isArray(value)
    ? value.length > 0 && value.every(reference) : reference(value);
  if (!object(doc)) return { errors: ['EARL report must be a JSON object'], warnings };

  req(doc['@type'] === 'PostureReport' || doc['@type'] === 'apos:PostureReport', '@type must be PostureReport');
  req(typeof doc.specVersion === 'string' && /^v\d+\.\d+(\.\d+)?$/.test(doc.specVersion), 'specVersion must match v<major>.<minor>[.<patch>]');
  req(reference(doc.subject), 'subject must identify an IRI');
  req(reference(doc.assertedBy), 'assertedBy must identify an IRI');
  req(isDateTime(doc.date), 'date must be an ISO date-time');
  req(isDate(doc.nextReview), 'nextReview must be an ISO date');

  const assertions = Array.isArray(doc.assertion) ? doc.assertion : [];
  req(assertions.length >= 1, 'at least one assertion required');

  const inScopeLevels = [];
  assertions.forEach((a, i) => {
    const at = `assertion[${i}]`;
    if (!object(a)) { errors.push(`${at}: must be a JSON object`); return; }
    req(reference(a.assertedBy), `${at}: assertedBy must identify an IRI`);
    req(reference(a.subject), `${at}: subject must identify an IRI`);
    req(VECTORS.includes(a.vector), `${at}: vector must be one of ${VECTORS.join(', ')}`);
    req(typeof a.inScope === 'boolean', `${at}: inScope must be boolean`);
    req(iri(a.test), `${at}: test must be a criterion IRI`);
    if (!object(a.result)) { errors.push(`${at}: result must be a JSON object`); return; }
    const r = a.result;
    req(OUTCOMES.includes(r.outcome), `${at}: result.outcome must be one of ${OUTCOMES.join(', ')}`);
    req(isDateTime(r.date), `${at}: result.date must be an ISO date-time`);
    if (r.atLevelSince !== undefined) req(isDate(r.atLevelSince), `${at}: result.atLevelSince must be an ISO date`);
    if (r.outcome === 'earl:passed' || r.source !== undefined) {
      req(evidence(r.source), `${at}: a passed assertion must carry a nonempty dct:source evidence pointer of valid IRIs`);
    }
    if (a.inScope === false) {
      req(r.outcome === 'earl:inapplicable', `${at}: out-of-scope assertions must be inapplicable`);
      req(r.level == null, `${at}: N/A assertions must not carry a level`);
      req(r.levelName == null || r.levelName === 'N/A', `${at}: N/A assertions must not carry a maturity levelName`);
    } else if (a.inScope === true) {
      req(r.outcome !== 'earl:inapplicable', `${at}: in-scope assertions cannot be inapplicable`);
      req(Number.isInteger(r.level) && r.level >= 1 && r.level <= 5, `${at}: result.level must be 1-5 for in-scope assertions`);
      if (VECTORS.includes(a.vector) && Number.isInteger(r.level)) {
        req(a.test === `https://aiposture.org/criteria/v1/${a.vector.toLowerCase()}/${r.level}`,
          `${at}: test must match the published criterion IRI for its vector and level`);
      }
      if (Number.isInteger(r.level) && r.level >= 1 && r.level <= 5) inScopeLevels.push({ vector: a.vector, level: r.level });
      if (r.levelName !== undefined && LEVEL_NAMES[r.level] !== r.levelName) {
        errors.push(`${at}: level ${r.level} does not match levelName "${r.levelName}"`);
      }
    }
  });

  // weakest-link coherence
  if (inScopeLevels.length > 0) {
    const min = Math.min(...inScopeLevels.map(x => x.level));
    req(doc.postureLevel === min, `postureLevel ${doc.postureLevel} must equal the minimum in-scope level ${min}`);
    if (doc.postureLevelName !== undefined) req(doc.postureLevelName === LEVEL_NAMES[min], 'postureLevelName must match the aggregate level');
    const constraining = [...new Set(inScopeLevels.filter(x => x.level === min).map(x => x.vector))].sort();
    const declared = [].concat(doc.constrainingVector || []).sort();
    if (JSON.stringify(constraining) !== JSON.stringify(declared)) {
      errors.push(`constrainingVector ${JSON.stringify(declared)} must equal in-scope vectors at the minimum ${JSON.stringify(constraining)}`);
    }
  } else if (assertions.length > 0 && assertions.every(a => object(a) && a.inScope === false)) {
    req(doc.postureLevel == null, 'postureLevel must be absent or null when all assertions are N/A');
    req(doc.postureLevelName == null || doc.postureLevelName === 'N/A', 'postureLevelName must be absent or N/A when all assertions are N/A');
    req(doc.constrainingVector === undefined || (Array.isArray(doc.constrainingVector) && doc.constrainingVector.length === 0), 'constrainingVector must be absent or empty when all assertions are N/A');
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
