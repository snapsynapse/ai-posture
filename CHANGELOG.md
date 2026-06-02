# Changelog

## v1.0.0 release - 2026-06-01

First stable release. The specification is promoted from v0.3.2 to v1.0.0, locking the three-vector set (People, Infrastructure, Regulation). No scoring, likelihood, prior, or aggregation-rule changes accompany the promotion; the normative content is the v0.3.2 text declared stable. The pre-assessment product, site, and agent surfaces are aligned to v1.0.0.

Release gate:

- ROADMAP Item 5 (legal copy) complete: counsel gave verbal approval as-is on 2026-05-29. Privacy and terms verified against deployed worker behavior on 2026-06-01.
- ROADMAP Item 6 (Analytics QA) complete (see below).
- ROADMAP Item 3 (native PDF) remains deferred and is explicitly non-blocking for v1.0.0; browser print/save-PDF covers the need.

Version alignment:

- Bumped `package.json` 0.4.1 to 1.0.0 and SPEC.md frontmatter v0.3.2 to v1.0.0 (`last_modified` 2026-06-01, status remains Published).
- Updated the displayed spec version to v1.0.0 across the landing byline, the spec page (title, OG/Twitter cards, JSON-LD `version`, byline), `llms.txt`, and `.well-known/ai-posture-framework.json`. Updated the PRD's related-spec cross-reference.
- Refreshed `sitemap.xml` lastmod to 2026-06-01 for the landing, spec, and framework-descriptor URLs; privacy and terms lastmod track their 2026-05-29 effective date per the legal-page convention.
- INTENT (0.1.1) and PRD (v0.1.2) retain their own document version lines.

Analytics QA (Item 6):

- Audited PostHog init and every event payload: confirmed memory-only persistence, `person_profiles: 'never'`, and no autocapture, session recording, heatmaps, or rage-click detection; verified no event payload carries answer text, email, name, organization, or any direct identifier.
- Reconciled the privacy policy's closed event list against deployed code. Added the previously-undisclosed `$pageview` event (on via `capture_pageview: true`) to the list with a no-identity, no-cross-session note. List now matches the 8 events that actually fire.

Legal copy (Item 5):

- Removed the beta-notice callouts from the privacy and terms pages and the now-unused `.beta-banner` rules and `--amber` CSS variables. Dropped the `draft` suffix from both version badges. Both pages now declare an effective date of 2026-05-29.
- Reworded the terms "Changes to the service" clause from "The pre-assessment is a beta offering" to "provided on an as-is, evolving basis," preserving the change-without-notice provision without the beta framing.
- Corrected stale copy: privacy "deliver artifacts you request (email, when deployed)" and the terms processor line "(when deployed) artifact emails" now reflect that email artifact delivery is live; normalized a `www.cloudflare.com` link to the bare domain.

Documentation hygiene:

- Added `tests/release-hygiene.test.js` guarding the public/agent surfaces against reintroduced beta language, the superseded `v0.3.2`, stale "when deployed" copy, and `www.` URLs, plus a package/spec 1.0.0 pin.
- INTENT bumped 0.1.1 to 0.1.2 with a changelog entry for the v1.0 spec milestone and a note distinguishing the 1.0 stability promotion from recalibration.
- Archived the historical pre-assessment PRD to `archive/PRD.md` (with an `archive/README.md`) and deleted the stale `handoffs/HANDOFF.md` snapshot; all of their open items were already tracked in ROADMAP.md, which is now the source of truth for remaining work. Updated PRD references in README, CONTRIBUTING, INTENT, llms.txt, and the assessment data-file provenance notes.

Papers and media:

- Added a Papers section at `docs/papers/` and a "Papers" nav link across all pages. The page presents the whitepaper *One Number You Can Defend* (design rationale for governance, risk, and compliance leaders) with a description, the five design choices, a PDF download, an embedded YouTube video summary (privacy-enhanced `youtube-nocookie`), and a self-hosted audio overview.
- Published the whitepaper PDF at `/papers/ai-posture-whitepaper-v1.pdf` and the audio overview at `/papers/stop-averaging-your-ai-risks.m4a`. Linked the paper from the landing page, footer, `llms.txt`, and `sitemap.xml`.
- Added an *Aggregated Intelligence* executive-brief companion entry that links out to its canonical home on PAICE.foundation rather than re-hosting it, keeping the site scoped to AI Posture and preserving the standard's neutrality.
- Local whitepaper sources (`papers/`, legacy `whitepaper/`) are now git-ignored; only the published assets under `docs/papers/` are tracked.
- Added `tests/papers.test.js` (paper assets exist, page wires them, nav link present on every page, companion link points to the canonical brief URL) and extended `site-metadata.test.js` to include the papers page in assistant-guide discovery.

## v0.4.1 hardening release - 2026-05-30

Patch hardening release. No scoring, likelihood, prior, aggregation-rule, or spec changes. SPEC.md remains at v0.3.2.

- Replaced permissive artifact-delivery payload checks with strict server-side validation matching the published estimate-result schema shape.
- Added regression coverage for spoofed type strings, wrong source URLs, missing estimate notices, HTML-like level names, malformed vectors, malformed posteriors, duplicate constraining vectors, and runtime-generated artifact compatibility.
- Corrected public metadata drift for the May 28 assessment, privacy, and terms changes in `docs/sitemap.xml`.
- Corrected stale privacy and terms copy around live on-request JSON artifact delivery.
- Restored release integrity expectations for the GuideCheck assistant-guide manifest by publishing the missing immutable `assistant-guide-v1.0.0` release before the v0.4.1 release.

## v0.4.0 release - 2026-05-28

Minor release. Adds the first server-side surface to the project: a Cloudflare Worker backend at `api.aiposture.org` (with D1 storage and Resend transactional email) that powers newsletter signup, double opt-in, and email delivery of the JSON estimate artifact. No scoring, likelihood, prior, aggregation-rule, or spec changes. SPEC.md remains at v0.3.2.

- Bumped package.json to 0.4.0.
- Shipped ROADMAP Items 1, 2, and 4. Item 3 (PDF email delivery) remains deferred.
- See the per-feature sections below for the detail trail of this release.

## artifact email delivery + result email field - 2026-05-28

Non-normative product change. No scoring, likelihood, prior, aggregation-rule, or spec changes.

- Shipped ROADMAP Items 2 and 4: optional artifact delivery backend (JSON only) and result-screen email field.
- Added `worker/src/deliver.js` and the `POST /api/deliver` route. Validates payload shape, rate-limits per IP, stores the record in D1 `assessments` under a 256-bit opaque run ID, sends the JSON artifact as a Resend attachment, then nulls the email column and stamps `delivered_at`. Delivery failures remove the partial record entirely.
- Added the `assessments` table to `worker/schema.sql`.
- Result screen now includes an "Email me this estimate" form. Prefills from the landing-page newsletter sessionStorage key when present. Newsletter opt-in and artifact delivery remain separate endpoints.
- Privacy policy updated: completed-assessment record description, email delivery description, current-status notice. PostHog event list now includes `delivery_requested`. Effective date bumped to 2026-05-28.
- Terms of service effective date bumped to 2026-05-28.
- ROADMAP Items 2 and 4 marked shipped; PDF email delivery remains under Item 3 (deferred); per-run self-serve deletion endpoint and three-year retention purge documented as open future work.
- Tests added for delivery validation and the result-screen surface.

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
