const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SPEC = fs.readFileSync(path.join(ROOT, 'SPEC.md'), 'utf8');
const HOME = fs.readFileSync(path.join(ROOT, 'docs/index.html'), 'utf8');
const SPEC_PAGE = fs.readFileSync(path.join(ROOT, 'docs/spec/index.html'), 'utf8');
const PAPERS = fs.readFileSync(path.join(ROOT, 'docs/papers/index.html'), 'utf8');
const ASSESS = fs.readFileSync(path.join(ROOT, 'docs/assess/index.html'), 'utf8');
const PRIVACY = fs.readFileSync(path.join(ROOT, 'docs/privacy/index.html'), 'utf8');
const TERMS = fs.readFileSync(path.join(ROOT, 'docs/terms/index.html'), 'utf8');
const NOT_FOUND = fs.readFileSync(path.join(ROOT, 'docs/404.html'), 'utf8');
const LLMS = fs.readFileSync(path.join(ROOT, 'docs/llms.txt'), 'utf8');
const SITEMAP = fs.readFileSync(path.join(ROOT, 'docs/sitemap.xml'), 'utf8');
const FRAMEWORK_PROFILE = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/.well-known/ai-posture-framework.json'), 'utf8'));
const ESTIMATE_SCHEMA = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/assess/schema/estimate-result.schema.json'), 'utf8'));
const CONTRIBUTING = fs.readFileSync(path.join(ROOT, 'CONTRIBUTING.md'), 'utf8');

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

function sitemapLastmod(url) {
  const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = SITEMAP.match(new RegExp(`<loc>${escaped}<\\/loc>\\s*<lastmod>(\\d{4}-\\d{2}-\\d{2})<\\/lastmod>`));
  assert.ok(match, `sitemap must include ${url}`);
  return match[1];
}

