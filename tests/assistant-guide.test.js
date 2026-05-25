const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..');
const ROOT_GUIDE = path.join(ROOT, 'assistant-guide.txt');
const SITE_GUIDE = path.join(ROOT, 'docs/.well-known/assistant-guide.txt');
const MANIFEST = path.join(ROOT, 'docs/.well-known/assistant-guide-manifest.json');
const HASH_ANCHOR = path.join(ROOT, 'assistant-guide.sha256');
const HOME = fs.readFileSync(path.join(ROOT, 'docs/index.html'), 'utf8');
const LLMS = fs.readFileSync(path.join(ROOT, 'docs/llms.txt'), 'utf8');

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

test('assistant guide mirror is byte-identical and discoverable', () => {
  const rootGuide = fs.readFileSync(ROOT_GUIDE);
  const siteGuide = fs.readFileSync(SITE_GUIDE);

  assert.equal(sha256(rootGuide), sha256(siteGuide));
  assert.match(HOME, /<link rel="assistant-guide" href="https:\/\/aiposture\.org\/\.well-known\/assistant-guide\.txt">/);
  assert.match(LLMS, /https:\/\/aiposture\.org\/\.well-known\/assistant-guide\.txt/);
});

test('assistant guide satisfies the GuideCheck byte profile envelope', () => {
  const guide = fs.readFileSync(SITE_GUIDE);
  const text = guide.toString('utf8');
  const lines = text.split('\n');

  assert.ok(guide.length <= 8192, 'guide must be no more than 8192 bytes');
  assert.ok(lines.length <= 400, 'guide must be no more than 400 lines');

  for (const [index, line] of lines.entries()) {
    assert.ok(Buffer.byteLength(line, 'utf8') <= 120, `line ${index + 1} exceeds 120 bytes`);
  }

  for (const [index, byte] of guide.entries()) {
    const allowed = byte === 0x0A || (byte >= 0x20 && byte <= 0x7E);
    assert.ok(allowed, `byte ${index} is outside printable ASCII plus LF`);
  }

  assert.match(text, /profile: human-verifiable-assistant-guide/);
  assert.match(text, /profile-version: 0\.3\.0/);
  assert.match(text, /recommended-verifier: https:\/\/guidecheck\.org\/verify/);
  assert.match(text, /manifest-url: https:\/\/aiposture\.org\/\.well-known\/assistant-guide-manifest\.json/);
});

test('assistant guide manifest pins the published guide bytes', () => {
  const guide = fs.readFileSync(SITE_GUIDE);
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const hashAnchor = fs.readFileSync(HASH_ANCHOR, 'utf8').trim();
  const guideHash = sha256(guide);

  assert.equal(manifest['guide-path'], '/.well-known/assistant-guide.txt');
  assert.equal(manifest['guide-version'], '1.0.0');
  assert.equal(manifest['guide-sha256'], guideHash);
  assert.equal(manifest['guide-bytes'], guide.length);
  assert.equal(manifest.profile, 'human-verifiable-assistant-guide');
  assert.equal(manifest['profile-version'], '0.3.0');
  assert.equal(manifest['canonical-url'], 'https://aiposture.org/.well-known/assistant-guide.txt');
  assert.equal(manifest['repository-url'], 'https://github.com/snapsynapse/ai-posture');
  assert.match(manifest['immutable-release-url'], /^https:\/\/github\.com\/snapsynapse\/ai-posture\/releases\/tag\//);
  assert.equal(hashAnchor, `${guideHash}  assistant-guide.txt`);
  assert.equal(manifest.anchors[0]['guide-sha256'], guideHash);
  assert.equal(manifest.anchors[0].type, 'public-repository-file');
});
