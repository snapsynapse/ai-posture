const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const APP_JS = fs.readFileSync(path.join(ROOT, 'docs/assess/js/app.js'), 'utf8');
const BAYES_JS = fs.readFileSync(path.join(ROOT, 'docs/assess/js/bayes.js'), 'utf8');
const QUESTIONS = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/assess/data/questions.json'), 'utf8'));
const LIKELIHOODS = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/assess/data/likelihoods.json'), 'utf8'));
const RUBRIC = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/assess/data/rubric.json'), 'utf8'));

class FakeNode {
  constructor(tagName, ownerDocument, textValue) {
    this.tagName = tagName;
    this.ownerDocument = ownerDocument;
    this.textValue = textValue || '';
    this.children = [];
    this.attributes = {};
    this.style = {};
    this.className = '';
    this.listeners = {};
    this.parentNode = null;
    this._innerHTML = '';
  }

  appendChild(child) {
    this.children.push(child);
    child.parentNode = this;
    return child;
  }

  setAttribute(name, value) {
    const next = String(value);
    this.attributes[name] = next;
    if (name === 'id') this.ownerDocument.nodesById[next] = this;
    if (name === 'class') this.className = next;
  }

  addEventListener(type, handler) {
    this.listeners[type] = handler;
  }

  get textContent() {
    if (this.tagName === '#text') return this.textValue;
    return this.children.map(child => child.textContent).join('');
  }

  set textContent(value) {
    if (this.tagName === '#text') {
      this.textValue = String(value);
      return;
    }
    this.children = [new FakeNode('#text', this.ownerDocument, String(value))];
  }

  set innerHTML(value) {
    this._innerHTML = String(value);
    this.children = [];
  }

  get innerHTML() {
    return this._innerHTML;
  }
}

class FakeDocument {
  constructor() {
    this.readyState = 'loading';
    this.nodesById = {};
  }

  createElement(tagName) {
    return new FakeNode(tagName, this);
  }

  createTextNode(text) {
    return new FakeNode('#text', this, String(text));
  }

  getElementById(id) {
    return this.nodesById[id] || null;
  }

  addEventListener() {}
}

function loadRuntime(options = {}) {
  const document = new FakeDocument();
  const root = document.createElement('div');
  root.setAttribute('id', 'assessment-root');
  const bar = document.createElement('span');
  bar.setAttribute('id', 'bar');
  const progressLabel = document.createElement('div');
  progressLabel.setAttribute('id', 'progress-label');

  const captured = [];
  const window = {
    __AIPostureTestMode: true,
    posthog: {
      capture(event, props) {
        captured.push({ event, props });
      }
    }
  };

  const context = {
    window,
    document,
    sessionStorage: {
      getItem() { return options.sessionValue || null; },
      setItem() {},
      removeItem() {}
    },
    fetch: options.fetchImpl || function () {
      throw new Error('fetch should not be called in tests');
    },
    alert() {},
    confirm() { return true; },
    console,
    setTimeout,
    clearTimeout
  };

  vm.runInNewContext(BAYES_JS, context, { filename: 'bayes.js' });
  vm.runInNewContext(APP_JS, context, { filename: 'app.js' });

  const hooks = window.__AIPostureTestHooks;
  hooks.setData({
    questions: QUESTIONS,
    likelihoods: LIKELIHOODS,
    rubric: RUBRIC
  });
  hooks.setRoot(root);

  return { hooks, root, bar, progressLabel, captured };
}

function completedState() {
  return {
    version: '1.0.0',
    scopeLabel: '',
    stage: 'result',
    steps: [
      { type: 'opener', id: 'O1', value: 'a', skip: false },
      { type: 'opener', id: 'O2', value: ['eu'], skip: false },
      { type: 'opener', id: 'O3', value: 'a', skip: false },
      { type: 'bank', vector: 'Infrastructure', qid: 'I1', optIdx: 0 },
      { type: 'bank', vector: 'Infrastructure', qid: 'I2', optIdx: 0 },
      { type: 'bank', vector: 'Infrastructure', qid: 'I3', optIdx: 0 },
      { type: 'bank', vector: 'Infrastructure', qid: 'I4', optIdx: 1 },
      { type: 'bank', vector: 'Regulation', qid: 'R1', optIdx: 0 },
      { type: 'bank', vector: 'Regulation', qid: 'R2', optIdx: 0 },
      { type: 'bank', vector: 'Regulation', qid: 'R3', optIdx: 0 },
      { type: 'bank', vector: 'Regulation', qid: 'R4', optIdx: 1 },
      { type: 'bank', vector: 'People', qid: 'P1', optIdx: 0 },
      { type: 'bank', vector: 'People', qid: 'P2', optIdx: 0 },
      { type: 'bank', vector: 'People', qid: 'P3', optIdx: 0 },
      { type: 'bank', vector: 'People', qid: 'P5', optIdx: 1 }
    ]
  };
}

