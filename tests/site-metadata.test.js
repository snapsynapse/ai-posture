const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SPEC = fs.readFileSync(path.join(ROOT, 'SPEC.md'), 'utf8');
const HOME = fs.readFileSync(path.join(ROOT, 'docs/index.html'), 'utf8');
const SPEC_PAGE = fs.readFileSync(path.join(ROOT, 'docs/spec/index.html'), 'utf8');
const ASSESS = fs.readFileSync(path.join(ROOT, 'docs/assess/index.html'), 'utf8');
const PRIVACY = fs.readFileSync(path.join(ROOT, 'docs/privacy/index.html'), 'utf8');
const TERMS = fs.readFileSync(path.join(ROOT, 'docs/terms/index.html'), 'utf8');
const NOT_FOUND = fs.readFileSync(path.join(ROOT, 'docs/404.html'), 'utf8');
const LLMS = fs.readFileSync(path.join(ROOT, 'docs/llms.txt'), 'utf8');
const SITEMAP = fs.readFileSync(path.join(ROOT, 'docs/sitemap.xml'), 'utf8');

function frontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(match, 'SPEC.md must have frontmatter');
  const data = {};
  match[1].split('\n').forEach(line => {
    const kv = line.match(/^([a-z_]+):\s*(.+)$/);
    if (kv) data[kv[1]] = kv[2].trim();
  });
  return data;
}

test('homepage and generated spec page use SPEC.md version', () => {
  const fm = frontmatter(SPEC);

  assert.match(
    HOME,
    new RegExp('<span class="version">' + fm.version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '</span>'),
    'homepage version badge must match SPEC.md'
  );
  assert.match(
    SPEC_PAGE,
    new RegExp('<span class="version">' + fm.version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '</span>'),
    'generated spec page version badge must match SPEC.md'
  );
});

test('homepage repo-updated date is wired to GitHub pushed_at with static fallback', () => {
  assert.match(
    HOME,
    /<time id="repo-updated" datetime="\d{4}-\d{2}-\d{2}">[A-Z][a-z]+ \d{1,2}, \d{4}<\/time>/,
    'homepage must include a visible fallback repo-updated date'
  );
  assert.equal(
    HOME.includes('https://api.github.com/repos/snapsynapse/ai-posture'),
    true,
    'homepage must refresh visible repo-updated date from GitHub pushed_at'
  );
  assert.equal(
    HOME.includes('repo.pushed_at'),
    true,
    'homepage updater must use GitHub pushed_at, not local commit date'
  );
});

test('public metadata discovers the assistant guide', () => {
  const assistantGuideLink = '<link rel="assistant-guide" href="https://aiposture.org/.well-known/assistant-guide.txt">';

  for (const html of [HOME, SPEC_PAGE, ASSESS, PRIVACY, TERMS, NOT_FOUND]) {
    assert.equal(html.includes(assistantGuideLink), true);
  }

  assert.equal(LLMS.includes('https://aiposture.org/.well-known/assistant-guide.txt'), true);
  assert.equal(LLMS.includes('https://aiposture.org/.well-known/assistant-guide-manifest.json'), true);
  assert.equal(SITEMAP.includes('https://aiposture.org/.well-known/assistant-guide.txt'), true);
  assert.equal(SITEMAP.includes('https://aiposture.org/.well-known/assistant-guide-manifest.json'), true);
});

test('llms summary does not drift from current spec terminology', () => {
  const fm = frontmatter(SPEC);

  assert.equal(LLMS.includes(`Normative specification (${fm.version})`), true);
  assert.equal(LLMS.includes('Level 0 (Ignoring)'), false);
  assert.equal(LLMS.includes('Level 0 is a falsifiable scope boundary'), true);
});
