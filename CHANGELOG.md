# Changelog

## newsletter capture - 2026-05-27

Non-normative product change. No scoring, likelihood, prior, aggregation-rule, or spec changes.

- Shipped the landing-page newsletter capture (ROADMAP Item 1). Double opt-in, no cookies.
- Added `worker/` Cloudflare Worker backend with two endpoints: `POST /api/newsletter` and `GET /api/newsletter/confirm`. Hosted at `api.aiposture.org`.
- Added Cloudflare D1 database `ai_posture` with a `newsletter` table.
- Resend (`noreply@aiposture.org`) sends confirmation emails. DKIM, SPF, and DMARC configured on the new Cloudflare-hosted DNS zone for aiposture.org.
- Moved aiposture.org authoritative DNS from Namecheap to Cloudflare to support Workers routing on the same domain.
- Privacy policy: replaced the Substack-only newsletter section with an AI Posture subscription disclosure (Resend as processor, deletion via privacy@paice.work, double opt-in). Effective date bumped to 2026-05-27.
- Terms of service: added §11 third-party processors paragraph (Cloudflare and Resend) and a new §12 covering the AI Posture newsletter. Renumbered subsequent sections. Effective date bumped to 2026-05-27.
- ROADMAP Item 1 marked shipped; Items 2 and 4 unchanged.

## wire-format decision - 2026-05-27

Non-normative decision log. No scoring, likelihood, prior, aggregation-rule, or spec changes.

- Decided W3C EARL 1.0 as the primary wire format for verified per-vector assessments produced by reference implementations. OSCAL Assessment Results 1.1.2 is retained as a deferred projection target, not a primary format.
- Added `docs/research/wire-format-earl.md` documenting the decision, alternatives considered, adoption considerations, open questions, and revision triggers.
- Added ROADMAP items 12 (EARL profile authoring for v1.1), 13 (OSCAL projection, deferred with explicit re-open triggers), and 14 (AI-regulator format alignment watch).
- Renumbered prior ROADMAP items: Recalibration gates 12 to 15 and 13 to 16; V2 backlog 14 to 17, 15 to 18, 16 to 19, 17 to 20, and 18 to 21.
- Linked the new research note from `README.md` and `docs/research/README.md`.
- Added `handoffs/` to `.gitignore` so future session handoff folders stay local.
- Pre-assessment estimate output is unchanged. The EARL profile concerns verified assessments only.

## v0.3.2 spec + agent surfaces - 2026-05-27

Patch release. Non-normative support material, contribution surfaces, and machine-readable artifacts for framework positioning and validation. No scoring, likelihood, prior, or aggregation-rule changes.

- Bumped SPEC.md to v0.3.2, PRD.md to v0.1.2, and package.json to 0.3.2.
- Added `docs/research/README.md` as the research notes index.
- Added `docs/research/design-basis-open-questions.md` to document design assumptions, open questions, and revision triggers.
- Added `docs/research/validation-backlog.md` to turn framework assumptions into testable validation questions.
- Added `docs/research/weakest-link-stress-tests.md` to pressure-test minimum-vector aggregation and shared level semantics.
- Added `docs/research/adjacent-framework-crosswalk.md` to clarify how AI Posture relates to governance, risk, compliance, maturity, and behavior-change models.
- Added `docs/.well-known/ai-posture-framework.json` as a machine-readable framework profile.
- Added `docs/assess/schema/estimate-result.schema.json` for downloadable estimate artifacts.
- Extended downloadable estimate artifacts with scope and per-vector evidence checklist fields.
- Added `CONTRIBUTING.md` and issue templates for spec changes, vector proposals, validation findings, and terminology feedback.
- Added framework profile and estimate schema discovery from `docs/llms.txt` and `docs/sitemap.xml`.
- Linked the research notes from `README.md` and marked the related ROADMAP items complete.
- Added `HANDOFF.md` to `.gitignore` and removed it from the tracked index so future handoff notes remain local.

## GuideCheck adoption - 2026-05-25

Assistant-facing instruction surface update. No scoring, likelihood, prior, or aggregation-rule changes.

- Added a GuideCheck Human-Verifiable Assistant Guide artifact at `docs/.well-known/assistant-guide.txt`.
- Added a Level 4 sidecar manifest at `docs/.well-known/assistant-guide-manifest.json`.
- Added a repository hash anchor at `assistant-guide.sha256`.
- Added a byte-identical repository-root mirror at `assistant-guide.txt` for source review.
- Added assistant-guide discovery from all public HTML page heads, footers, `docs/llms.txt`, and `docs/sitemap.xml`.
- Corrected stale `docs/llms.txt` spec version and Level 0 terminology.
- Documented the adoption in `README.md`, `HANDOFF.md`, and standards-level `INTENT.md`.
- Added metadata evals for assistant-guide discovery, manifest integrity, byte-profile limits, and `llms.txt` terminology drift.

## v0.3.1 spec + roadmap + result artifacts - 2026-05-14

Patch release. No scoring, likelihood, prior, or aggregation-rule changes.

- Added `ROADMAP.md` with remaining v1 work, operational follow-up, recalibration gates, and v2 backlog.
- Added roadmap items for design-basis documentation, public validation backlog, weakest-link stress tests, and adjacent-framework crosswalk.
- Added result-page verification handoff links and local artifacts: copyable summary, downloadable JSON estimate, and browser print/save-PDF path.
- Added metadata evals to prevent homepage/spec version drift and verify the homepage repo-updated date wiring.
- Updated homepage version and metadata from v0.2.0/v0.3.0 drift to v0.3.1.
- Fixed reporting-format scorecard alignment in the homepage and generated spec page.
- Updated `HANDOFF.md` to reflect live OG image, local artifact path, and result-page analytics events.