function allNaState() {
  return {
    version: '1.0.0',
    scopeLabel: '',
    stage: 'result',
    steps: [
      { type: 'opener', id: 'O1', value: 'd', skip: true },
      { type: 'probe', id: 'O1', choice: 'confirm' },
      { type: 'opener', id: 'O2', value: ['none'], skip: true },
      { type: 'probe', id: 'O2', choice: 'confirm' },
      { type: 'opener', id: 'O3', value: 'c', skip: true },
      { type: 'probe', id: 'O3', choice: 'confirm' }
    ]
  };
}

test('N/A vectors do not render Ignoring evidence blocks', () => {
  const { hooks, root } = loadRuntime();
  hooks.setState({
    version: '1.0.0',
    scopeLabel: '',
    stage: 'result',
    steps: [
      { type: 'opener', id: 'O1', value: 'a', skip: false },
      { type: 'opener', id: 'O2', value: ['eu'], skip: false },
      { type: 'opener', id: 'O3', value: 'c', skip: true },
      { type: 'probe', id: 'O3', choice: 'confirm' }
    ]
  });

  hooks.renderResult();

  assert.equal(
    root.textContent.includes('Infrastructure — Ignoring (N/A)'),
    false,
    'N/A vectors should not be rendered as Ignoring'
  );
  assert.equal(
    root.textContent.includes('AI agents do not interact with our systems.'),
    false,
    'N/A vectors should not reuse the level-0 Ignoring assertion'
  );
});

test('completed adaptive flows report full progress', () => {
  const { hooks, bar, progressLabel } = loadRuntime();
  const state = completedState();

  hooks.setState(state);
  assert.equal(hooks.deriveStage().kind, 'result');

  hooks.renderProgress(hooks.deriveStage());

  assert.equal(bar.style.width, '100%', 'finished assessments should show a full progress bar');
  assert.equal(progressLabel.textContent, 'Assessment complete');
});

test('restoring a completed assessment does not emit another completion event', () => {
  const { hooks, captured } = loadRuntime();
  const state = completedState();
  state.analytics = { startedTracked: true, completedTracked: true };

  hooks.setState(state);
  hooks.render();

  assert.deepEqual(
    captured.filter(entry => entry.event === 'assessment_completed'),
    [],
    'rendering an already-complete draft should not record another completion'
  );
});

test('start over resets analytics flags for a fresh run', () => {
  const { hooks } = loadRuntime();

  hooks.setState(completedState());
  hooks.setTracked({ started: true, completed: true });
  hooks.startOver();

  assert.equal(hooks.getTracked().started, false, 'startOver should clear the started flag');
  assert.equal(hooks.getTracked().completed, false, 'startOver should clear the completed flag');
});

test('revising O2 after selecting none returns to the opener screen', () => {
  const { hooks } = loadRuntime();
  const o2 = QUESTIONS.openers.find(entry => entry.id === 'O2');

  hooks.setState({
    version: '1.0.0',
    scopeLabel: '',
    stage: 'start',
    steps: [
      { type: 'opener', id: 'O1', value: 'a', skip: false },
      { type: 'opener', id: 'O2', value: ['none'], skip: false }
    ]
  });

  assert.equal(hooks.deriveStage().kind, 'probe');
  assert.equal(hooks.deriveStage().openerId, 'O2');
  hooks.submitProbe(o2, 'revise');
  assert.equal(hooks.deriveStage().kind, 'opener');
  assert.equal(hooks.deriveStage().openerId, 'O2');
  assert.equal(
    hooks.getState().steps.some(step => step.type === 'opener' && step.id === 'O2'),
    false,
    'revising O2 should remove the triggering opener answer and re-ask it'
  );
});

test('back from result reopens the last bank question and clears completion tracking', () => {
  const { hooks } = loadRuntime();
  const state = completedState();
  state.analytics = { startedTracked: true, completedTracked: true };

  hooks.setState(state);
  hooks.goBack();

  assert.equal(hooks.deriveStage().kind, 'bank');
  assert.equal(hooks.deriveStage().vector, 'People');
  assert.equal(hooks.getTracked().completed, false, 'backing out of the result should clear completion tracking');
});

