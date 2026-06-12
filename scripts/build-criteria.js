#!/usr/bin/env node
'use strict';

// Generates the criterion registry pages under docs/criteria/v1/ from
// docs/criteria/v1/index.json. Stable IRIs: never re-mint, only supersede.
// Zero dependencies. Run from npm run build (after build-spec.js).

const fs   = require('fs');
const path = require('path');

const ROOT     = path.join(__dirname, '..');
const REGISTRY = path.join(ROOT, 'docs/criteria/v1/index.json');
const OUT_DIR  = path.join(ROOT, 'docs/criteria/v1');
const RUBRIC   = path.join(ROOT, 'docs/assess/data/rubric.json');

const VECTORS   = ['People', 'Infrastructure', 'Regulation'];
const VEC_SLUG  = v => v.toLowerCase();
const VEC_ROUTE = { People: 'people', Infrastructure: 'infrastructure', Regulation: 'regulation' };

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function pageShell({ title, description, canonical, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} &mdash; AI Posture</title>
  <meta name="description" content="${esc(description)}">
  <meta name="theme-color" content="#4f46e5">
  <link rel="canonical" href="${esc(canonical)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="assistant-guide" href="https://aiposture.org/.well-known/assistant-guide.txt">
  <meta name="robots" content="index, follow">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${esc(canonical)}">
  <meta property="og:image" content="https://aiposture.org/imgs/og.png?v=2">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:image" content="https://aiposture.org/imgs/og.png?v=2">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #ffffff; --bg-alt: #f8f9fa;
      --text: #1a1d24; --text-muted: #5a6170;
      --accent: #4f46e5; --accent-hover: #4338ca; --accent-soft: #eef2ff;
      --border: #e5e7eb;
      --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      --mono: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace;
      --max-width: 800px;
    }
    html { scroll-behavior: smooth; }
    body { font-family: var(--font); color: var(--text); background: var(--bg); line-height: 1.7; -webkit-font-smoothing: antialiased; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { color: var(--accent-hover); text-decoration: underline; }
    .skip-link { position: absolute; left: -9999px; top: 0; background: var(--accent); color: #fff; padding: 0.5rem 1rem; z-index: 100; }
    .skip-link:focus { left: 0; }
    .container { max-width: var(--max-width); margin: 0 auto; padding: 0 1.5rem; }
    nav { border-bottom: 1px solid var(--border); padding: 1rem 0; background: var(--bg); }
    nav .container { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    nav .logo { font-weight: 700; font-size: 1.1rem; color: var(--text); display: inline-flex; align-items: center; gap: 0.55rem; }
    nav .logo svg { color: var(--accent); }
    nav .links { display: flex; gap: 1.5rem; font-size: 0.9rem; }
    nav .links a { color: var(--text-muted); }
    nav .links a:hover { color: var(--text); text-decoration: none; }
    main { padding: 2.5rem 0 5rem; }
    .crumb { font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1.25rem; }
    .crumb a { color: var(--text-muted); text-decoration: underline; text-underline-offset: 2px; }
    .crumb a:hover { color: var(--accent); }
    .eyebrow { font-size: 0.72rem; font-family: var(--mono); text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); background: var(--accent-soft); border: 1px solid var(--border); padding: 0.2rem 0.65rem; border-radius: 999px; display: inline-block; margin-bottom: 0.85rem; font-weight: 600; }
    h1 { font-size: 1.85rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; margin-bottom: 0.5rem; }
    .iri { font-family: var(--mono); font-size: 0.82rem; color: var(--text-muted); word-break: break-all; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border); margin-bottom: 1.75rem; }
    .iri a { color: var(--text-muted); }
    section { margin-bottom: 2rem; }
    section h2 { font-size: 1.05rem; font-weight: 700; letter-spacing: -0.005em; margin-bottom: 0.5rem; color: var(--text); }
    section p, section li { color: var(--text); }
    section ul { margin: 0 0 0 1.25rem; }
    section li { margin-bottom: 0.25rem; }
    .assertion { font-size: 1.05rem; padding: 0.85rem 1.1rem; border-left: 3px solid var(--accent); background: var(--accent-soft); border-radius: 4px; color: var(--text); margin-bottom: 0.5rem; }
    .level-table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.88rem; }
    .level-table th, .level-table td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid var(--border); }
    .level-table th { color: var(--text-muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; background: var(--bg-alt); }
    .level-table td.lvl { font-family: var(--mono); color: var(--accent); font-weight: 700; }
    .level-table tr.current td { background: var(--accent-soft); }
    .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem 2rem; font-size: 0.9rem; }
    .pair dt { color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .pair dd { color: var(--text); margin-bottom: 0.4rem; }
    .pair dd a { word-break: break-all; }
    footer { border-top: 1px solid var(--border); padding: 2rem 0; font-size: 0.85rem; color: var(--text-muted); }
    footer .container { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem; }
    @media (max-width: 720px) {
      .pair { grid-template-columns: 1fr; }
      nav .links { display: none; }
    }
  </style>
</head>
<body>
<a class="skip-link" href="#main-content">Skip to content</a>
<nav aria-label="Main navigation">
  <div class="container">
    <a href="/" class="logo" aria-label="AI Posture home">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
        <circle cx="12" cy="13" r="7" stroke="currentColor" stroke-width="2" opacity="0.55"/>
        <circle cx="20" cy="13" r="7" stroke="currentColor" stroke-width="2" opacity="0.55"/>
        <circle cx="16" cy="20" r="7" stroke="currentColor" stroke-width="2" opacity="0.55"/>
        <circle cx="16" cy="16" r="2.2" fill="currentColor"/>
      </svg>
      <span>AI Posture</span>
    </a>
    <div class="links">
      <a href="/spec/">Spec</a>
      <a href="/assess/">Assess</a>
      <a href="/criteria/v1/">Criteria</a>
    </div>
  </div>
</nav>
<main id="main-content">
  <div class="container">
${body}
  </div>
</main>
<footer>
  <div class="container">
    <span>AI Posture &middot; CC BY 4.0 (spec) &middot; MIT (code)</span>
    <span><a href="https://github.com/snapsynapse/ai-posture">GitHub</a></span>
  </div>
</footer>
</body>
</html>
`;
}

function criterionPage(c, allForVector) {
  const iri = c.iri;
  const description = `AI Posture ${c.vector} vector, Level ${c.level} (${c.level_name}): ${c.assertion} Stable criterion IRI for use in EARL verified assessments.`;
  const jsonld = {
    "@context": {
      "earl": "http://www.w3.org/ns/earl#",
      "apos": "https://aiposture.org/ns#",
      "dct":  "http://purl.org/dc/terms/",
      "title":       "dct:title",
      "description": "dct:description",
      "vector":      "apos:vector",
      "level":       "apos:level",
      "levelName":   "apos:levelName"
    },
    "@id":   iri,
    "@type": ["earl:TestCriterion", "apos:TestCriterion"],
    "title": `${c.vector} L${c.level} ${c.level_name}`,
    "description": c.assertion,
    "vector": c.vector,
    "level": c.level,
    "levelName": c.level_name
  };
  const body = `
    <p class="crumb"><a href="/">Home</a> &rsaquo; <a href="/criteria/v1/">Criteria</a> &rsaquo; <a href="/criteria/v1/${VEC_ROUTE[c.vector]}/">${esc(c.vector)}</a> &rsaquo; L${c.level}</p>
    <span class="eyebrow">Criterion &middot; v1</span>
    <h1>${esc(c.vector)} L${c.level} &mdash; ${esc(c.level_name)}</h1>
    <p class="iri"><a href="${esc(iri)}">${esc(iri)}</a></p>

    <section>
      <h2>Assertion</h2>
      <p class="assertion">${esc(c.assertion)}</p>
    </section>

    <section>
      <h2>Evidence</h2>
      <ul>
        ${c.evidence.map(e => `<li>${esc(e)}</li>`).join('\n        ')}
      </ul>
    </section>

    <section>
      <h2>Test</h2>
      <p>${esc(c.test)}</p>
    </section>

    <section>
      <h2>Metadata</h2>
      <dl class="pair">
        <dt>Vector</dt><dd>${esc(c.vector)}</dd>
        <dt>Level</dt><dd>${c.level} (${esc(c.level_name)})</dd>
        <dt>Source</dt><dd><a href="https://github.com/snapsynapse/ai-posture/blob/main/docs/assess/data/rubric.json">rubric.json</a></dd>
        <dt>Profile</dt><dd><a href="/schema/earl/v0/">EARL v0 profile</a></dd>
        <dt>License</dt><dd>CC BY 4.0</dd>
        <dt>Stability</dt><dd>Stable IRI &mdash; never re-minted, only superseded under a new namespace version.</dd>
      </dl>
    </section>

    <section>
      <h2>${esc(c.vector)} criteria</h2>
      <table class="level-table">
        <thead><tr><th>Level</th><th>Name</th><th>Assertion</th></tr></thead>
        <tbody>
          ${allForVector.map(x => `<tr class="${x.level === c.level ? 'current' : ''}"><td class="lvl">L${x.level}</td><td><a href="/criteria/v1/${VEC_ROUTE[x.vector]}/${x.level}/">${esc(x.level_name)}</a></td><td>${esc(x.assertion)}</td></tr>`).join('\n          ')}
        </tbody>
      </table>
    </section>

    <script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
    </script>
`;
  return pageShell({
    title: `${c.vector} L${c.level} ${c.level_name}`,
    description,
    canonical: iri + '/',
    body
  });
}

function vectorIndexPage(vector, all) {
  const items = all.filter(c => c.vector === vector);
  const description = `AI Posture ${vector} vector criterion IRIs (v1). Five levels from Perceiving to Engineering, each citable as a stable test criterion in EARL verified assessments.`;
  const canonical = `https://aiposture.org/criteria/v1/${VEC_ROUTE[vector]}/`;
  const body = `
    <p class="crumb"><a href="/">Home</a> &rsaquo; <a href="/criteria/v1/">Criteria</a> &rsaquo; ${esc(vector)}</p>
    <span class="eyebrow">Criteria &middot; v1</span>
    <h1>${esc(vector)} criteria</h1>
    <p class="iri">https://aiposture.org/criteria/v1/${VEC_ROUTE[vector]}/</p>

    <section>
      <h2>Levels</h2>
      <table class="level-table">
        <thead><tr><th>Level</th><th>Name</th><th>Assertion</th></tr></thead>
        <tbody>
          ${items.map(c => `<tr><td class="lvl">L${c.level}</td><td><a href="/criteria/v1/${VEC_ROUTE[vector]}/${c.level}/">${esc(c.level_name)}</a></td><td>${esc(c.assertion)}</td></tr>`).join('\n          ')}
        </tbody>
      </table>
    </section>

    <section>
      <h2>About this vector</h2>
      <p>See the <a href="/spec/">specification</a> for the full vector definition and the <a href="/schema/earl/v0/">EARL v0 profile</a> for how these criterion IRIs appear in verified assessments.</p>
    </section>
`;
  return pageShell({
    title: `${vector} criteria`,
    description,
    canonical,
    body
  });
}