## result artifacts + handoff links - 2026-05-14

Pre-assessment result-page progress against the v1 roadmap.

- Added verification handoff links for People, Infrastructure, Regulation, and generic assessor fallback.
- Added local result artifacts: copyable plain-text summary, downloadable JSON estimate, and browser print/save-PDF path.
- Added `handoff_clicked` tracking on result handoff links and `pdf_requested` tracking on print/save-PDF action.
- Added print CSS for result output.
- Added regression coverage for handoff rendering and JSON artifact structure.
- Updated `HANDOFF.md` so the roadmap reflects the live OG image and local artifact path.

## site + tooling — 2026-04-20

Spec page, AIP→AI Posture terminology, and build pipeline.

- Added `docs/spec/` — canonical HTML rendering of the specification, linked from nav and all homepage buttons
- Replaced "AIP" abbreviation with "AI Posture" across all human/agent-facing content (SPEC.md, HTML pages, JSON data, PRD.md, CHANGELOG.md)
- Added YAML frontmatter to SPEC.md (`version`, `status`, `published`, `last_modified`, `license`)
- Added `scripts/build-spec.js` — zero-dependency Node.js script that generates `docs/spec/index.html` from SPEC.md; handles frontmatter, principles lists, tables, maturity-level ordered lists, code fences, inline links
- Added `package.json` with `npm run build` wired to the script
- Aligned homepage vector descriptions, constraint rule examples, and reporting format code block with spec
- Added Level 0 (N/A) row to homepage maturity table
- Consolidated footer to single line across all pages

## v0.3.0 spec + PRD v0.1.1 — 2026-04-20

Level-name terminology update. Cosmetic-semantic change, no calibration or methodology impact.

SPEC.md v0.3.0
- Levels 4 and 5 renamed from past-participle to present-participle form: "Calibrated" → "Calibrating", "Engineered" → "Engineering".
- Rationale: present-participle form is more honest to the spec's decay principle. Levels are sustained practices requiring continuous maintenance, not terminal achievements. Past-participle implied done; present-participle correctly conveys ongoing practice.
- All five levels (Perceiving, Assessing, Integrating, Calibrating, Engineering) now share present-participle form, resolving a grammatical inconsistency between Levels 1-3 and Levels 4-5.
- Posture-statement adjective uses of "engineered capability" preserved where the word describes an artifact rather than a level.

PRD.md v0.1.1
- Level name updates throughout likelihood tables (Appendix A), rubric tables (Appendix B), question bank references, and output contract.
- Related-spec reference bumped to SPEC.md v0.3.0.

Pre-assessment runtime (docs/assess/)
- LEVEL_NAMES array in app.js updated.
- likelihoods.json levels array updated.
- rubric.json per-vector level names updated.
- Minor UI string updates where level names appeared in prose.

No changes to probability values, prior distributions, constraint rule, or admission criteria.

## v0.2.0 spec + PRD v0.1.0 — 2026-04-20

Spec revision and pre-assessment product definition.

SPEC.md v0.2.0
- Opened with first-principles framing. Product references moved below the fold.
- Vector set declared open with admission criteria. v1.0 ships three vectors (People, Infrastructure, Regulation). Market/Exposure collapsed into Infrastructure as its outer boundary.
- Level 0 redefined as N/A (scope boundary), not Ignoring. Falsified N/A invalidates the whole AI Posture assertion.
- Coverage-ratio scoring clarified (obligations met relative to obligations in scope, not volume of work).
- Decay and freshness model added. Scores are time-stamped assertions with assessor-declared next-review dates. Duration at level is a trust signal, not a gate.
- Level 5 retains independent reachability per vector. Requires declared framework-review cadence with recent artifact. Calendar-anchored "last 12 months" gate removed.
- Orthogonality statement added vs NIST AI RMF, ISO/IEC 42001, EU AI Act conformance programs.
- Misrepresentation treated as in-vector immaturity signal, not a separate measurement.
- Governance section added. PAICE.work PBC steward. PAICE.foundation transition planned.
- Reporting format adds per-vector at-this-level-since date.

PRD.md v0.1.0
- Pre-assessment product definition for https://aiposture.org/assess/
- Bayesian adaptive question flow. Three openers plus up to five questions per in-scope vector.
- Full question bank inlined (18 questions) with likelihood tables (Appendix A) and rubric tables (Appendix B).
- Runtime order: Infrastructure, Regulation, People. People asked last.
- Stopping rule: posterior on one level exceeds 0.70, bank exhausted, or L0-skip rule.
- Output contract: inline result plus email-gated PDF and JSON. Shareable URL deferred to v2.
- No cookies. sessionStorage only. PostHog cookie-less analytics.
- Random-ID record retention (3 years). Email dissociated after delivery.

## v0.1.0 — 2026-04-19

Initial public release.

- Canonical spec at [SPEC.md](SPEC.md) defining the Aggregated Intelligence Posture framework
- Landing site at https://aiposture.org/ with inline three-vector level picker
- Fifteen-question self-assessment at https://aiposture.org/assess/
