const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const QUESTIONS = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/assess/data/questions.json'), 'utf8'));
const LIKELIHOODS = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/assess/data/likelihoods.json'), 'utf8'));
const RUBRIC = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/assess/data/rubric.json'), 'utf8'));

function allBankQuestions() {
  return Object.entries(QUESTIONS.banks).flatMap(([vector, entries]) =>
    entries.map(entry => ({ vector, entry }))
  );
}

test('every bank question has a matching likelihood table', () => {
  const missing = allBankQuestions()
    .filter(({ entry }) => !LIKELIHOODS.questions[entry.id])
    .map(({ entry }) => entry.id);

  assert.deepEqual(missing, []);
});

test('question option counts match their likelihood tables', () => {
  allBankQuestions().forEach(({ entry }) => {
    const likelihood = LIKELIHOODS.questions[entry.id];
    assert.ok(likelihood, 'missing likelihood for ' + entry.id);
    assert.equal(
      likelihood.options.length,
      entry.options.length,
      'option count mismatch for ' + entry.id
    );
    for (let level = 0; level < 6; level++) {
      const row = likelihood.table[String(level)];
      assert.ok(Array.isArray(row), 'missing likelihood row ' + level + ' for ' + entry.id);
      assert.equal(row.length, entry.options.length, 'likelihood width mismatch for ' + entry.id + ' level ' + level);
    }
  });
});

test('likelihood rows sum to one', () => {
  Object.entries(LIKELIHOODS.questions).forEach(([qid, likelihood]) => {
    for (let level = 0; level < 6; level++) {
      const row = likelihood.table[String(level)];
      assert.ok(Array.isArray(row), 'missing likelihood row ' + level + ' for ' + qid);
      const total = row.reduce((sum, value) => sum + value, 0);
      assert.ok(Math.abs(total - 1) < 1e-9, 'likelihood row must sum to 1 for ' + qid + ' level ' + level);
    }
  });
});

test('every vector has rubric entries for all six levels', () => {
  ['Infrastructure', 'Regulation', 'People'].forEach(vector => {
    const levels = (RUBRIC.vectors[vector] || []).map(entry => entry.level).sort((a, b) => a - b);
    assert.deepEqual(levels, [0, 1, 2, 3, 4, 5], 'rubric levels incomplete for ' + vector);
  });
});

test('rubric contains no provider-routing metadata', () => {
  assert.equal(Object.hasOwn(RUBRIC, 'handoff'), false);
  const serialized = JSON.stringify(RUBRIC);
  assert.doesNotMatch(serialized, /paice\.work|siteline\.to|everyailaw\.com/);
});