function registryIndexPage(registry) {
  const description = 'AI Posture criterion IRI registry (v1). Fifteen stable test criterion IRIs across the People, Infrastructure, and Regulation vectors for the five maturity levels.';
  const canonical = 'https://aiposture.org/criteria/v1/';
  const body = `
    <p class="crumb"><a href="/">Home</a> &rsaquo; Criteria</p>
    <span class="eyebrow">Registry &middot; v1</span>
    <h1>AI Posture criterion IRIs</h1>
    <p class="iri">https://aiposture.org/criteria/v1/</p>

    <section>
      <p>Stable test criterion IRIs for the AI Posture <a href="/schema/earl/v0/">EARL v0 wire format</a>. One IRI per vector per maturity level. Level 0 (N/A) is a falsifiable scope boundary defined in the <a href="/spec/">specification</a>, not a test criterion, and has no IRI.</p>
      <p>These IRIs are stable. A criterion is never re-minted; a superseded criterion is replaced by a new IRI under a new namespace version, and the old IRI continues to resolve to its original meaning. The machine-readable registry is at <a href="/criteria/v1/index.json"><code>index.json</code></a>.</p>
    </section>

    ${VECTORS.map(v => `<section>
      <h2><a href="/criteria/v1/${VEC_ROUTE[v]}/">${esc(v)}</a></h2>
      <table class="level-table">
        <thead><tr><th>Level</th><th>Name</th><th>Assertion</th></tr></thead>
        <tbody>
          ${registry.criteria.filter(c => c.vector === v).map(c => `<tr><td class="lvl">L${c.level}</td><td><a href="/criteria/v1/${VEC_ROUTE[v]}/${c.level}/">${esc(c.level_name)}</a></td><td>${esc(c.assertion)}</td></tr>`).join('\n          ')}
        </tbody>
      </table>
    </section>`).join('\n\n    ')}

    <section>
      <h2>Use in EARL</h2>
      <p>Each criterion IRI is the <code>earl:test</code> of an <code>earl:Assertion</code>. See the <a href="/schema/earl/v0/profile.md">profile</a> and <a href="/schema/earl/v0/example.jsonld">example</a> for usage.</p>
    </section>
`;
  return pageShell({
    title: 'AI Posture criterion IRIs',
    description,
    canonical,
    body
  });
}

