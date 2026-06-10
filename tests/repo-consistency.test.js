const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// The canonical-spec-page PROJECT_CONTEXT is intentionally duplicated so the
// skill works across agent surfaces (.claude for Claude Code, .agents for
// everything else). The two copies must never drift.
test('canonical-spec-page PROJECT_CONTEXT copies are byte-identical', () => {
  const claude = read('.claude/skills/canonical-spec-page/PROJECT_CONTEXT.md');
  const agents = read('.agents/skills/canonical-spec-page/PROJECT_CONTEXT.md');
  assert.equal(claude, agents, '.claude and .agents PROJECT_CONTEXT.md have drifted');
});

// Every route the worker actually serves must be documented in its README.
// Code ships faster than docs here; this catches the README falling behind.
test('worker README documents every route in worker/src/index.js', () => {
  const src = read('worker/src/index.js');
  const readme = read('worker/README.md');
  const routes = [...src.matchAll(/url\.pathname === '([^']+)'/g)].map(m => m[1]);
  assert.ok(routes.length >= 3, 'expected to find routes in worker/src/index.js');
  for (const route of routes) {
    assert.ok(readme.includes(route), `worker/README.md does not document route ${route}`);
  }
});

// Every URL the sitemap advertises must resolve to a published file in docs/.
test('sitemap URLs resolve to files on disk', () => {
  const sitemap = read('docs/sitemap.xml');
  const locs = [...sitemap.matchAll(/<loc>https:\/\/aiposture\.org(\/[^<]*)<\/loc>/g)].map(m => m[1]);
  assert.ok(locs.length > 0, 'sitemap has no <loc> entries');
  for (const loc of locs) {
    const rel = loc.endsWith('/') ? path.join('docs', loc, 'index.html') : path.join('docs', loc);
    assert.ok(fs.existsSync(path.join(ROOT, rel)), `sitemap lists ${loc} but ${rel} does not exist`);
  }
});
