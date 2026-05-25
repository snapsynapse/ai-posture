#!/usr/bin/env node
'use strict';

// Generates docs/spec/index.html from SPEC.md.
// Zero dependencies — Node.js builtins only.
// Usage: node scripts/build-spec.js

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC  = path.join(ROOT, 'SPEC.md');
const OUT  = path.join(ROOT, 'docs', 'spec', 'index.html');

// ── helpers ──────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inline(text) {
  return esc(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => `<a href="${esc(u)}">${t}</a>`);
}

// ── frontmatter ───────────────────────────────────────────────────────────────

function parseFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('SPEC.md: no YAML frontmatter block (expected --- delimiters)');
  const fm = {};
  m[1].split('\n').forEach(line => {
    const kv = line.match(/^([a-z_]+):\s*(.+)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  });
  return { fm, body: m[2] };
}

// ── section extraction ────────────────────────────────────────────────────────

function extractSections(body) {
  const sections = [];
  const re = /^## (.+)$/gm;
  let match;
  const headings = [];
  while ((match = re.exec(body)) !== null) headings.push({ title: match[1], idx: match.index });

  headings.forEach((h, i) => {
    const start = body.indexOf('\n', h.idx) + 1;
    const end   = i + 1 < headings.length ? headings[i + 1].idx : body.length;
    sections.push({ title: h.title, content: body.slice(start, end).trim() });
  });
  return sections;
}

function extractH1(body) {
  const m = body.match(/^# (.+)$/m);
  return m ? m[1].trim() : 'Aggregated Intelligence Posture';
}

// ── block renderer ────────────────────────────────────────────────────────────

function renderBlocks(md) {
  const lines = md.split('\n');
  let out = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    // fenced code block
    if (line.startsWith('```')) {
      const fence = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { fence.push(lines[i]); i++; }
      i++;
      out += `<pre><code>${esc(fence.join('\n'))}</code></pre>\n`;
      continue;
    }

    // markdown table
    if (line.trimStart().startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].trimStart().startsWith('|')) { rows.push(lines[i]); i++; }
      out += renderTable(rows);
      continue;
    }

    // ordered list (maturity levels: "0. N/A. ..." / "1. Perceiving. ...")
    if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        const m = lines[i].match(/^(\d+)\. ([\s\S]*)$/);
        const item = { n: m[1], text: m[2] };
        i++;
        // collect indented continuation lines
        while (i < lines.length && /^\s{2,}/.test(lines[i])) {
          item.text += ' ' + lines[i].trim();
          i++;
        }
        items.push(item);
      }
      out += renderMaturityTable(items);
      continue;
    }

    // unordered list
    if (line.startsWith('- ')) {
      const items = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2));
        i++;
      }
      out += renderUL(items);
      continue;
    }

    // paragraph — collect until blank line
    const para = [];
    while (i < lines.length && lines[i].trim()) { para.push(lines[i]); i++; }
    out += `<p>${inline(para.join(' '))}</p>\n`;
  }

  return out;
}

function renderTable(rows) {
  // skip separator row (contains ---) when iterating data rows
  const headers = rows[0].split('|').map(h => h.trim()).filter(Boolean);
  let html = '<div class="table-wrap"><table>\n<thead><tr>';
  headers.forEach(h => {
    html += `<th${h === '#' ? ' class="num"' : ''}>${esc(h)}</th>`;
  });
  html += '</tr></thead>\n<tbody>';
  for (let r = 1; r < rows.length; r++) {
    if (/^\s*\|[-| :]+\|\s*$/.test(rows[r])) continue; // skip separator
    const cells = rows[r].split('|').map(c => c.trim()).filter(Boolean);
    if (!cells.length) continue;
    html += '<tr>';
    cells.forEach((cell, idx) => {
      let cls = '';
      if (headers[idx] === '#')     cls = ' class="num"';
      if (headers[idx] === 'Level') cls = ' class="level"';
      const content = headers[0] === 'Vector' && idx === 0
        ? `<strong>${inline(cell)}</strong>` : inline(cell);
      html += `<td${cls}>${content}</td>`;
    });
    html += '</tr>';
  }
  html += '\n</tbody></table></div>\n';
  return html;
}