function writePage(rel, html) {
  const out = path.join(OUT_DIR, rel, 'index.html');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  console.log(`  wrote ${path.relative(ROOT, out)}`);
}

function main() {
  const registry = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
  // Sanity: every rubric L1-L5 row has a registry entry.
  const rubric = JSON.parse(fs.readFileSync(RUBRIC, 'utf8'));
  for (const v of VECTORS) {
    for (const row of rubric.vectors[v]) {
      if (row.level === 0) continue;
      const hit = registry.criteria.find(c => c.vector === v && c.level === row.level);
      if (!hit) throw new Error(`registry missing ${v} L${row.level} (${row.name}); rerun after updating index.json`);
    }
  }
  // Registry root + per-vector index + per-criterion page.
  writePage('', registryIndexPage(registry));
  for (const v of VECTORS) {
    writePage(VEC_ROUTE[v], vectorIndexPage(v, registry.criteria));
  }
  const byVector = Object.fromEntries(VECTORS.map(v => [v, registry.criteria.filter(c => c.vector === v)]));
  for (const c of registry.criteria) {
    writePage(`${VEC_ROUTE[c.vector]}/${c.level}`, criterionPage(c, byVector[c.vector]));
  }
}

if (require.main === module) {
  try { main(); } catch (e) { console.error('build-criteria:', e.message); process.exit(1); }
}

module.exports = { main };
