const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const PAPERS = fs.readFileSync(path.join(ROOT, 'docs/papers/index.html'), 'utf8');

const PAGES = [
  'docs/index.html',
  'docs/spec/index.html',
  'docs/assess/index.html',
  'docs/privacy/index.html',
  'docs/terms/index.html',
  'docs/papers/index.html'
];

test('published paper assets exist on disk', () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, 'docs/papers/ai-posture-whitepaper-v1.pdf')),
    'whitepaper PDF must be published under docs/papers/'
  );
  assert.ok(
    fs.existsSync(path.join(ROOT, 'docs/papers/stop-averaging-your-ai-risks.m4a')),
    'audio overview must be published under docs/papers/'
  );
});

test('papers page wires the PDF, audio, and video, with no leftover placeholders', () => {
  assert.match(PAPERS, /href="\/papers\/ai-posture-whitepaper-v1\.pdf"/, 'PDF download link');
  assert.match(PAPERS, /<audio[^>]*src="\/papers\/stop-averaging-your-ai-risks\.m4a"/, 'audio player wired to the file');
  assert.match(PAPERS, /youtube-nocookie\.com\/embed\/f_BGJaMmYO0/, 'youtube video embed');
  assert.doesNotMatch(PAPERS, /coming soon/i, 'media placeholders must be activated, not left as "coming soon"');
});

test('executive-brief companion links out to its canonical PAICE.foundation home', () => {
  assert.match(
    PAPERS,
    /href="https:\/\/paice\.foundation\/papers\/aggregated-intelligence\/"/,
    'companion entry must link to the brief on PAICE.foundation, not re-host it here'
  );
  // the brief PDF must not be re-hosted on this site
  assert.ok(
    !fs.existsSync(path.join(ROOT, 'docs/papers/brief_aggregated-intelligence_v1.pdf')),
    'the executive brief must not be re-hosted under docs/papers/'
  );
});

test('every page exposes the Papers nav link', () => {
  for (const rel of PAGES) {
    const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    assert.match(html, /<a href="\/papers\/"[^>]*>Papers<\/a>/, `${rel} must have a Papers nav link`);
  }
});
