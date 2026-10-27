const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const BAYES_JS = fs.readFileSync(path.join(ROOT, 'docs/assess/js/bayes.js'), 'utf8');
const LIKELIHOODS = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/assess/data/likelihoods.json'), 'utf8'));

function loadBayes() {
  const context = { window: {}, globalThis: {} };
  vm.runInNewContext(BAYES_JS, context, { filename: 'bayes.js' });
  return context.window.AIPostureBayes || context.globalThis.AIPostureBayes;
}

test('exposureCount handles mixed and empty opener answers', () => {
  const B = loadBayes();

  assert.equal(B.exposureCount(), '0');
  assert.equal(B.exposureCount(['none']), '0');
  assert.equal(B.exposureCount(['dk']), '0');
  assert.equal(B.exposureCount(['us_other']), '1');
  assert.equal(B.exposureCount(['none', 'eu']), '1');
  assert.equal(B.exposureCount(['eu', 'uk']), '2');
});

test('applyTilt remains normalized and respects the configured cap', () => {
  const B = loadBayes();
  const prior = B.BASE_PRIOR.slice();
  const aggressiveTilt = [0.1, 0.2, 0.4, 1.6, 2.4, 3.2];

  const tilted = B.applyTilt(prior, aggressiveTilt);
  const mass = tilted.reduce((sum, value) => sum + value, 0);

  assert.ok(Math.abs(mass - 1) < 1e-12, 'tilted priors should remain normalized');
  assert.ok(B.totalVariation(prior, tilted) <= 0.100000000001, 'tilt should not exceed TILT_CAP');
});

test('updatePosterior produces a normalized posterior distribution', () => {
  const B = loadBayes();
  const posterior = B.updatePosterior(B.BASE_PRIOR, LIKELIHOODS.questions.I1, 0);
  const mass = posterior.reduce((sum, value) => sum + value, 0);

  assert.ok(Math.abs(mass - 1) < 1e-12, 'posterior should sum to one');
  assert.equal(posterior.length, 6, 'posterior should preserve the six-level model');
});

test('buildPriors excludes skipped vectors from aggregate scope', () => {
  const B = loadBayes();
  const built = B.buildPriors({
    O1: { value: 'a', skip: false },
    O2: { value: ['none'], skip: true },
    O3: { value: 'c', skip: true }
  });

  assert.equal(built.inScope.People, true);
  assert.equal(built.inScope.Regulation, false);
  assert.equal(built.inScope.Infrastructure, false);
});

test('SEC-004 all opener combinations keep in-scope probability on levels one through five', () => {
  const B = loadBayes();
  for (const o1 of ['a', 'b', 'c', 'd', 'e']) {
    for (const o2 of [['none'], ['us_other'], ['eu', 'uk']]) {
      for (const o3 of ['a', 'b', 'c', 'd']) {
        const built = B.buildPriors({ O1: { value: o1, skip: o1 === 'd' }, O2: { value: o2, skip: o2[0] === 'none' }, O3: { value: o3, skip: o3 === 'c' } });
        for (const vector of B.VECTORS) {
          const prior = built.priors[vector];
          assert.equal(prior[0], built.inScope[vector] ? 0 : 1);
          assert.ok(Math.abs(prior.reduce((sum, x) => sum + x, 0) - 1) < 1e-12);
          if (!built.inScope[vector]) continue;
          for (const q of Object.values(LIKELIHOODS.questions)) {
            for (let option = 0; option < q.options.length; option++) {
              const posterior = B.updatePosterior(prior, q, option);
              assert.equal(posterior[0], 0);
              assert.ok(B.modeLevel(posterior) >= 1);
              assert.ok(Math.abs(posterior.reduce((sum, x) => sum + x, 0) - 1) < 1e-12);
            }
          }
        }
      }
    }
  }
});

test('aggregateAIPosture ignores skipped vectors', () => {
  const B = loadBayes();

  const aggregate = B.aggregateAIPosture(
    { Infrastructure: 0, Regulation: 4, People: 3 },
    { Infrastructure: false, Regulation: true, People: true }
  );

  assert.equal(aggregate, 3);
});

test('shouldStop only returns true at threshold or when no questions remain', () => {
  const B = loadBayes();

  assert.equal(B.shouldStop([0.1, 0.69, 0.1, 0.05, 0.03, 0.03], ['P4']), false);
  assert.equal(B.shouldStop([0.1, 0.7, 0.1, 0.04, 0.03, 0.03], ['P4']), true);
  assert.equal(B.shouldStop([0.2, 0.2, 0.2, 0.15, 0.15, 0.1], []), true);
});

test('selectNextQuestion returns a candidate from the remaining bank', () => {
  const B = loadBayes();
  const candidateIds = ['I3', 'I4', 'I5'];
  const next = B.selectNextQuestion(B.BASE_PRIOR, candidateIds, LIKELIHOODS);

  assert.ok(candidateIds.includes(next), 'next question should come from the remaining candidates');
});
