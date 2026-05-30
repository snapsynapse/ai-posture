// AIP Pre-Assessment — UI runtime
// Version: 1.0.0
// Single-file vanilla JS. Depends on window.AIPostureBayes (bayes.js).

(function () {
  'use strict';

  var B = window.AIPostureBayes;
  var DATA_BASE = './data/';
  var STORAGE_KEY = 'aip.assess.v1.draft';
  var NEWSLETTER_EMAIL_KEY = 'aiposture.newsletter.email';
  var API_BASE = (typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1'))
    ? 'http://localhost:8787'
    : 'https://api.aiposture.org';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var LEVEL_NAMES = ['Ignoring', 'Perceiving', 'Assessing', 'Integrating', 'Calibrating', 'Engineering'];
  var VECTOR_ORDER = ['Infrastructure', 'Regulation', 'People'];
  var HANDOFF_URLS = {
    People: 'https://paice.work/',
    Infrastructure: 'https://siteline.to/',
    Regulation: 'https://everyailaw.com/',
    Generic: 'https://paice.foundation/'
  };

  function track(event, props) {
    try {
      if (window.posthog && typeof window.posthog.capture === 'function') {
        window.posthog.capture(event, props || {});
      }
    } catch (e) { /* ignore */ }
  }

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  var DATA = { questions: null, likelihoods: null, rubric: null };

  function loadJson(url) {
    return fetch(url).then(function (r) {
      if (!r || !r.ok) {
        throw new Error('Failed to load ' + url + ' (' + (r && typeof r.status !== 'undefined' ? r.status : 'unknown') + ')');
      }
      return r.json();
    });
  }

  function loadAllData() {
    return Promise.all([
      loadJson(DATA_BASE + 'questions.json'),
      loadJson(DATA_BASE + 'likelihoods.json'),
      loadJson(DATA_BASE + 'rubric.json')
    ]).then(function (parts) {
      DATA.questions = parts[0];
      DATA.likelihoods = parts[1];
      DATA.rubric = parts[2];
    });
  }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  //
  // state.steps is an ordered history. Each entry is one of:
  //   { type: 'opener',  id: 'O1'|'O2'|'O3', value, skip }
  //   { type: 'probe',   id: 'O1'|..., choice: 'confirm'|'revise' }
  //   { type: 'bank',    vector: 'Infrastructure'|..., qid, optIdx }
  // The result screen is derived from steps + openers' in-scope/skip state.

  var state = {
    version: '1.0.0',
    scopeLabel: '',
    steps: [],
    stage: 'start', // start -> O1 -> (probe) -> O2 -> (probe) -> O3 -> (probe) -> bank:Infrastructure -> bank:Regulation -> bank:People -> result
    analytics: {
      startedTracked: false,
      completedTracked: false
    }
  };

  function normalizeState(nextState) {
    var normalized = nextState || {};
    if (!normalized.version) normalized.version = '1.0.0';
    if (!normalized.scopeLabel) normalized.scopeLabel = '';
    normalized.steps = sanitizeSteps(normalized.steps);
    if (!normalized.stage) normalized.stage = 'start';
    if (!normalized.analytics) normalized.analytics = {};
    normalized.analytics.startedTracked = !!normalized.analytics.startedTracked;
    normalized.analytics.completedTracked = !!normalized.analytics.completedTracked;
    return normalized;
  }

  function sanitizeSteps(steps) {
    if (!Array.isArray(steps)) return [];
    var out = [];
    steps.forEach(function (step) {
      if (!step || typeof step !== 'object') return;
      if (step.type === 'opener') {
        if (typeof step.id !== 'string') return;
        out.push({ type: 'opener', id: step.id, value: step.value, skip: !!step.skip });
        return;
      }
      if (step.type === 'probe') {
        if (typeof step.id !== 'string') return;
        if (step.choice !== 'confirm' && step.choice !== 'revise') return;
        out.push({ type: 'probe', id: step.id, choice: step.choice });
        return;
      }
      if (step.type === 'bank') {
        if (VECTOR_ORDER.indexOf(step.vector) < 0) return;
        if (typeof step.qid !== 'string') return;
        if (typeof step.optIdx !== 'number' || !isFinite(step.optIdx) || step.optIdx < 0) return;
        out.push({ type: 'bank', vector: step.vector, qid: step.qid, optIdx: step.optIdx });
      }
    });
    return out;
  }

  function saveDraft() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* ignore */ }
  }

  function loadDraft() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      var parsed = JSON.parse(raw);
      if (parsed && parsed.version === '1.0.0') {
        state = normalizeState(parsed);
        return true;
      }
    } catch (e) { /* ignore */ }
    return false;
  }

  function clearDraft() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  }

  // ---------------------------------------------------------------------------
  // State derivations
  // ---------------------------------------------------------------------------

  // Build opener answers object from steps (honoring revisions: last one wins).
  function currentOpeners() {
    var out = {};
    state.steps.forEach(function (s) {
      if (s.type === 'opener') {
        out[s.id] = { value: s.value, skip: !!s.skip };
      }
    });
    return out;
  }

  // Collect bank answers per vector in order.
  function bankAnswersByVector() {
    var out = { Infrastructure: [], Regulation: [], People: [] };
    state.steps.forEach(function (s) {
      if (s.type === 'bank') out[s.vector].push({ qid: s.qid, optIdx: s.optIdx });
    });
    return out;
  }

  // Compute priors + per-vector posterior from current step history.
  function computePosteriors() {
    var openers = currentOpeners();
    var built = B.buildPriors(openers);
    var posts = {};
    var banks = bankAnswersByVector();
    VECTOR_ORDER.forEach(function (v) {
      if (!built.inScope[v]) {
        // L0 forced: put all mass on L0.
        posts[v] = [1, 0, 0, 0, 0, 0];
      } else {
        posts[v] = B.replayVector(built.priors[v], banks[v], DATA.likelihoods);
      }
    });
    return { priors: built.priors, inScope: built.inScope, posteriors: posts };
  }

  function resultSnapshot() {
    var r = computePosteriors();
    var modes = {};
    VECTOR_ORDER.forEach(function (v) { modes[v] = B.modeLevel(r.posteriors[v]); });
    var aggregate = B.aggregateAIPosture(modes, r.inScope);
    var aggregateName = aggregate == null ? 'No In-Scope Vectors' : LEVEL_NAMES[aggregate];
    var constraining = [];
    VECTOR_ORDER.forEach(function (v) {
      if (r.inScope[v] && modes[v] === aggregate) constraining.push(v);
    });
    return {
      aggregate: aggregate,
      aggregateName: aggregateName,
      modes: modes,
      inScope: r.inScope,
      posteriors: r.posteriors,
      constraining: constraining
    };
  }

  // Decide the current stage given step history.
  function deriveStage() {
    var openers = currentOpeners();

    // Pending probes: after each opener with na_trigger matched, check if
    // probe follow-up step exists. If not, stage = probe:<openerId>.
    var openerDefs = DATA.questions.openers;
    for (var i = 0; i < openerDefs.length; i++) {
      var od = openerDefs[i];
      var ans = openers[od.id];
      if (!ans) {
        return { kind: 'opener', openerId: od.id };
      }
      // If this opener's value is a trigger, probe must follow.
      var triggered = isNaTriggered(od, ans.value);
      if (triggered) {
        // Did a probe step follow this opener?
        var probed = state.steps.some(function (s, idx) {
          if (s.type !== 'probe' || s.id !== od.id) return false;
          // probe must come after this opener's most recent answer
          var lastOpenerIdx = lastIndexOfOpener(od.id);
          return idx > lastOpenerIdx;
        });
        if (!probed) return { kind: 'probe', openerId: od.id };
      }
    }

    // All openers done, probes done. Move to banks.
    var scope = B.buildPriors(openers).inScope;
    for (var v = 0; v < VECTOR_ORDER.length; v++) {
      var vec = VECTOR_ORDER[v];
      if (!scope[vec]) continue; // L0 skipped
      // Is this vector complete?
      var banks = bankAnswersByVector();
      var answered = banks[vec];
      // Compute posterior progressively; stop when threshold or bank exhausted.
      var post = currentPosteriorFor(vec);
      var remaining = remainingBankIds(vec);
      var stop = B.shouldStop(post, remaining);
      // We also cap at 5 per vector per PRD.
      var done = stop || answered.length >= 5;
      if (!done) {
        return { kind: 'bank', vector: vec };
      }
    }

    return { kind: 'result' };
  }

  function lastIndexOfOpener(id) {
    for (var i = state.steps.length - 1; i >= 0; i--) {
      if (state.steps[i].type === 'opener' && state.steps[i].id === id) return i;
    }
    return -1;
  }

  function isNaTriggered(openerDef, value) {
    if (!openerDef.na_trigger) return false;
    if (openerDef.type === 'single') return value === openerDef.na_trigger;
    if (openerDef.type === 'multi') {
      if (!Array.isArray(value)) return false;
      // Trigger if 'none' is selected and no exposure; also if only 'dk'.
      var hasTrigger = value.indexOf(openerDef.na_trigger) >= 0;
      if (!hasTrigger) return false;
      // If they selected something real alongside 'none', do not trigger.
      var exposureKeys = ['eu', 'us_high', 'us_other', 'uk', 'other'];
      var hasExposure = exposureKeys.some(function (k) { return value.indexOf(k) >= 0; });
      return !hasExposure;
    }
    return false;
  }

  function currentPosteriorFor(vector) {
    var openers = currentOpeners();
    var built = B.buildPriors(openers);
    if (!built.inScope[vector]) return [1, 0, 0, 0, 0, 0];
    var banks = bankAnswersByVector();
    return B.replayVector(built.priors[vector], banks[vector], DATA.likelihoods);
  }

  function remainingBankIds(vector) {
    var bank = DATA.questions.banks[vector];
    var asked = {};
    bankAnswersByVector()[vector].forEach(function (a) { asked[a.qid] = true; });
    return bank.filter(function (q) { return !asked[q.id]; }).map(function (q) { return q.id; });
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  var root = null;

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') e.className = attrs[k];
        else if (k === 'html') e.innerHTML = attrs[k];
        else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), attrs[k]);
        else e.setAttribute(k, attrs[k]);
      });
    }
    if (children) {
      children.forEach(function (c) {
        if (c == null) return;
        if (typeof c === 'string') e.appendChild(document.createTextNode(c));
        else e.appendChild(c);
      });
    }
    return e;
  }

  function render() {
    var stage = deriveStage();
    root.innerHTML = '';

    if (stage.kind === 'opener') {
      renderOpener(stage.openerId);
    } else if (stage.kind === 'probe') {
      renderProbe(stage.openerId);
    } else if (stage.kind === 'bank') {
      renderBankQuestion(stage.vector);
    } else if (stage.kind === 'result') {
      renderResult();
      if (!state.analytics.completedTracked) {
        state.analytics.completedTracked = true;
        var r = computePosteriors();
        var modes = {};
        VECTOR_ORDER.forEach(function (v) { modes[v] = B.modeLevel(r.posteriors[v]); });
        var agg = B.aggregateAIPosture(modes, r.inScope);
        track('assessment_completed', {
          version: state.version,
          aip: agg == null ? null : LEVEL_NAMES[agg],
          people_level: r.inScope.People ? modes.People : null,
          infrastructure_level: r.inScope.Infrastructure ? modes.Infrastructure : null,
          regulation_level: r.inScope.Regulation ? modes.Regulation : null,
          in_scope_count: VECTOR_ORDER.filter(function (v) { return r.inScope[v]; }).length
        });
      }
    }
    renderProgress(stage);
    saveDraft();
  }

  function isVectorComplete(vector, inScope) {
    if (!inScope[vector]) return true;
    var answers = bankAnswersByVector()[vector];
    if (answers.length >= 5) return true;
    return B.shouldStop(currentPosteriorFor(vector), remainingBankIds(vector));
  }

  function progressCounts(stage) {
    var openers = currentOpeners();
    var answered = 0;
    var total = 3; // openers
    Object.keys(openers).forEach(function (k) { if (openers[k]) answered++; });
    var built;
    try { built = B.buildPriors(openers); } catch (e) { built = { inScope: { Infrastructure: true, Regulation: true, People: true } }; }
    var banks = bankAnswersByVector();
    if (stage && stage.kind === 'result') {
      VECTOR_ORDER.forEach(function (v) {
        answered += banks[v].length;
      });
      return { answered: answered, total: answered };
    }
    VECTOR_ORDER.forEach(function (v) {
      answered += banks[v].length;
      if (!built.inScope[v]) return;
      total += banks[v].length;
      if (!isVectorComplete(v, built.inScope)) total += 1;
    });
    return { answered: answered, total: total };
  }

  function renderProgress(stage) {
    var pc = progressCounts(stage);
    var barFill = document.getElementById('bar');
    var progressLabel = document.getElementById('progress-label');
    if (!barFill) return;
    var pct = pc.total > 0 ? (pc.answered / pc.total) * 100 : 0;
    barFill.style.width = pct + '%';
    if (progressLabel) {
      progressLabel.textContent = stage && stage.kind === 'result'
        ? 'Assessment complete'
        : pc.answered + ' of ' + pc.total + ' steps complete';
    }
  }

  // --- Opener screen ---
  function renderOpener(openerId) {
    var def = DATA.questions.openers.find(function (o) { return o.id === openerId; });
    var existing = currentOpeners()[openerId];
    var currentValue = existing ? existing.value : (def.type === 'multi' ? [] : '');

    var optionNodes = def.options.map(function (opt) {
      var id = 'opt-' + openerId + '-' + opt.key;
      var inputType = def.type === 'multi' ? 'checkbox' : 'radio';
      var checked = def.type === 'multi'
        ? (currentValue || []).indexOf(opt.key) >= 0
        : currentValue === opt.key;
      var input = el('input', {
        type: inputType,
        name: 'opener-' + openerId,
        id: id,
        value: opt.key
      });
      if (checked) input.checked = true;
      var label = el('label', { for: id, class: 'option' }, [
        input,
        el('span', null, [opt.label])
      ]);
      return label;
    });

    var form = el('form', { class: 'q-form', onsubmit: function (ev) { ev.preventDefault(); submitOpener(def); } }, [
      el('div', { class: 'q-header' }, [
        el('h2', { class: 'q-text' }, [def.text])
      ]),
      el('fieldset', { class: 'options-wrap' }, optionNodes),
      renderActions({ showBack: openerId !== 'O1', nextLabel: 'Next' })
    ]);
    root.appendChild(form);
  }

  function submitOpener(def) {
    var inputs = root.querySelectorAll('input[name="opener-' + def.id + '"]');
    var value;
    if (def.type === 'multi') {
      value = [];
      inputs.forEach(function (i) { if (i.checked) value.push(i.value); });
      if (value.length === 0) { alert('Select at least one option.'); return; }
    } else {
      value = null;
      inputs.forEach(function (i) { if (i.checked) value = i.value; });
      if (!value) { alert('Select an option.'); return; }
    }
    // If the user is re-answering this opener, truncate history from its
    // previous location forward (so subsequent answers recompute cleanly).
    truncateFrom({ type: 'opener', id: def.id });
    if (!state.analytics.startedTracked) {
      state.analytics.startedTracked = true;
      track('assessment_started', { version: state.version });
    }
    state.steps.push({ type: 'opener', id: def.id, value: value, skip: false });
    track('question_answered', { question_id: def.id });
    render();
  }

  // --- N/A probe screen ---
  function renderProbe(openerId) {
    var def = DATA.questions.openers.find(function (o) { return o.id === openerId; });
    var probe = def.na_probe;
    var optionNodes = probe.options.map(function (opt) {
      return el('button', {
        type: 'button',
        class: 'btn btn-secondary probe-option',
        onclick: function () { submitProbe(def, opt.key); }
      }, [opt.label]);
    });
    var wrap = el('div', { class: 'q-form' }, [
      el('div', { class: 'q-header' }, [
        el('div', { class: 'q-tag' }, ['Quick check — ' + def.primary_vector]),
        el('p', { class: 'q-text' }, [probe.prompt])
      ]),
      el('div', { class: 'probe-actions' }, optionNodes),
      renderActions({ showBack: true, nextLabel: null })
    ]);
    root.appendChild(wrap);
  }

  function submitProbe(def, choice) {
    // Remove prior probe entries for this opener after its last answer.
    truncateFrom({ type: 'probe', id: def.id });
    if (choice === 'confirm') {
      // Mark opener with skip=true; keep user's original answer for record.
      // Find the last opener step for this id and set skip.
      var idx = lastIndexOfOpener(def.id);
      if (idx >= 0) state.steps[idx].skip = true;
      state.steps.push({ type: 'probe', id: def.id, choice: 'confirm' });
    } else {
      // Revise. If revise_to defined, overwrite the opener's value; else
      // jump back to the opener screen.
      if (def.na_probe.revise_to) {
        var i2 = lastIndexOfOpener(def.id);
        if (i2 >= 0) {
          state.steps[i2].value = def.na_probe.revise_to;
          state.steps[i2].skip = false;
        }
        state.steps.push({ type: 'probe', id: def.id, choice: 'revise' });
      } else {
        // Remove the opener answer so we re-ask.
        state.steps = state.steps.filter(function (s) { return !(s.type === 'opener' && s.id === def.id); });
      }
    }
    render();
  }

  // --- Bank question screen ---
  function renderBankQuestion(vector) {
    var banks = bankAnswersByVector()[vector];
    var qIdx = banks.length + 1;
    // Pick next question via EIG.
    var post = currentPosteriorFor(vector);
    var remainingIds = remainingBankIds(vector);
    var qid = B.selectNextQuestion(post, remainingIds, DATA.likelihoods);
    var def = DATA.questions.banks[vector].find(function (q) { return q.id === qid; });
    if (!def) { render(); return; }

    var optionNodes = def.options.map(function (opt, idx) {
      var id = 'opt-' + def.id + '-' + opt.key;
      var input = el('input', {
        type: 'radio',
        name: 'bank-' + def.id,
        id: id,
        value: String(idx)
      });
      var label = el('label', { for: id, class: 'option' }, [
        input,
        el('span', null, [opt.label])
      ]);
      return label;
    });

    var form = el('form', { class: 'q-form', onsubmit: function (ev) { ev.preventDefault(); submitBank(vector, def); } }, [
      el('div', { class: 'q-header' }, [
        el('div', { class: 'q-tag' }, [vector + ' — question ' + qIdx + ' of up to 5']),
        el('h2', { class: 'q-text' }, [def.text])
      ]),
      el('fieldset', { class: 'options-wrap' }, optionNodes),
      renderActions({ showBack: true, nextLabel: 'Next' })
    ]);
    root.appendChild(form);
  }

  function submitBank(vector, def) {
    var inputs = root.querySelectorAll('input[name="bank-' + def.id + '"]');
    var optIdx = -1;
    inputs.forEach(function (i) { if (i.checked) optIdx = parseInt(i.value, 10); });
    if (optIdx < 0) { alert('Select an option.'); return; }
    state.steps.push({ type: 'bank', vector: vector, qid: def.id, optIdx: optIdx });
    track('question_answered', { question_id: def.id });
    render();
  }

  // --- Actions (back/next row) ---
  function renderActions(opts) {
    var children = [];
    if (opts.showBack) {
      children.push(el('button', {
        type: 'button',
        class: 'btn btn-ghost',
        onclick: goBack
      }, ['← Back']));
    } else {
      children.push(el('span', null, []));
    }
    if (opts.nextLabel) {
      children.push(el('button', {
        type: 'submit',
        class: 'btn btn-primary'
      }, [opts.nextLabel + ' →']));
    }
    return el('div', { class: 'q-actions' }, children);
  }

  function stageFingerprint() {
    var s = deriveStage();
    if (s.kind === 'bank') {
      return 'bank:' + s.vector + ':' + bankAnswersByVector()[s.vector].length;
    }
    if (s.kind === 'opener') return 'opener:' + s.openerId;
    if (s.kind === 'probe') return 'probe:' + s.openerId;
    return 'result';
  }

  function goBack() {
    if (state.steps.length === 0) return;
    var before = stageFingerprint();
    // Pop steps until the derived stage changes (so "back" always reveals a
    // different screen, not the same one that auto-advances past a no-op).
    var guard = 0;
    while (state.steps.length > 0 && guard < 50) {
      guard++;
      var popped = state.steps.pop();
      if (popped && popped.type === 'probe') {
        var idx = lastIndexOfOpener(popped.id);
        if (idx >= 0) state.steps[idx].skip = false;
      }
      var after = stageFingerprint();
      if (after !== before) break;
    }
    if (deriveStage().kind !== 'result') {
      state.analytics.completedTracked = false;
    }
    render();
  }

  // Truncate from first occurrence of the matching step forward (inclusive).
  function truncateFrom(match) {
    for (var i = 0; i < state.steps.length; i++) {
      var s = state.steps[i];
      if (match.type === 'opener' && s.type === 'opener' && s.id === match.id) {
        state.steps = state.steps.slice(0, i);
        return;
      }
      if (match.type === 'probe' && s.type === 'probe' && s.id === match.id) {
        state.steps = state.steps.slice(0, i);
        return;
      }
    }
  }

  // --- Result screen ---
  function renderResult() {
    var snapshot = resultSnapshot();
    var aggregate = snapshot.aggregate;
    var aggregateName = snapshot.aggregateName;
    var modes = snapshot.modes;
    var r = { inScope: snapshot.inScope, posteriors: snapshot.posteriors };
    var constraining = snapshot.constraining;

    var wrap = el('div', { class: 'result' });

    wrap.appendChild(el('div', { class: 'result-header' }, [
      el('div', { class: 'result-tag' }, ['Estimated']),
      el('h2', null, ['AI Posture: ' + aggregateName]),
      el('p', { class: 'result-note' }, [
        aggregate == null
          ? 'Each vector was confirmed out of scope during the opener checks, so no aggregate posture is calculated.'
          : 'This is an estimate, not a verified assertion. The evidence checklist below shows what would make it verified per vector.'
      ])
    ]));

    // Per-vector rows with posterior hover band.
    var rows = VECTOR_ORDER.map(function (v) {
      var p = r.posteriors[v];
      var modeLvl = modes[v];
      var pct = (modeLvl / 5) * 100;
      var bandStr = p.map(function (x, i) { return 'L' + i + ' ' + (x * 100).toFixed(1) + '%'; }).join(' · ');
      var naBadge = r.inScope[v] ? null : el('span', { class: 'na-badge' }, ['N/A']);
      return el('div', { class: 'vrow', title: bandStr }, [
        el('span', { class: 'vlabel' }, [v]),
        el('span', { class: 'vbar' }, [el('span', { style: 'width:' + pct + '%' }, [])]),
        el('span', { class: 'vlevel' }, [r.inScope[v] ? LEVEL_NAMES[modeLvl] : 'N/A']),
        naBadge
      ]);
    });
    wrap.appendChild(el('div', { class: 'vrows' }, rows));

    // Constraining + next action
    if (aggregate != null) {
      var nextName = aggregate < 5 ? LEVEL_NAMES[aggregate + 1] : null;
      var nextAction = nextName
        ? 'Advance ' + constraining.join(', ') + ' to ' + nextName + '.'
        : 'All in-scope vectors are at Engineering. Advance the frontier.';
      wrap.appendChild(el('p', { class: 'constraining' }, [
        el('strong', null, ['Constraining vector: ']),
        constraining.join(', ') + '. ' + nextAction
      ]));
    }

    // Evidence checklist
    wrap.appendChild(el('h3', null, ['Evidence checklist']));
    wrap.appendChild(el('p', { class: 'sub' }, ['Artifacts that would turn this estimate into a verified assertion at each vector\u2019s current estimated level.']));
    VECTOR_ORDER.forEach(function (v) {
      if (!r.inScope[v]) {
        wrap.appendChild(el('div', { class: 'evidence-block' }, [
          el('h4', null, [v + ' - N/A']),
          el('p', { class: 'assertion' }, ['This vector was confirmed out of scope during the opener check and is excluded from the aggregate posture calculation.']),
          el('p', { class: 'test' }, ['No evidence checklist applies unless the scope answer changes.'])
        ]));
        return;
      }
      var lvl = modes[v];
      var rubricEntry = DATA.rubric.vectors[v].find(function (e) { return e.level === lvl; });
      if (!rubricEntry) return;
      var items = (rubricEntry.evidence || []).map(function (t) { return el('li', null, [t]); });
      wrap.appendChild(el('div', { class: 'evidence-block' }, [
        el('h4', null, [v + ' - ' + rubricEntry.name]),
        el('p', { class: 'assertion' }, ['\u201C' + rubricEntry.assertion + '\u201D']),
        el('ul', null, items),
        el('p', { class: 'test' }, [el('strong', null, ['Test: ']), rubricEntry.test])
      ]));
    });

    // Handoff links
    wrap.appendChild(el('h3', null, ['Paths to verification']));
    wrap.appendChild(el('ul', { class: 'handoff' }, [
      handoffItem('People', 'People reference implementation', HANDOFF_URLS.People),
      handoffItem('Infrastructure', 'Infrastructure reference implementation', HANDOFF_URLS.Infrastructure),
      handoffItem('Regulation', 'Regulation reference implementation', HANDOFF_URLS.Regulation),
      handoffItem('Generic', 'Find an assessor', HANDOFF_URLS.Generic)
    ]));

    // Plain-text report block (copyable)
    wrap.appendChild(el('h3', null, ['Shareable summary']));
    var textReport = buildTextReport(aggregateName, modes, r.inScope, constraining);
    wrap.appendChild(el('pre', { class: 'report' }, [textReport]));
    wrap.appendChild(el('div', { class: 'artifact-actions' }, [
      el('button', { type: 'button', class: 'btn btn-secondary', onclick: copyTextReport }, ['Copy summary']),
      el('button', { type: 'button', class: 'btn btn-secondary', onclick: downloadJsonArtifact }, ['Download JSON']),
      el('button', { type: 'button', class: 'btn btn-secondary', onclick: printResult }, ['Print or save PDF'])
    ]));
    wrap.appendChild(el('p', { class: 'artifact-note' }, ['Artifacts are generated in this browser session. You can also have the JSON emailed to you.']));

    // Delivery form
    var deliveryForm = buildDeliveryForm();
    wrap.appendChild(deliveryForm);


    // What this is not
    wrap.appendChild(el('details', { class: 'not-panel' }, [
      el('summary', null, ['What this is not']),
      el('ul', null, [
        el('li', null, ['Not a certification. No seal. No attestation of compliance.']),
        el('li', null, ['Not an audit. No independent verification. No evidence collection.']),
        el('li', null, ['Not legal advice.']),
        el('li', null, ['Not a substitute for per-vector measurement.']),
        el('li', null, ['Not a sales qualifier.'])
      ])
    ]));

    // Actions: start over, back
    wrap.appendChild(el('div', { class: 'q-actions' }, [
      el('button', { type: 'button', class: 'btn btn-ghost', onclick: goBack }, ['← Revise last answer']),
      el('button', { type: 'button', class: 'btn btn-secondary', onclick: startOver }, ['Start over'])
    ]));

    root.appendChild(wrap);
  }

  function handoffItem(destination, label, url) {
    return el('li', null, [
      el('a', {
        href: url,
        target: '_blank',
        rel: 'noopener',
        onclick: function () { track('handoff_clicked', { destination: destination, url: url }); }
      }, [label]),
      ' - ' + url
    ]);
  }

  function buildTextReport(aggregateName, modes, inScope, constraining) {
    var lines = [];
    lines.push('Aggregated Intelligence Posture (estimated): ' + aggregateName);
    lines.push('');
    VECTOR_ORDER.forEach(function (v) {
      var name = inScope[v] ? LEVEL_NAMES[modes[v]] : 'N/A';
      var bars = barStr(inScope[v] ? modes[v] : 0);
      lines.push('  ' + pad(v + ':', 17) + pad(name, 14) + bars);
    });
    lines.push('');
    lines.push('  Constraining vector: ' + (constraining.length ? constraining.join(', ') : 'n/a'));
    lines.push('');
    lines.push('  Source: https://aiposture.org/assess/');
    return lines.join('\n');
  }

  function buildJsonArtifact() {
    var snapshot = resultSnapshot();
    var vectors = {};
    VECTOR_ORDER.forEach(function (v) {
      var rubricRows = DATA.rubric && DATA.rubric.vectors && DATA.rubric.vectors[v];
      var rubricRow = null;
      if (snapshot.inScope[v] && Array.isArray(rubricRows)) {
        rubricRow = rubricRows.find(function (row) { return row.level === snapshot.modes[v]; });
      }
      vectors[v] = {
        in_scope: !!snapshot.inScope[v],
        level: snapshot.inScope[v] ? snapshot.modes[v] : null,
        level_name: snapshot.inScope[v] ? LEVEL_NAMES[snapshot.modes[v]] : 'N/A',
        posterior: snapshot.posteriors[v].map(function (x) { return Number(x.toFixed(6)); }),
        evidence_checklist: rubricRow && Array.isArray(rubricRow.evidence) ? rubricRow.evidence.slice() : []
      };
    });
    return {
      type: 'AI Posture Pre-Assessment Result',
      version: state.version,
      generated_at: new Date().toISOString(),
      source: 'https://aiposture.org/assess/',
      estimate_label: 'estimated AI Posture',
      scope: {
        label: state.scopeLabel || null
      },
      aggregate: {
        level: snapshot.aggregate,
        level_name: snapshot.aggregate == null ? 'N/A' : snapshot.aggregateName
      },
      constraining_vectors: snapshot.constraining,
      vectors: vectors,
      notice: 'This is an estimate, not a verified assertion.'
    };
  }

  function copyTextReport() {
    var snapshot = resultSnapshot();
    var report = buildTextReport(snapshot.aggregateName, snapshot.modes, snapshot.inScope, snapshot.constraining);
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(report).catch(function () {
        alert('Copy failed. Select the summary text manually.');
      });
      return;
    }
    alert('Clipboard access is unavailable. Select the summary text manually.');
  }

  function buildDeliveryForm() {
    var section = el('div', { class: 'delivery' });
    section.appendChild(el('h3', null, ['Email me this estimate']));
    section.appendChild(el('p', { class: 'delivery-note' }, [
      'We send the JSON artifact once and remove your email from the stored record after delivery. Records are retained for up to three years; request deletion via privacy@paice.work.'
    ]));

    var form = el('form', { class: 'delivery-form', novalidate: 'novalidate' });
    var input = el('input', {
      type: 'email',
      id: 'delivery-email',
      name: 'email',
      required: 'required',
      autocomplete: 'email',
      inputmode: 'email',
      placeholder: 'you@example.com',
      'aria-describedby': 'delivery-status'
    });
    var label = el('label', { for: 'delivery-email', class: 'visually-hidden' }, ['Email address']);
    var submit = el('button', { type: 'submit', class: 'btn btn-primary' }, ['Email JSON']);

    try {
      var saved = sessionStorage.getItem(NEWSLETTER_EMAIL_KEY);
      if (saved) input.value = saved;
    } catch (e) { /* ignore */ }

    form.appendChild(label);
    form.appendChild(input);
    form.appendChild(submit);

    var status = el('p', {
      id: 'delivery-status',
      class: 'delivery-status',
      role: 'status',
      'aria-live': 'polite'
    });

    section.appendChild(form);
    section.appendChild(status);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (input.value || '').trim();
      if (!EMAIL_RE.test(email) || email.length > 254) {
        status.textContent = 'Enter a valid email address.';
        status.className = 'delivery-status delivery-status-error';
        input.focus();
        return;
      }
      try { sessionStorage.setItem(NEWSLETTER_EMAIL_KEY, email); } catch (e) { /* ignore */ }

      submit.disabled = true;
      status.textContent = 'Sending…';
      status.className = 'delivery-status';

      var payload = buildJsonArtifact();

      fetch(API_BASE + '/api/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, payload: payload })
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          if (res.body && res.body.error === 'rate_limited') {
            status.textContent = 'Too many requests. Try again in an hour.';
            status.className = 'delivery-status delivery-status-error';
            submit.disabled = false;
            return;
          }
          if (!res.ok) throw new Error(res.body && res.body.error || 'request_failed');
          track('delivery_requested');
          status.textContent = 'Sent. Check your inbox. The email is removed from our record after delivery.';
          status.className = 'delivery-status delivery-status-ok';
          input.disabled = true;
          submit.disabled = true;
        })
        .catch(function () {
          status.textContent = 'Could not send right now. Try again later.';
          status.className = 'delivery-status delivery-status-error';
          submit.disabled = false;
        });
    });

    return section;
  }

  function downloadJsonArtifact() {
    var payload = buildJsonArtifact();
    var blob = new Blob([JSON.stringify(payload, null, 2) + '\n'], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'ai-posture-estimate.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function printResult() {
    track('pdf_requested', { method: 'browser_print' });
    window.print();
  }

  function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }
  function barStr(lvl) {
    var full = 0, empty = 10;
    if (lvl > 0) full = lvl * 2;
    empty = 10 - full;
    return '\u2588'.repeat(full) + '\u2591'.repeat(empty);
  }

  function startOver() {
    if (!confirm('Clear all answers and start over?')) return;
    state.steps = [];
    state.analytics.startedTracked = false;
    state.analytics.completedTracked = false;
    clearDraft();
    render();
  }

  if (typeof window !== 'undefined' && window.__AIPostureTestMode) {
    window.__AIPostureTestHooks = {
      setData: function (next) { DATA = next; },
      setRoot: function (nextRoot) { root = nextRoot; },
      setState: function (nextState) {
        state = normalizeState(JSON.parse(JSON.stringify(nextState)));
      },
      getState: function () { return JSON.parse(JSON.stringify(state)); },
      setTracked: function (nextTracked) {
        state.analytics.startedTracked = !!(nextTracked && nextTracked.started);
        state.analytics.completedTracked = !!(nextTracked && nextTracked.completed);
      },
      getTracked: function () {
        return {
          started: !!(state.analytics && state.analytics.startedTracked),
          completed: !!(state.analytics && state.analytics.completedTracked)
        };
      },
      currentOpeners: currentOpeners,
      bankAnswersByVector: bankAnswersByVector,
      computePosteriors: computePosteriors,
      deriveStage: deriveStage,
      progressCounts: progressCounts,
      renderProgress: renderProgress,
      renderResult: renderResult,
      resultSnapshot: resultSnapshot,
      buildJsonArtifact: buildJsonArtifact,
      render: render,
      startOver: startOver,
      loadAllData: loadAllData,
      loadDraft: loadDraft,
      submitProbe: submitProbe,
      goBack: goBack
    };
  }

  // ---------------------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------------------

  function boot() {
    root = document.getElementById('assessment-root');
    loadAllData().then(function () {
      loadDraft();
      render();
    }).catch(function (err) {
      root.innerHTML = '<p class="error">Could not load assessment data. ' + String(err && err.message ? err.message : err) + '</p>';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