test('all vectors confirmed N/A produce an undefined aggregate with no constraining vector', () => {
  const { hooks, root } = loadRuntime();

  hooks.setState(allNaState());
  hooks.renderResult();

  assert.equal(root.textContent.includes('AI Posture: No In-Scope Vectors'), true);
  assert.equal(root.textContent.includes('Advance the frontier.'), false);
  assert.equal(root.textContent.includes('People - N/A'), true);
  assert.equal(root.textContent.includes('Regulation - N/A'), true);
  assert.equal(root.textContent.includes('Infrastructure - N/A'), true);
});

test('result routes to neutral criteria and evidence pages', () => {
  const { hooks, root } = loadRuntime();
  hooks.setState(completedState());

  hooks.renderResult();

  assert.equal(root.textContent.includes('Criteria and evidence requirements'), true);
  assert.equal(root.textContent.includes('People criteria and evidence - https://aiposture.org/criteria/v1/people/'), true);
  assert.equal(root.textContent.includes('Infrastructure criteria and evidence - https://aiposture.org/criteria/v1/infrastructure/'), true);
  assert.equal(root.textContent.includes('Regulation criteria and evidence - https://aiposture.org/criteria/v1/regulation/'), true);
  assert.equal(root.textContent.includes('All published criteria - https://aiposture.org/criteria/v1/'), true);
  assert.equal(root.textContent.includes('https://paice.work/'), false);
  assert.equal(root.textContent.includes('https://siteline.to/'), false);
  assert.equal(root.textContent.includes('https://everyailaw.com/'), false);
});

test('JSON artifact exposes aggregate, vector posteriors, and estimate notice', () => {
  const { hooks } = loadRuntime();
  hooks.setState(completedState());

  const artifact = hooks.buildJsonArtifact();

  assert.equal(artifact.type, 'AI Posture Pre-Assessment Result');
  assert.equal(artifact.source, 'https://aiposture.org/assess/');
  assert.equal(artifact.estimate_label, 'estimated AI Posture');
  assert.equal(artifact.notice, 'This is an estimate, not a verified assertion.');
  assert.equal(artifact.scope.label, null);
  assert.equal(typeof artifact.aggregate.level_name, 'string');
  assert.deepEqual(Object.keys(artifact.vectors), ['Infrastructure', 'Regulation', 'People']);
  assert.equal(artifact.vectors.Infrastructure.posterior.length, 6);
  assert.equal(
    artifact.vectors.Infrastructure.evidence_checklist.length > 0,
    true
  );
  assert.equal(
    artifact.vectors.Infrastructure.posterior.reduce((sum, value) => sum + value, 0) > 0.999,
    true
  );
});

test('JSON artifact generated by the runtime passes worker delivery validation', async () => {
  const { isValidPayload } = await import('../worker/src/deliver.js');
  const { hooks } = loadRuntime();
  hooks.setState(completedState());

  assert.equal(isValidPayload(hooks.buildJsonArtifact()), true);
});

test('all-N/A JSON artifact uses schema-valid aggregate naming', async () => {
  const { isValidPayload } = await import('../worker/src/deliver.js');
  const { hooks } = loadRuntime();
  hooks.setState(allNaState());

  const artifact = hooks.buildJsonArtifact();

  assert.equal(artifact.aggregate.level, null);
  assert.equal(artifact.aggregate.level_name, 'N/A');
  assert.equal(isValidPayload(artifact), true);
});

test('normalizeState drops malformed stored steps', () => {
  const malformed = {
    version: '1.0.0',
    steps: [
      { type: 'opener', id: 'O1', value: 'a', skip: false },
      { type: 'bank', vector: 'Nope', qid: 'I1', optIdx: 0 },
      { type: 'probe', id: 'O2', choice: 'maybe' },
      null
    ]
  };
  const { hooks } = loadRuntime({ sessionValue: JSON.stringify(malformed) });

  assert.equal(hooks.loadDraft(), true);
  assert.equal(JSON.stringify(hooks.getState().steps), JSON.stringify([
    { type: 'opener', id: 'O1', value: 'a', skip: false }
  ]));
});

test('loadAllData surfaces failed fetch responses clearly', async () => {
  const { hooks } = loadRuntime({
    fetchImpl(url) {
      return Promise.resolve({
        ok: false,
        status: 503,
        json() {
          throw new Error('should not parse');
        }
      });
    }
  });

  await assert.rejects(
    hooks.loadAllData(),
    /Failed to load \.\/data\/questions\.json \(503\)/
  );
});
