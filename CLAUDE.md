# CLAUDE.md — ai-posture

Agent guidance for working in this repository. Read this before making changes.

## Purpose

AI Posture is an open governance framework/specification (the "Aggregated Intelligence
Posture" model) plus its reference implementation: a static marketing/spec site, a
client-side Bayesian pre-assessment tool, and a small Cloudflare Worker backend. It
produces one governance score for human-AI collaboration across three vectors —
People, Infrastructure, Regulation — bounded by the weakest ("minimum-vector" rule).

Canonical site: https://aiposture.org/
Repo: https://github.com/snapsynapse/ai-posture (steward: PAICE.work PBC)

## Status (as of 2026-07-12)

- Spec is stable at v1.1.0 (three-vector set locked, declaration format published).
- Working tree is clean; `main` is up to date with `origin/main`.
- Last commit: "Harden declaration validation surfaces" (2026-06-11).
- Active/maintained, not stale — commits through mid-June 2026, docs current.

## Tech stack

- No framework. Static HTML/CSS/JS site under `docs/` (GitHub Pages root), plain
  Node.js build scripts (no bundler, no npm dependencies at repo root).
- `worker/` — a separate Cloudflare Worker (Wrangler, `type: module`) for newsletter
  signup (Resend, double opt-in) and assessment-artifact delivery, backed by D1.
- Tests: Node's built-in `node --test` (no Jest/Mocha).
- CI: GitHub Actions deploys `docs/` to GitHub Pages on push to `main`
  (`.github/workflows/pages.yml`). There is no CI job that runs `npm test` —
  test execution is manual/local only.

## Directory layout

- `SPEC.md` — normative specification (YAML frontmatter + Markdown body). Source of truth.
- `INTENT.md` — standards-level strategy: stewardship principles, vector admission
  criteria, recalibration gates, contribution norms.
- `archive/PRD.md` — archived pre-assessment PRD (question bank, likelihood tables,
  rubric tables, runtime flow); historical, superseded at v1.0.0.
- `CONTRIBUTING.md` — contribution boundaries and verification guidance.
- `CHANGELOG.md` — spec and PRD change log.
- `scripts/build-spec.js` — generates `docs/spec/index.html` from `SPEC.md`.
- `scripts/build-criteria.js` — generates criteria-related site artifacts.
- `scripts/validate.js` — validates a declaration or EARL report against schema.
- `docs/` — canonical site source (GitHub Pages root: html, spec, assess, check,
  crosswalk, schema, papers, privacy, research, terms, sitemap, robots, llms.txt).
- `docs/spec/` — generated from `SPEC.md`; do not hand-edit, regenerate with `npm run build`.
- `docs/assess/` — client-side Bayesian adaptive self-assessment (pre-assessment tool).
- `docs/research/` — non-normative design basis, validation backlog, stress tests,
  adjacent-framework crosswalk.
- `tests/` — regression, engine, and data-contract tests for the assessment flow,
  declaration/EARL schemas, and site metadata.
- `worker/` — Cloudflare Worker backend (`src/`, `schema.sql`, `wrangler.toml`),
  its own `package.json` and `tests/`.
- `.claude/skills/canonical-spec-page/PROJECT_CONTEXT.md` — skill-scoped config for
  the `canonical-spec-page` skill; distinct from the repo-root `PROJECT_CONTEXT.md`.

## Conventions

- Spec changes: edit `SPEC.md` (bump `version`/`status`/`last_modified` in frontmatter),
  regenerate with `npm run build`, commit `SPEC.md` and `docs/spec/index.html` together,
  and update `CHANGELOG.md` for public standards language, scoring, metadata, or
  artifact-shape changes.
- Do not imply certification, legal advice, audit output, or a compliance guarantee.
- Do not make reference implementations mandatory in spec language.
- Do not replace minimum-vector aggregation with averaging without a spec issue and
  version decision.
- Do not add analytics, retained records, email delivery, or new data collection
  without matching privacy/terms updates.
- New vectors are admitted only against the published admission criteria in
  `INTENT.md` / `SPEC.md` (externally observable artifact, distinct actor-class,
  independent variation, independent constraint under weakest-link).
- Analytics: PostHog in cookie-less mode only — no autocapture, no session
  recording, no cross-session stitching; event payloads carry question IDs and
  aggregate outcomes, never answer content.

## Build / test (from docs — do not execute without explicit instruction)

Repo root:
```
npm run build   # node scripts/build-spec.js && node scripts/build-criteria.js
npm test        # node --test
node scripts/validate.js declaration path/to/ai-posture.json
node scripts/validate.js earl path/to/report.jsonld
```

Worker (`worker/`):
```
npm install
cp .dev.vars.example .dev.vars   # fill in RESEND_API_KEY
npm run db:apply:local           # creates local D1
npm run dev                      # wrangler dev on localhost:8787
npm test                         # node --test
```

## Outstanding / known gaps

- Worker: unsubscribe path is marked TBD (Resend-managed list link) in `worker/README.md`.
- No CI gate runs the test suite (`npm test`) automatically — only GitHub Pages deploy
  is automated. Consider this when validating changes.
- Recalibration of pre-assessment likelihood tables is scheduled for "first 100
  completions" and annually thereafter (see `INTENT.md`); not yet triggered as of
  the last recorded review.
- Governance transition to an independent steward (PAICE Foundation) is planned but
  not yet timed.