function renderMaturityTable(items) {
  // Converts ordered list "N. LevelName. Description" to a styled table
  let html = '<div class="table-wrap"><table>\n<thead><tr>';
  html += '<th class="num">#</th><th>Level</th><th>What it means</th>';
  html += '</tr></thead>\n<tbody>';
  items.forEach(({ n, text }) => {
    const m = text.match(/^([^.]+)\. ([\s\S]+)$/);
    if (m) {
      html += `<tr><td class="num">${esc(n)}</td>`;
      html += `<td class="level">${esc(m[1].trim())}</td>`;
      html += `<td>${inline(m[2].trim())}</td></tr>`;
    } else {
      html += `<tr><td class="num">${esc(n)}</td><td colspan="2">${inline(text)}</td></tr>`;
    }
  });
  html += '\n</tbody></table></div>\n';
  return html;
}

function renderUL(items) {
  // Detect "principles list" pattern: every item is "Label. Description" (label ≤ 50 chars)
  const isPrinciples = items.length > 1 && items.every(
    item => /^[A-Z][^.]{3,50}\. .{20,}/.test(item)
  );
  if (isPrinciples) {
    const lis = items.map(item => {
      const m = item.match(/^([^.]+)\. ([\s\S]+)$/);
      return m
        ? `  <li><strong>${inline(m[1])}.</strong> ${inline(m[2])}</li>`
        : `  <li>${inline(item)}</li>`;
    });
    return `<ul class="principles-list">\n${lis.join('\n')}\n</ul>\n`;
  }
  return '<ul>\n' + items.map(i => `  <li>${inline(i)}</li>`).join('\n') + '\n</ul>\n';
}

// ── slug helpers ──────────────────────────────────────────────────────────────

function slug(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, '-');
}

// Shortened TOC label for sidebar
function tocLabel(title) {
  const map = {
    'The five-level maturity model': 'Five-level model',
    'Scope and comparability':       'Scope &amp; comparability',
    'Decay and freshness':           'Decay &amp; freshness',
    'Relationship to adjacent frameworks': 'Adjacent frameworks',
  };
  return map[title] || title;
}

// ── page template ─────────────────────────────────────────────────────────────

