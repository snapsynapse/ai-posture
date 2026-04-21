// AIP Pre-Assessment — Bayesian engine + prior construction
// Version: 1.0.0
// Pure functions. No DOM. No I/O. Easy to unit-test in isolation.

(function (global) {
  'use strict';

  var ENGINE_VERSION = '1.0.0';
  var LEVELS = [0, 1, 2, 3, 4, 5];
  var VECTORS = ['Infrastructure', 'Regulation', 'People'];
  var TILT_CAP = 0.10; // max 10% total probability mass moved per opener on a non-primary vector
  var STOP_THRESHOLD = 0.70;

  // ---------------------------------------------------------------------------
  // Priors (initial distribution over levels 0..5 per vector, before bank questions).
  //
  // Shape of every distribution: [P(L0), P(L1), P(L2), P(L3), P(L4), P(L5)]
  //
  // Default base distribution when opener gives no signal: small mass on L0
  // (Ignoring is rare but not impossible), remaining uniform over L1..L5.
  // ---------------------------------------------------------------------------

  var BASE_PRIOR = [0.02, 0.196, 0.196, 0.196, 0.196, 0.196];

  // O1 primary (People). Distributions over levels given the opener answer.
  // `null` means no override; use base.
  var O1_PRIMARY = {
    'a': [0.02, 0.15, 0.25, 0.25, 0.20, 0.13], // written policy — organization has acknowledged, plausible through Engineering
    'b': [0.05, 0.35, 0.30, 0.20, 0.08, 0.02], // partial acknowledgment — centered low-mid
    'c': [0.15, 0.60, 0.15, 0.07, 0.02, 0.01], // use without acknowledgment — mostly Perceiving, some Ignoring
    'd': null, // falsified N/A path handled by L0-skip; if revised, treat as 'c'
    'e': null  // don't know — keep base
  };

  // O2 primary (Regulation). Keyed by exposure count (see exposureCount()).
  // Numbers reflect that most organizations, even exposed ones, are early on
  // this vector (regulatory rigor is young).
  var O2_PRIMARY = {
    '0': [0.10, 0.60, 0.20, 0.07, 0.02, 0.01], // no declared exposure
    '1': [0.03, 0.40, 0.30, 0.17, 0.08, 0.02], // single jurisdiction
    '2': [0.02, 0.30, 0.25, 0.22, 0.15, 0.06]  // two or more jurisdictions (mature orgs overrepresented)
  };

  // O3 primary (Infrastructure). Public surface implies agent exposure.
  var O3_PRIMARY = {
    'a': [0.03, 0.35, 0.25, 0.18, 0.12, 0.07], // public-facing
    'b': [0.08, 0.45, 0.25, 0.15, 0.05, 0.02], // partner-only
    'c': null, // N/A path; if revised to 'b', handled by runtime
    'd': null  // don't know — base
  };

  // Secondary tilts. Each entry is a multiplicative vector length 6, applied
  // to the target vector's prior and then renormalized, capped so that the
  // total probability mass moved does not exceed TILT_CAP per opener per
  // secondary vector. See applyTilt().
  //
  // Intuition:
  //   "up"  tilts weight toward higher levels (L3..L5)
  //   "down" tilts weight toward lower levels (L0..L2)
  var TILT_UP   = [0.85, 0.90, 0.97, 1.05, 1.12, 1.18];
  var TILT_DOWN = [1.15, 1.08, 1.00, 0.94, 0.88, 0.82];

  // Per-opener secondary tilts. Keys are opener answers; values map target
  // vector name to a tilt vector. Any vector not listed receives no tilt.
  var SECONDARY_TILTS = {
    O1: {
      'a': { Infrastructure: TILT_UP,   Regulation: TILT_UP },
      'b': {},
      'c': { Infrastructure: TILT_DOWN, Regulation: TILT_DOWN },
      'd': {},
      'e': {}
    },
    O2: {
      // Reg is primary; secondary tilt key is the exposure count.
      '0': { Infrastructure: TILT_DOWN, People: TILT_DOWN },
      '1': {},
      '2': { Infrastructure: TILT_UP,   People: TILT_UP }
    },
    O3: {
      'a': { Regulation: TILT_UP },
      'b': {},
      'c': {},
      'd': {}
    }
  };

  // ---------------------------------------------------------------------------
  // Utility math
  // ---------------------------------------------------------------------------

  function sum(arr) {
    var s = 0;
    for (var i = 0; i < arr.length; i++) s += arr[i];
    return s;
  }

  function normalize(arr) {
    var s = sum(arr);
    if (s === 0) return arr.slice();
    var out = new Array(arr.length);
    for (var i = 0; i < arr.length; i++) out[i] = arr[i] / s;
    return out;
  }

  function clone(arr) { return arr.slice(); }

  // Shannon entropy in nats.
  function entropy(p) {
    var h = 0;
    for (var i = 0; i < p.length; i++) {
      if (p[i] > 0) h -= p[i] * Math.log(p[i]);
    }
    return h;
  }

  // Total variation distance between two distributions of same length.
  function totalVariation(a, b) {
    var d = 0;
    for (var i = 0; i < a.length; i++) d += Math.abs(a[i] - b[i]);
    return d / 2;
  }

  // Apply a multiplicative tilt to a prior, renormalize, then if the shift
  // exceeds TILT_CAP, interpolate back toward the original until within cap.
  function applyTilt(prior, tilt) {
    var tilted = new Array(prior.length);
    for (var i = 0; i < prior.length; i++) tilted[i] = prior[i] * tilt[i];
    tilted = normalize(tilted);
    var tv = totalVariation(prior, tilted);
    if (tv <= TILT_CAP) return tilted;
    // Interpolate: find alpha in [0,1] such that TV((1-a)*prior + a*tilted) = cap.
    // TV is linear in alpha for this mixture, so alpha = cap / tv.
    var alpha = TILT_CAP / tv;
    var out = new Array(prior.length);
    for (var j = 0; j < prior.length; j++) {
      out[j] = (1 - alpha) * prior[j] + alpha * tilted[j];
    }
    return normalize(out);
  }

  // ---------------------------------------------------------------------------
  // Opener interpretation
  // ---------------------------------------------------------------------------

  // O2 is multi-select. Count high-exposure jurisdictions.
  // us_other alone does not count as "high exposure" in v1 but sets exposure >= 1.
  function exposureCount(o2Answer) {
    if (!o2Answer || !Array.isArray(o2Answer)) return '0';
    var picks = {};
    o2Answer.forEach(function (k) { picks[k] = true; });
    if (picks.none || picks.dk) {
      if (!picks.eu && !picks.us_high && !picks.uk && !picks.other && !picks.us_other) return '0';
    }
    var high = 0;
    if (picks.eu) high++;
    if (picks.us_high) high++;
    if (picks.uk) high++;
    if (picks.other) high++;
    var anyUs = picks.us_other ? 1 : 0;
    var total = high + anyUs;
    if (total === 0) return '0';
    if (total === 1) return '1';
    return '2';
  }

  // Given opener answers, produce per-vector prior distributions and the set
  // of vectors that are in-scope (not L0-skipped).
  // openerAnswers shape:
  //   { O1: { value: 'a'|'b'|..., skip: bool },
  //     O2: { value: ['eu','us_high',...], skip: bool },
  //     O3: { value: 'a'|..., skip: bool } }
  //
  // When a user's N/A probe confirms, the opener sets skip=true; runtime then
  // reports that vector as L0 and does not ask its bank.
  function buildPriors(openerAnswers) {
    var a = openerAnswers || {};
    var priors = {
      Infrastructure: clone(BASE_PRIOR),
      Regulation: clone(BASE_PRIOR),
      People: clone(BASE_PRIOR)
    };
    var inScope = { Infrastructure: true, Regulation: true, People: true };

    // Primary overrides
    if (a.O1 && !a.O1.skip) {
      var k1 = a.O1.value;
      if (O1_PRIMARY[k1]) priors.People = clone(O1_PRIMARY[k1]);
    } else if (a.O1 && a.O1.skip) {
      inScope.People = false;
    }

    if (a.O2 && !a.O2.skip) {
      var exp = exposureCount(a.O2.value);
      if (O2_PRIMARY[exp]) priors.Regulation = clone(O2_PRIMARY[exp]);
    } else if (a.O2 && a.O2.skip) {
      inScope.Regulation = false;
    }

    if (a.O3 && !a.O3.skip) {
      var k3 = a.O3.value;
      if (O3_PRIMARY[k3]) priors.Infrastructure = clone(O3_PRIMARY[k3]);
    } else if (a.O3 && a.O3.skip) {
      inScope.Infrastructure = false;
    }

    // Secondary tilts (only to in-scope vectors)
    function applyOpenerTilts(openerId, keyForTilts) {
      var table = SECONDARY_TILTS[openerId] || {};
      var tilts = table[keyForTilts] || {};
      Object.keys(tilts).forEach(function (vec) {
        if (!inScope[vec]) return;
        priors[vec] = applyTilt(priors[vec], tilts[vec]);
      });
    }
    if (a.O1 && !a.O1.skip) applyOpenerTilts('O1', a.O1.value);
    if (a.O2 && !a.O2.skip) applyOpenerTilts('O2', exposureCount(a.O2.value));
    if (a.O3 && !a.O3.skip) applyOpenerTilts('O3', a.O3.value);

    return { priors: priors, inScope: inScope };
  }

  // ---------------------------------------------------------------------------
  // Bayesian update + question selection
  // ---------------------------------------------------------------------------

  // likelihoodRow: the row of the likelihood table for a given question,
  // returns P(answer=optIdx | level) for all 6 levels as an array.
  // In our JSON schema, likelihoods[qid].table['<level>'] is an array of
  // probabilities over option index.
  function likelihoodCol(qEntry, optIdx) {
    var col = new Array(6);
    for (var lvl = 0; lvl < 6; lvl++) {
      var row = qEntry.table[String(lvl)];
      col[lvl] = row ? row[optIdx] : 0;
    }
    return col;
  }

  // Posterior update: P(L | answer) ∝ P(answer | L) * P(L)
  function updatePosterior(prior, qEntry, optIdx) {
    var lik = likelihoodCol(qEntry, optIdx);
    var post = new Array(6);
    for (var i = 0; i < 6; i++) post[i] = prior[i] * lik[i];
    return normalize(post);
  }

  // Expected information gain for a candidate question given current posterior.
  // EIG = H(prior) - E[H(posterior|answer)]
  // Also returns marginal answer probabilities (for debug).
  function expectedInfoGain(prior, qEntry) {
    var numOpts = qEntry.options.length;
    var Hprior = entropy(prior);
    var expH = 0;
    for (var o = 0; o < numOpts; o++) {
      // P(answer=o) = sum_L P(answer|L) * P(L)
      var pA = 0;
      for (var lvl = 0; lvl < 6; lvl++) {
        var row = qEntry.table[String(lvl)];
        pA += (row ? row[o] : 0) * prior[lvl];
      }
      if (pA <= 0) continue;
      var post = updatePosterior(prior, qEntry, o);
      expH += pA * entropy(post);
    }
    return Hprior - expH;
  }

  // Pick the next question from `candidateIds` with highest EIG.
  // Ties broken by first in list.
  function selectNextQuestion(prior, candidateIds, likelihoods) {
    var best = null;
    var bestGain = -Infinity;
    for (var i = 0; i < candidateIds.length; i++) {
      var qid = candidateIds[i];
      var qEntry = likelihoods.questions[qid];
      if (!qEntry) continue;
      var gain = expectedInfoGain(prior, qEntry);
      if (gain > bestGain) {
        bestGain = gain;
        best = qid;
      }
    }
    return best;
  }

  // Run a vector's bank against a list of already-recorded answers.
  // Returns final posterior, ordered list of questions asked, and mode.
  // `answered`: [{ qid, optIdx }, ...] in order of asking (for replay)
  function replayVector(initialPrior, answered, likelihoods) {
    var posterior = clone(initialPrior);
    for (var i = 0; i < answered.length; i++) {
      var rec = answered[i];
      var qEntry = likelihoods.questions[rec.qid];
      if (!qEntry) continue;
      posterior = updatePosterior(posterior, qEntry, rec.optIdx);
    }
    return posterior;
  }

  function modeLevel(posterior) {
    var m = 0;
    for (var i = 1; i < posterior.length; i++) {
      if (posterior[i] > posterior[m]) m = i;
    }
    return m;
  }

  function shouldStop(posterior, bankRemaining) {
    var max = 0;
    for (var i = 0; i < posterior.length; i++) if (posterior[i] > max) max = posterior[i];
    if (max >= STOP_THRESHOLD) return true;
    if (bankRemaining.length === 0) return true;
    return false;
  }

  // AIP aggregate: min over in-scope vector modes. N/A vectors excluded.
  // If a vector is skip'd (L0 enforced), it is NOT in-scope and excluded.
  function aggregateAIPosture(modes, inScope) {
    var vals = [];
    Object.keys(modes).forEach(function (v) {
      if (inScope[v]) vals.push(modes[v]);
    });
    if (vals.length === 0) return null;
    return Math.min.apply(null, vals);
  }

  // ---------------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------------

  global.AIPostureBayes = {
    VERSION: ENGINE_VERSION,
    LEVELS: LEVELS,
    VECTORS: VECTORS,
    STOP_THRESHOLD: STOP_THRESHOLD,
    BASE_PRIOR: BASE_PRIOR,
    // math
    normalize: normalize,
    entropy: entropy,
    totalVariation: totalVariation,
    applyTilt: applyTilt,
    // openers
    exposureCount: exposureCount,
    buildPriors: buildPriors,
    // engine
    updatePosterior: updatePosterior,
    expectedInfoGain: expectedInfoGain,
    selectNextQuestion: selectNextQuestion,
    replayVector: replayVector,
    modeLevel: modeLevel,
    shouldStop: shouldStop,
    aggregateAIPosture: aggregateAIPosture
  };

})(typeof window !== 'undefined' ? window : globalThis);