function effectiveDate(html) {
  const match = html.match(/Effective <time datetime="(\d{4}-\d{2}-\d{2})">/);
  assert.ok(match, 'page must include an effective date');
  return match[1];
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

test('sitemap lastmod tracks changed public assessment and legal surfaces', () => {
  assert.equal(sitemapLastmod('https://aiposture.org/assess/'), '2026-06-01');
  assert.equal(sitemapLastmod('https://aiposture.org/privacy/'), effectiveDate(PRIVACY));
  assert.equal(sitemapLastmod('https://aiposture.org/terms/'), effectiveDate(TERMS));
});

test('public metadata discovers the assistant guide', () => {
  const assistantGuideLink = '<link rel="assistant-guide" href="https://aiposture.org/.well-known/assistant-guide.txt">';

  for (const html of [HOME, SPEC_PAGE, PAPERS, ASSESS, PRIVACY, TERMS, NOT_FOUND]) {
    assert.equal(html.includes(assistantGuideLink), true);
  }

  assert.equal(LLMS.includes('https://aiposture.org/.well-known/assistant-guide.txt'), true);
  assert.equal(LLMS.includes('https://aiposture.org/.well-known/assistant-guide-manifest.json'), true);
  assert.equal(SITEMAP.includes('https://aiposture.org/.well-known/assistant-guide.txt'), true);
  assert.equal(SITEMAP.includes('https://aiposture.org/.well-known/assistant-guide-manifest.json'), true);
});

test('public metadata discovers machine-readable framework surfaces', () => {
  const frameworkUrl = 'https://aiposture.org/.well-known/ai-posture-framework.json';
  const schemaUrl = 'https://aiposture.org/assess/schema/estimate-result.schema.json';
  const declarationSchemaUrl = 'https://aiposture.org/schema/declaration/v1/ai-posture-declaration.schema.json';

  assert.equal(LLMS.includes(frameworkUrl), true);
  assert.equal(LLMS.includes(schemaUrl), true);
  assert.equal(LLMS.includes(declarationSchemaUrl), true);
  assert.equal(SITEMAP.includes(frameworkUrl), true);
  assert.equal(SITEMAP.includes(schemaUrl), true);
  assert.equal(FRAMEWORK_PROFILE.agent_resources.estimate_result_schema, schemaUrl);
  assert.equal(FRAMEWORK_PROFILE.agent_resources.declaration_schema, declarationSchemaUrl);
  assert.equal(ESTIMATE_SCHEMA.$id, schemaUrl);
});

test('framework profile follows current spec terminology and version', () => {
  const fm = frontmatter(SPEC);

  assert.equal(FRAMEWORK_PROFILE.spec.version, fm.version);
  assert.equal(FRAMEWORK_PROFILE.spec.status, fm.status);
  assert.equal(FRAMEWORK_PROFILE.canonical_url, 'https://aiposture.org/');
  assert.equal(FRAMEWORK_PROFILE.constraint_rule.aggregation, 'minimum');
  assert.deepEqual(
    FRAMEWORK_PROFILE.vectors.map(vector => vector.name),
    ['People', 'Infrastructure', 'Regulation']
  );
  assert.deepEqual(
    FRAMEWORK_PROFILE.levels.map(level => level.name),
    ['N/A', 'Perceiving', 'Assessing', 'Integrating', 'Calibrating', 'Engineering']
  );
});

test('framework profile marks verified declaration basis as reserved', () => {
  assert.deepEqual(
    FRAMEWORK_PROFILE.declaration.assertion_basis_values,
    ['self-estimate', 'self-assertion', 'verified']
  );
  assert.deepEqual(
    FRAMEWORK_PROFILE.declaration.currently_accepted_assertion_basis_values,
    ['self-estimate', 'self-assertion']
  );
  assert.deepEqual(FRAMEWORK_PROFILE.declaration.reserved_assertion_basis_values, ['verified']);
  assert.match(FRAMEWORK_PROFILE.declaration.reserved_notice, /MUST NOT be used/);
  assert.match(LLMS, /`verified` is reserved and invalid/);
});

test('estimate result schema matches runtime artifact contract', () => {
  assert.equal(ESTIMATE_SCHEMA.properties.type.const, 'AI Posture Pre-Assessment Result');
  assert.equal(ESTIMATE_SCHEMA.properties.source.const, 'https://aiposture.org/assess/');
  assert.equal(ESTIMATE_SCHEMA.properties.estimate_label.const, 'estimated AI Posture');
  assert.equal(ESTIMATE_SCHEMA.properties.notice.const, 'This is an estimate, not a verified assertion.');
  assert.equal(ESTIMATE_SCHEMA.required.includes('scope'), true);
  assert.equal(ESTIMATE_SCHEMA.required.includes('vectors'), true);
  assert.equal(
    ESTIMATE_SCHEMA.$defs.vector_result.required.includes('evidence_checklist'),
    true
  );
});

test('contribution intake surfaces exist for framework feedback', () => {
  const templates = [
    '.github/ISSUE_TEMPLATE/spec-change.md',
    '.github/ISSUE_TEMPLATE/vector-proposal.md',
    '.github/ISSUE_TEMPLATE/validation-finding.md',
    '.github/ISSUE_TEMPLATE/copy-terminology.md'
  ];

  assert.equal(CONTRIBUTING.includes('Vector proposals must satisfy the published admission criteria'), true);

  for (const template of templates) {
    assert.equal(fs.existsSync(path.join(ROOT, template)), true, `${template} must exist`);
  }
});

test('llms summary does not drift from current spec terminology', () => {
  const fm = frontmatter(SPEC);

  assert.equal(LLMS.includes(`Normative specification (${fm.version})`), true);
  assert.equal(LLMS.includes('Level 0 (Ignoring)'), false);
  assert.equal(LLMS.includes('Level 0 is a falsifiable scope boundary'), true);
  assert.equal(LLMS.includes('Positioning and validation'), true);
  assert.equal(LLMS.includes('docs/research/README.md'), true);
});