function renderPage(fm, title, sections) {
  const version     = fm.version     || '';
  const status      = fm.status      || '';
  const published   = fm.published   || '';
  const lastMod     = fm.last_modified || '';
  const versionNum  = version.replace(/^v/, '');

  // Sections to render in page (skip "Canonical location" — folded into License)
  const skip = new Set(['Canonical location']);
  const pageSections = sections.filter(s => !skip.has(s.title));

  // TOC
  const tocItems = pageSections.map(s =>
    `          <li><a href="#${slug(s.title)}">${tocLabel(s.title)}</a></li>`
  ).join('\n');

  // Section bodies
  const sectionHTML = pageSections.map(s => {
    let content = renderBlocks(s.content);

    if (s.title === 'Governance') {
      content += `
          <a href="https://github.com/snapsynapse/ai-posture" class="gh-link" target="_blank" rel="noopener">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
            View on GitHub
          </a>`;
    }

    if (s.title === 'License') {
      content += `
          <div class="note-box">
            <strong>Canonical reference.</strong> This page is the authoritative definition of the Aggregated Intelligence Posture framework. Any cross-posts or references should cite <a href="https://aiposture.org/">aiposture.org</a> as canonical. Last substantive revision: <time datetime="${esc(lastMod)}">${esc(lastMod)}</time>.
          </div>`;
    }

    return `
        <section id="${slug(s.title)}">
          <h2>${esc(s.title)}</h2>
          ${content}
        </section>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
  <title>Specification &mdash; ${esc(title)} ${esc(version)}</title>
  <meta name="description" content="The normative specification for the Aggregated Intelligence Posture framework. Covers the vector set, five-level maturity model, constraint rule, decay, and relationship to NIST AI RMF, ISO/IEC 42001, and the EU AI Act.">
  <meta name="keywords" content="aggregated intelligence posture, ai posture spec, ai governance maturity model, paice">
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
  <meta name="theme-color" content="#4f46e5">
  <link rel="canonical" href="https://aiposture.org/spec/">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="mask-icon" href="/favicon.svg" color="#4f46e5">
  <link rel="apple-touch-icon" href="/favicon.svg">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="sitemap" type="application/xml" href="/sitemap.xml">
  <link rel="alternate" type="text/plain" href="https://aiposture.org/llms.txt" title="LLM-readable summary">
  <link rel="assistant-guide" href="https://aiposture.org/.well-known/assistant-guide.txt">

  <meta property="og:type" content="article">
  <meta property="og:site_name" content="AI Posture">
  <meta property="og:title" content="AI Posture Specification ${esc(version)}">
  <meta property="og:description" content="The normative specification for the Aggregated Intelligence Posture framework. One score. Three vectors. Bounded by the weakest.">
  <meta property="og:url" content="https://aiposture.org/spec/">
  <meta property="og:locale" content="en_US">
  <meta property="article:published_time" content="${esc(published)}T00:00:00Z">
  <meta property="article:modified_time" content="${esc(lastMod)}T00:00:00Z">
  <meta property="article:section" content="Open Patterns">
  <meta property="article:tag" content="ai-posture">
  <meta property="article:tag" content="aggregated-intelligence-posture">
  <meta property="article:tag" content="ai-governance">
  <meta property="article:tag" content="specification">

  <meta property="og:image" content="https://aiposture.org/imgs/og.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="AI Posture Specification ${esc(version)}">
  <meta name="twitter:description" content="The normative specification for the Aggregated Intelligence Posture framework. One score. Three vectors. Bounded by the weakest.">
  <meta name="twitter:image" content="https://aiposture.org/imgs/og.png">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": "${esc(title)} Specification",
    "description": "The normative specification for the Aggregated Intelligence Posture framework, covering the vector set, five-level maturity model, constraint rule, decay, and relationship to adjacent frameworks.",
    "inLanguage": "en",
    "url": "https://aiposture.org/spec/",
    "mainEntityOfPage": { "@type": "WebPage", "@id": "https://aiposture.org/spec/" },
    "datePublished": "${esc(published)}",
    "dateModified": "${esc(lastMod)}",
    "version": "${esc(versionNum)}",
    "author": { "@type": "Organization", "name": "PAICE.work PBC", "url": "https://paice.work/" },
    "publisher": { "@type": "Organization", "name": "PAICE.work PBC", "url": "https://paice.work/" },
    "license": "https://creativecommons.org/licenses/by/4.0/"
  }
  </script>

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #ffffff; --bg-alt: #f8f9fa; --surface2: #f1f3f5;
      --text: #1a1d24; --text-muted: #5a6170;
      --accent: #4f46e5; --accent-hover: #4338ca; --accent-soft: #eef2ff;
      --border: #e5e7eb; --code-bg: #0f1117; --code-text: #e1e4ed;
      --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      --mono: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace;
      --max-width: 960px; --radius: 10px;
    }
    html { scroll-behavior: smooth; }
    body { font-family: var(--font); color: var(--text); background: var(--bg); line-height: 1.7; -webkit-font-smoothing: antialiased; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { color: var(--accent-hover); text-decoration: underline; }
    .skip-link { position: absolute; left: -9999px; top: 0; background: var(--accent); color: #fff; padding: 0.5rem 1rem; z-index: 100; }
    .skip-link:focus { left: 0; }
    .container { max-width: var(--max-width); margin: 0 auto; padding: 0 1.5rem; }
    nav { border-bottom: 1px solid var(--border); padding: 1rem 0; position: sticky; top: 0; background: var(--bg); z-index: 10; }
    nav .container { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    nav .logo { font-weight: 700; font-size: 1.1rem; color: var(--text); text-decoration: none; letter-spacing: -0.01em; display: inline-flex; align-items: center; gap: 0.55rem; }
    nav .logo svg { color: var(--accent); flex: 0 0 auto; }
    nav .logo:hover svg { color: var(--accent-hover); }
    nav .links { display: flex; align-items: center; gap: 1.5rem; font-size: 0.9rem; }
    nav .links a { color: var(--text-muted); }
    nav .links a:hover { color: var(--text); text-decoration: none; }
    nav .links a[aria-current="page"] { color: var(--accent); font-weight: 600; }
    .page-layout { display: grid; grid-template-columns: 200px 1fr; gap: 3rem; align-items: start; padding: 3rem 0 5rem; }
    .toc { position: sticky; top: 5rem; font-size: 0.82rem; line-height: 1.5; }
    .toc-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); margin-bottom: 0.75rem; }
    .toc ol { list-style: none; padding: 0; }
    .toc li { margin-bottom: 0.3rem; }
    .toc a { color: var(--text-muted); text-decoration: none; display: block; padding: 0.15rem 0 0.15rem 0.6rem; border-left: 2px solid transparent; transition: color 0.1s, border-color 0.1s; }
    .toc a:hover { color: var(--accent); text-decoration: none; border-left-color: var(--accent); }
    .doc-header { margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
    .doc-eyebrow { font-size: 0.72rem; font-family: var(--mono); text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent); background: var(--accent-soft); border: 1px solid var(--border); padding: 0.2rem 0.65rem; border-radius: 999px; display: inline-block; margin-bottom: 1rem; font-weight: 600; }
    .doc-header h1 { font-size: 2.25rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1.15; margin-bottom: 0.75rem; }
    .doc-meta { font-size: 0.82rem; color: var(--text-muted); display: flex; flex-wrap: wrap; gap: 0.4rem 0.9rem; align-items: center; }
    .doc-meta .sep { color: var(--border); }
    .doc-meta a { color: var(--text-muted); text-decoration: underline; text-underline-offset: 2px; }
    .doc-meta a:hover { color: var(--accent-hover); }
    .doc-meta .version { font-family: var(--mono); font-size: 0.7rem; padding: 0.15rem 0.55rem; border-radius: 999px; background: var(--accent-soft); color: var(--accent); border: 1px solid var(--border); }
    .doc-content section { margin-bottom: 3rem; }
    .doc-content h2 { font-size: 1.45rem; font-weight: 700; letter-spacing: -0.01em; margin-bottom: 1rem; padding-top: 0.25rem; scroll-margin-top: 5rem; color: var(--text); }
    .doc-content p { margin-bottom: 1rem; color: var(--text); }
    .doc-content p:last-child { margin-bottom: 0; }
    .doc-content ul, .doc-content ol { margin: 0 0 1rem 1.5rem; }
    .doc-content li { margin-bottom: 0.4rem; color: var(--text); }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.88rem; }
    th, td { text-align: left; padding: 0.65rem 0.9rem; border-bottom: 1px solid var(--border); }
    th { font-weight: 600; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; background: var(--bg-alt); }
    td.level { font-family: var(--mono); color: var(--accent); font-weight: 700; white-space: nowrap; }
    td.num { font-family: var(--mono); text-align: center; width: 3em; color: var(--text-muted); }
    tr:last-child td { border-bottom: none; }
    .table-wrap { overflow-x: auto; margin-bottom: 1.5rem; border: 1px solid var(--border); border-radius: 8px; }
    .table-wrap table { margin-bottom: 0; }
    .table-wrap th:first-child, .table-wrap td:first-child { padding-left: 1rem; }
    .table-wrap th:last-child, .table-wrap td:last-child { padding-right: 1rem; }
    code { font-family: var(--mono); font-size: 0.88em; color: var(--accent); background: var(--accent-soft); padding: 0.1em 0.4em; border-radius: 4px; }
    pre { background: var(--code-bg); color: var(--code-text); padding: 1.25rem; border-radius: 8px; overflow-x: auto; font-family: var(--mono); font-size: 0.8rem; line-height: 1.6; border: 1px solid var(--border); margin-bottom: 1.5rem; }
    pre code { color: var(--code-text); background: transparent; padding: 0; }
    .principles-list { list-style: none; padding: 0; margin: 0 0 1rem; }
    .principles-list li { padding: 0.75rem 0 0.75rem 1rem; border-left: 3px solid var(--border); margin-bottom: 0.75rem; color: var(--text); }
    .principles-list li:last-child { margin-bottom: 0; }
    .principles-list li strong { color: var(--accent); }
    .note-box { padding: 1rem 1.25rem; background: var(--bg-alt); border: 1px solid var(--border); border-left: 3px solid var(--accent); border-radius: 8px; font-size: 0.88rem; color: var(--text-muted); margin-top: 1.5rem; }
    .note-box strong { color: var(--text); }
    .note-box a { text-decoration: underline; text-underline-offset: 2px; }
    .gh-link { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.75rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-alt); color: var(--text); font-weight: 600; font-size: 0.82rem; text-decoration: none; transition: border-color 0.1s ease, transform 0.05s ease; margin-top: 0.5rem; }
    .gh-link:hover { border-color: var(--accent); text-decoration: none; transform: translateY(-1px); color: var(--text); }
    footer { border-top: 1px solid var(--border); padding: 2.5rem 0; font-size: 0.85rem; color: var(--text-muted); }
    @media (max-width: 860px) {
      .page-layout { grid-template-columns: 1fr; gap: 0; padding-top: 2rem; }
      .toc { display: none; }
      .doc-header h1 { font-size: 1.75rem; }
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
      <a href="/assess/">Assess</a>
      <a href="/spec/" aria-current="page">Spec</a>
    </div>
  </div>
</nav>

<main id="main-content">
  <div class="container">
    <div class="page-layout">

      <nav class="toc" aria-label="On this page">
        <div class="toc-label">On this page</div>
        <ol>
${tocItems}
        </ol>
      </nav>

      <article class="doc-content" aria-labelledby="spec-title">
        <header class="doc-header">
          <div class="doc-eyebrow">Specification</div>
          <h1 id="spec-title">${esc(title)}</h1>
          <div class="doc-meta">
            <span class="version">${esc(version)}</span>
            <span class="sep">&middot;</span>
            <span>${esc(status)}</span>
            <span class="sep">&middot;</span>
            <time datetime="${esc(published)}">${esc(published)}</time>
            <span class="sep">&middot;</span>
            Updated <time datetime="${esc(lastMod)}">${esc(lastMod)}</time>
            <span class="sep">&middot;</span>
            <a href="https://creativecommons.org/licenses/by/4.0/" rel="license" target="_blank">CC&nbsp;BY&nbsp;4.0</a>
            <span class="sep">&middot;</span>
            <a href="https://github.com/snapsynapse/ai-posture/commits/main/SPEC.md" target="_blank" rel="noopener">Revision history</a>
          </div>
        </header>
${sectionHTML}
      </article>

    </div>
  </div>
</main>

<footer>
  <div class="container" style="text-align: center;">
    <p style="font-size: 0.85rem; color: var(--text-muted);">A <a href="https://paice.foundation/" target="_blank" rel="noopener">PAICE Foundation</a> project &middot; <a href="/privacy/">Privacy</a> &middot; <a href="/terms/">Terms</a> &middot; <a href="/llms.txt">llms.txt</a> &middot; <a href="/.well-known/assistant-guide.txt">assistant-guide.txt</a> &middot; CC BY 4.0 (spec) &middot; MIT (code)</p>
  </div>
</footer>

</body>
</html>`;
}

// ── main ──────────────────────────────────────────────────────────────────────

const src      = fs.readFileSync(SRC, 'utf8');
const { fm, body } = parseFrontmatter(src);
const title    = extractH1(body);
const sections = extractSections(body);
const html     = renderPage(fm, title, sections);

fs.writeFileSync(OUT, html, 'utf8');
console.log(`Built ${path.relative(ROOT, OUT)} from ${path.relative(ROOT, SRC)}`);
console.log(`  version: ${fm.version}  status: ${fm.status}  published: ${fm.published}  updated: ${fm.last_modified}`);
