const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

// Public and agent-facing surfaces that must stay free of pre-1.0 status
// language, the superseded spec version, conditional "when deployed" copy,
// and non-canonical www URLs. CHANGELOG.md is intentionally excluded: it is
// an append-only history that legitimately records the prior versions and
// the beta-notice removal itself.
const SURFACES = [
  'README.md',
  'docs/index.html',
  'docs/spec/index.html',
  'docs/assess/index.html',
  'docs/privacy/index.html',
  'docs/terms/index.html',
  'docs/papers/index.html',
  'docs/llms.txt',
  'docs/.well-known/ai-posture-framework.json'
];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

test('public surfaces carry no beta status language', () => {
  for (const rel of SURFACES) {
    assert.doesNotMatch(read(rel), /\bbeta\b/i, `${rel} still contains "beta"`);
  }
});

test('public surfaces do not pin the superseded spec version', () => {
  for (const rel of SURFACES) {
    assert.doesNotMatch(read(rel), /v?0\.3\.2/, `${rel} still references the old spec version 0.3.2`);
  }
});

test('public surfaces do not carry stale "when deployed" conditionals', () => {
  for (const rel of SURFACES) {
    assert.doesNotMatch(read(rel), /when deployed/i, `${rel} still says "when deployed"`);
  }
});

test('public surfaces use bare canonical domains, not www', () => {
  // Exception: YouTube's privacy-enhanced embed reliably serves only from
  // www.youtube-nocookie.com (the bare host fails to load in an iframe). That
  // third-party embed host is the one allowed www; our own domains must be bare.
  for (const rel of SURFACES) {
    const content = read(rel).replace(/https?:\/\/www\.youtube-nocookie\.com/gi, '');
    assert.doesNotMatch(content, /https?:\/\/www\./i, `${rel} contains a www URL`);
  }
});

test('package and spec are both at the 1.0.0 line', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.version, '1.0.0');
  const spec = read('SPEC.md');
  assert.match(spec, /^version: v1\.0\.0$/m, 'SPEC.md frontmatter must declare v1.0.0');
});
