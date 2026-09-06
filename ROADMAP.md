# AI Posture Roadmap

Current roadmap for remaining pre-assessment work, and the source of truth for what remains as of 2026-06-01. The original product requirements are archived at [archive/PRD.md](archive/PRD.md); the framework specification is [SPEC.md](SPEC.md).

## Current state

The static site, canonical spec page, Bayesian adaptive pre-assessment, privacy page, terms page, OG image, result evidence checklist, verification handoff links, local JSON artifact, copyable summary, and browser print/save-PDF path are live. The optional delivered-artifact flow is also live: landing-page newsletter capture with double opt-in, on-request JSON artifact delivery by email, and the result-screen email field, all backed by the Cloudflare Worker at `api.aiposture.org`. Analytics QA is complete and the legal pages match deployed behavior.

The v1.0.0 release shipped 2026-06-01: the spec is promoted to v1.0.0 (three-vector set locked) and the pre-assessment product, site, and agent surfaces all carry v1.0.0. The remaining roadmap is a native PDF decision (Item 3, deferred and non-blocking) and post-launch calibration work once real usage exists.

## V1 remaining

### 1. Newsletter capture on landing page

Status: shipped 2026-05-27.

PRD reference: landing page optional newsletter email capture. Implementation diverged from the original Substack handoff in favor of a self-hosted Resend-backed double opt-in flow, so subscriber list lives in our infrastructure and can be reused for AI Posture-specific updates separately from the PAICE Substack.

Delivered:

- Email capture form on the landing page with client-side validation and sessionStorage prefill.
- Cloudflare Worker backend at `api.aiposture.org` (source under `worker/`) handling subscribe and confirm endpoints.
- Cloudflare D1 stores subscriber rows with status (`pending` / `confirmed`).
- Resend delivers the confirmation email from `noreply@aiposture.org`; double opt-in enforced server-side.
- Result-page artifact email field can prefill from the landing-page sessionStorage value once that field exists (Item 4).
- PostHog `email_captured` event fires after successful submit; the address itself is never sent to PostHog.
- Privacy policy and terms updated to disclose Resend as a processor and Cloudflare D1 as the subscription store, with deletion path via privacy@paice.work.

Acceptance criteria met:

- No cookies.
- Email is stored only in our subscription table; the assessment record model (Item 2) remains unaffected.
- Invalid email is rejected client-side before submit; server re-validates.
- PostHog event records only that capture happened.

### 2. Optional artifact delivery backend

Status: shipped 2026-05-28 (JSON only; PDF email delivery deferred to Item 3).

PRD reference: optional email-delivered PDF and JSON artifact, email dissociated after delivery, per-run record stored under a random opaque ID.

Delivered:

- `POST /api/deliver` on the Cloudflare Worker accepts `{ email, payload }`, validates the payload shape, rate-limits per IP, generates a 256-bit opaque run ID, stores the record in D1 `assessments`, and sends the JSON artifact as a Resend email attachment.
- Email address is stored on the record only during the send; after a successful send the column is nulled out and `delivered_at` is set. The stored record then carries no direct identifier.
- Delivery failures remove the partial record entirely (no orphan PII).
- Result screen success/failure states wired through the email field UI.
- PostHog `delivery_requested` event records that a delivery happened, never the address or artifact.
- Deletion is request-based via privacy@paice.work using the run ID (included in the delivery email). A self-serve deletion endpoint is on the future backlog but not blocking.
- Retention enforcement (three-year purge) is manual until the volume warrants a Worker Cron Trigger; documented gap.

Acceptance criteria met:

- Email is not retained after successful delivery.
- Assessment record contains created_at, payload (aggregate, per-vector levels and posteriors, scope label, generated_at), and delivered_at.
- Assessment record does not contain name, organization, IP address, or direct identifier; email column nulled after delivery.
- Retention policy documented in privacy as three years (enforcement TBD, see above).
- Delivery failure removes the record &mdash; no orphan record retained.
- Privacy and terms pages reflect deployed behavior.

### 3. Native PDF generation

Status: partially covered by browser print/save-PDF. Native client-side PDF remains deferred.

PRD reference: email-delivered PDF artifact. Handoff note: jsPDF was planned for v1 but not wired.

Work remaining:

- Decide whether browser print/save-PDF is sufficient for v1.
- If not sufficient, add client-side PDF generation or backend PDF rendering.
- Ensure PDF includes aggregate estimate, vector levels, posterior disclosure, constraining vector, recommended next action, evidence checklist, source URL, and estimate-not-verified notice.
- Keep PDF generation compatible with no-cookie and no-auth constraints.

Acceptance criteria:

- PDF output is board-shareable and readable on mobile and desktop.
- Result remains labeled as estimated, not verified.
- No answer content is sent to third parties solely for PDF rendering unless disclosed and intentionally accepted.

### 4. Result email field

Status: shipped 2026-05-28.

PRD reference: final screen includes email field with prefill from front-page capture if provided.

Delivered:

- Email field added to the result screen below the artifact-actions row.
- Prefills from the landing-page `sessionStorage` key (`aiposture.newsletter.email`) when present.
- Newsletter opt-in (landing) and artifact delivery (result) are functionally separate endpoints: subscribing to the newsletter never triggers an artifact send, and requesting an artifact never adds to the newsletter list.
- Client-side validation rejects malformed addresses before submit; server re-validates.
- Single confirmation message replaces the form on success (input + button disabled, success status text shown).

Acceptance criteria met:

- No account, no dashboard.
- No double opt-in for artifact delivery (single-shot send).
- Newsletter subscription remains a separate flow with its own double opt-in and is now self-hosted on Resend (see Item 1) rather than Substack.

### 5. Legal copy finalization

Status: complete. Counsel gave verbal approval as-is on 2026-05-29; pages verified against deployed behavior 2026-06-01. More detailed revisions may follow but none are blocking.

PRD reference: terms and privacy cover estimate status, no warranties, rights in user answers, sessionStorage, analytics, random-ID retention, email delivery, deletion, newsletter flow, aggregate use disclosure, no data sold.

Done:

- Beta-notice callouts removed from privacy and terms now that per-run storage and email delivery are live; version badges no longer carry a `draft` suffix; effective date set to 2026-05-29.
- Reconciled both pages against deployed behavior (2026-06-01). Verified the worker matches the privacy claims: opaque `run_id` record, email nulled and `delivered_at` stamped after a successful send, partial record deleted on delivery failure, three-year retention, deletion via privacy@paice.work with the run ID, newsletter double opt-in with pending/confirmed states and per-IP rate limiting. Analytics event list matches the deployed events (see Item 6).

Work remaining:

- None blocking. Future detailed revisions from counsel, if any, update the effective date and are tracked in commit history.

Acceptance criteria:

- Public legal pages exactly match deployed data behavior. (Met 2026-06-01, pending counsel review.)
- Repository commit history remains authoritative for changes.

## V1 operational follow-up

### 6. Analytics QA

Status: shipped 2026-06-01.

Live events: `$pageview`, `assessment_started`, `question_answered`, `assessment_completed`, `handoff_clicked`, `delivery_requested`, `pdf_requested`, and `email_captured`.

Delivered:

- `email_captured` fires on landing-page newsletter submit (no props; address never sent). Artifact delivery uses the separate `delivery_requested` event (no props; address never sent).
- PostHog confirmed memory-only: `persistence: 'memory'`, `person_profiles: 'never'`, `disable_session_recording: true`, `autocapture: false`, `capture_heatmaps: false`, `rageclick: false`.
- Audited every event payload: no answer text, email address, name, organization, or direct identifier. `question_answered` carries the question id only; `assessment_completed` carries derived per-vector levels and the aggregate, never raw answers; `handoff_clicked` carries the destination URL, not identity.
- Reconciled the privacy policy's closed event list against deployed code. `$pageview` (on via `capture_pageview: true`) was undisclosed; added it to the privacy event list with a no-identity, no-cross-session note.

Acceptance criteria met:

- Analytics payloads match the privacy policy event list exactly (8 events).
- Completion, abandonment, handoff, and artifact-request metrics are derivable from `assessment_started` vs `assessment_completed`, `handoff_clicked`, and `delivery_requested` without session stitching.

### 7. Design basis and open questions note

Status: complete.

Intent fit: strong. The INTENT document frames AI Posture as a working hypothesis under Measurement Authority and Calibration Compounding. A thin rationale layer makes those bets inspectable without making the core spec academic.

Spec fit: strong if kept separate from SPEC.md. SPEC.md already contains the first principles. This note should explain the design assumptions behind those principles, not restate or expand the normative requirements.

PRD fit: indirect. The PRD is about the pre-assessment product. This artifact supports credibility, reviewer alignment, and future calibration, but it should not block the remaining v1 runtime work.

Artifact: [docs/research/design-basis-open-questions.md](docs/research/design-basis-open-questions.md)

Completed:

- Created a non-normative design-basis note under `docs/research/`.
- Covered observable artifacts, minimum-vector aggregation, time-stamped assertions, provisional assumptions, and revision triggers.
- Linked it from README.md and ROADMAP.md, not from the first screen of the product.
- Avoided citation placeholders and named-reader framing.

Acceptance criteria:

- Practitioner-first language.
- No literature-review tone.
- No changes to the normative spec.
- Open assumptions are phrased as testable bets, not doctrine.

### 8. Public validation backlog

Status: complete.

Intent fit: strong. This directly supports recalibration gates and contribution norms.

Spec fit: strong. It should test the assumptions already named in SPEC.md: cross-vector level semantics, weakest-link aggregation, external verifiability, maturity versus exposure, freshness, and vector sufficiency.

PRD fit: strong if sequenced before retained run records. The delivery backend and record model should preserve enough data to support later validation without violating the privacy model.

Artifact: [docs/research/validation-backlog.md](docs/research/validation-backlog.md)

Completed:

- Created a validation backlog under `docs/research/`.
- Grouped validation questions into construct validity, inter-rater reliability, cross-vector comparability, freshness semantics, weakest-link validity, stakeholder interpretability, and vector sufficiency.
- Named likely data sources, lightweight methods, and revision triggers.
- Documented data-model implications for retained records, verified follow-up matching, and qualitative reviewer feedback.

Acceptance criteria:

- Each backlog item has a decision trigger.
- Each data source respects the no-identifying-data posture unless a later explicit consent flow is added.
- Validation backlog informs the artifact delivery backend schema before storage ships.

### 9. Weakest-link and level-semantics stress tests

Status: complete.

Intent fit: strong. This pressure-tests the two design choices most likely to attract serious critique.

Spec fit: strong. The constraint rule and shared level semantics are normative in SPEC.md, but level-name validation is explicitly open.

PRD fit: moderate. Results may change explanatory copy, result guidance, or future question-bank design. They should not change scoring without a spec revision.

Artifact: [docs/research/weakest-link-stress-tests.md](docs/research/weakest-link-stress-tests.md)

Completed:

- Generated edge-case scenarios where minimum-vector aggregation may feel surprising.
- Classified scenarios as keep rule, improve guidance, or candidate spec revision.
- Reviewed level-name semantics across People, Infrastructure, and Regulation.
- Captured watchpoints for future copy changes, validation backlog items, or spec issues.

Acceptance criteria:

- No scoring rule changes without CHANGELOG.md entry and spec version decision.
- Guidance changes preserve the minimum-vector rule unless explicitly revised.
- Findings feed the v1.1 semantic validation work.

### 10. Adjacent-framework crosswalk

Status: complete.

Intent fit: moderate to strong. It supports contribution and reviewer conversations, but it is not required for the product to function.

Spec fit: strong if scoped carefully. SPEC.md already states orthogonality to NIST AI RMF, ISO/IEC 42001, EU AI Act conformance programs, and similar regimes.

PRD fit: low. This is ecosystem positioning, not pre-assessment runtime work.

Artifact: [docs/research/adjacent-framework-crosswalk.md](docs/research/adjacent-framework-crosswalk.md)

Completed:

- Created a concise crosswalk against governance management systems, risk frameworks, compliance and legal conformance programs, capability maturity models, and behavior-change/adoption models.
- Compared unit of analysis, evidence type, aggregation logic, treatment of time, treatment of human behavior, and usefulness for boards, regulators, partners, customers, practitioners, and agents.
- Kept named third-party comparisons out of public docs.

Acceptance criteria:

- The crosswalk clarifies orthogonality without claiming replacement.
- The document does not imply certification, audit, legal advice, or conformance.
- Public claims stay tied to inspectable behavior and artifact evidence.

### 10.5. Declaration format

Status: complete (v1.1.0, 2026-06-10).

Adds a normative machine-readable declaration artifact at `/.well-known/ai-posture.json`. Turns the estimate-result artifact into a publishable well-known declaration. Organizations self-assert their AI Posture at their own domain without a centralized registry.

Spec fit: strong. The new "Declaration format" section in SPEC.md is additive; no existing normative text changes.

Artifacts:

- SPEC.md: "Declaration format" section (normative).
- `docs/schema/declaration/v1/ai-posture-declaration.schema.json`: JSON Schema.
- `docs/.well-known/ai-posture-framework.json`: `declaration` block added.

Completed:

- Defined `/.well-known/ai-posture.json` as the normative well-known path.
- Specified required fields: `type`, `spec_version`, `generated_at`, `next_review`, `subject` (name + domain), `assertion_basis` (self-estimate / self-assertion / verified), `aggregate`, `constraining_vectors`, `vectors` (with `at_level_since`).
- Specified optional fields: `evidence` (per-vector URI arrays), per-vector `posterior`.
- `verified` reserved; no verification process in v1.1.
- Published JSON Schema at `https://aiposture.org/schema/declaration/v1/`.
- Stale-declaration semantics: past `next_review` = weaker signal, not invalid.

### 10.6. Provider-neutral criteria routing

Status: complete in v1.1.1 (2026-09-01).

Corrects implicit steward-product routing without changing the vector model or removing non-normative implementation examples from repository documentation.

Delivered:

- Assessment results route to published per-vector criterion and evidence pages instead of PAICE.work, Siteline, or EveryAILaw.
- Rubric data and the machine-readable framework profile no longer designate a provider per vector.
- README vectors lead with artifact classes and label the steward-produced products as non-normative examples.
- The homepage retains declaration freshness guidance but makes no promise about an unshipped maintenance protocol or commercial offering.
- The specification points to the criterion registry instead of a nonexistent implementations page.

Release gate:

- Full test suite and generated-output checks pass.
- The reviewed patch is committed, pushed, and verified on the deployed site under separately authorized release steps.

### 10.7. Declaration dogfood and decentralized adoption

Status: published in v1.1.2 at bce193e; both deployment workflows passed and 12 live site/agent files matched the release. See [release evidence](docs/research/releases/v1.1.2.json).

**Next action:** continue regulatory monitoring and review the declaration on December 5, 2026. Browser visual/accessibility verification remains an open follow-up. People 1, Infrastructure 3, Regulation 1 wording, and the 2026-12-05 review date are owner approved. The [review record](docs/research/self-declaration-readiness.md) preserves the approved acknowledgment and validation limits. Regulatory screening continues as an ongoing practice, not a one-time completed map.

Prepared locally:

- Owner-approved JSON at `docs/.well-known/ai-posture.json`, matching homepage, and linked evidence at `docs/declaration/`.
- Inventory, remediation history, route/source comparisons, and API liveness/preflight evidence. Production storage and email delivery were not exercised.
- Sitemap and llms.txt discovery links, successful build, 113 passing tests, declaration validation, human/machine parity, local link checks, and a mocked-response viewer check.
- Browser visual/accessibility checks remain pending a shared Comet tab. Automated source checks do not establish accessibility conformance.

Declaration wording and profile are owner approved. The owner authorized staging, commit, push, tag, and release for v1.1.2. CAISI outreach, Siteline implementation, named comparisons, portfolio-wide declarations, and maintenance protocols are deferred from this tranche.

The declaration format is shipped, but the framework steward has not yet published a real declaration at `https://aiposture.org/.well-known/ai-posture.json`. Adoption should begin with inspectable, decentralized declarations rather than a centralized registry.

Work remaining:

- Owner approval obtained for the declaration profile and regulatory acknowledgment.
- Publish the first self-reviewed declaration at the normative well-known path and validate it against the v1 schema and semantic checks.
- Open small, independently reviewable declaration tasks for suitable portfolio sites only after the steward declaration is live.
- File the cross-repository Siteline detection proposal as informational discovery: detect declarations, do not alter a site's score, and do not centralize assertion custody.
- Base any launch or distribution copy on current, verified adoption evidence. Do not reuse the unverified June 2026 novelty claim.

Acceptance criteria:

- The live declaration is owner-approved, valid, and time-bounded with `generated_at` and `next_review`.
- Adoption remains domain-owned and does not require registration with AI Posture or a steward-operated service.
- Public adoption claims name evidence that can be independently inspected.

### 10.8. Maintenance protocol re-open gate

Status: deferred.

The declaration format already provides freshness semantics through `generated_at` and `next_review`. A separate maintenance protocol or commercial maintenance offering is not promised in the current product surface.

Re-open triggers:

- At least three to five real manual declaration-maintenance cycles reveal a repeated workflow that the declaration format cannot express cleanly.
- An external implementer presents a concrete interoperability need that requires a protocol beyond the existing declaration and evidence fields.

Work when triggered:

- Document observed maintenance failures before proposing new normative requirements.
- Keep any protocol provider-neutral and separable from a steward-operated commercial service.
- Version normative changes through SPEC.md and CHANGELOG.md.

### 11. Copy and semantic validation

Status: open for v1.1.

PRD reference: level name semantic validation.

Work remaining:

- Watch completion patterns and qualitative feedback for confusion around Perceiving, Assessing, Integrating, Calibrating, Engineering.
- Record any proposed terminology changes in CHANGELOG.md.
- Treat level-name changes as semantic changes even if scoring is unchanged.

Acceptance criteria:

- Any terminology change preserves compatibility with SPEC.md.
- Any visible copy changes preserve estimate labeling and no-certification boundaries.

## Wire format and projections

### 12. EARL wire format for verified assessments

Status: shipped 2026-06-10 (v1.1.0).

PRD reference: out of PRD scope. The PRD covers the pre-assessment estimate. This item covers the wire format for verified per-vector assessments produced by reference implementations.

Design basis: [docs/research/wire-format-earl.md](docs/research/wire-format-earl.md)

Delivered:

- EARL profile published under `docs/schema/earl/v0/`: `context.jsonld` (binds EARL, Dublin Core, FOAF, and `apos:` terms), `shapes.ttl` (SHACL shapes including a SPARQL weakest-link constraint), `profile.md` (document model, vector tagging, level encoding, evidence-pointer rules, scope and N/A handling, OSCAL projection note), and `example.jsonld` (the SPEC.md Acme Corp block).
- Criterion IRIs minted in the `https://aiposture.org/criteria/v1/` namespace, one per vector per level 1-5 (15 total), with the registry at [docs/criteria/v1/index.json](docs/criteria/v1/index.json) generated from `rubric.json`. Stable IRIs; superseded only, never re-minted.
- Thin zero-dependency validator CLI at `scripts/validate.js` (MIT): validates a declaration against its JSON Schema plus the semantic rules the schema cannot express, and an EARL document against the profile shapes including weakest-link coherence. Wired into `npm test` via `tests/earl-profile.test.js`.
- Proposed Obligation-First `dct:source` linkage for Regulation-vector criteria is drafted in `profile.md`, held for steward review before it becomes normative.

Acceptance criteria met:

- Profile uses the W3C EARL 1.0 vocabulary with `apos:` extension terms.
- `example.jsonld` passes the reference validator, including the weakest-link rule.
- `example.jsonld` reproduces the SPEC.md Acme Corp reporting block.
- Schema IRI base is stable, versioned (`/schema/earl/v0/`), and the criterion namespace is versioned (`/criteria/v1/`).
- Criterion IRIs carry optional `dct:source` linkage to external obligation identifiers; the Obligation-First mappings are proposed pending steward review.

### 13. OSCAL Assessment Results projection

Status: deferred.

Rationale: EARL is structurally 1:1 with AI Posture and is the primary wire format under item 12. OSCAL adds federal-compliance reach that AI Posture does not have a consumer for today. Mapping EARL to OSCAL Assessment Results 1.1.2 is mechanical and can be added when a consumer materializes.

Re-open triggers:

- A GRC platform, auditor, or federal-compliance consumer commits to ingesting AI Posture assessments.
- A FedRAMP-adjacent AI overlay ships.
- Obligation-First publishes its OSCAL Catalog projection (Obligation-First ROADMAP deferred decision #16).

Work remaining when re-opened:

- Build `scripts/earl-to-oscal` projector.
- Author a stub OSCAL Catalog whose controls `link` to AI Posture criterion IRIs and, when available, Obligation-First Obligation IRIs.
- Validate output against the NIST OSCAL validator.
- Document projection guarantees and known lossy transformations.

### 14. AI-regulator format alignment watch

Status: open watch.

Watch for convergence in: EU AI Act conformance reporting tooling, ISO/IEC 42001 audit-format direction, NIST AI RMF crosswalks emitting machine-readable conformance.

Trigger to act: any of the above standardizes on a wire format other than EARL or OSCAL, or signals strong adoption of one over the other in AI-governance reporting.

Work when triggered:

- Reopen the wire-format decision in [docs/research/wire-format-earl.md](docs/research/wire-format-earl.md) under its revision triggers.
- Decide whether to add a third projection target, switch primary, or hold.
- Document the outcome in CHANGELOG.md.

## Recalibration gates

### 15. First 100 completions recalibration

Status: waiting on usage.

PRD reference: likelihood tables are expert-elicited for v1, recalibration planned after 100 completed pre-assessments.

Work remaining:

- Define how verified follow-up assessments are matched to pre-assessment distributions without identifying users beyond the agreed record model.
- Compare observed answer distributions against verified per-vector outcomes.
- Recalibrate likelihood tables and prior distributions.
- Version new tables with the question bank.
- Preserve old assessment records under the version they ran.
- Document recalibration in CHANGELOG.md.

Acceptance criteria:

- Recalibration is reproducible from retained aggregate and verified-follow-up data.
- Major recalibration bumps the minor version.
- Old assessments remain interpretable under their original table version.

### 16. Annual recalibration

Status: future scheduled work.

Work remaining:

- Review likelihood tables annually after launch.
- Review prior distributions annually after launch.
- Publish recalibration notes even if no scoring change is made.

Acceptance criteria:

- Annual review outcome is documented in CHANGELOG.md.

## V2 backlog

### 17. Shareable URL

Status: deferred to v2.

Work remaining:

- Add opt-in permalink generation.
- Label permalink result clearly as estimate not verified.
- Decide whether permalink stores full result server-side or encodes a minimized client-side payload.
- Add deletion and expiry behavior if server-side storage is used.

### 18. Third-party sharing opt-in

Status: deferred to v2.

Work remaining:

- Add explicit consent flow for third-party sharing.
- Define recipient, payload, retention, and revocation behavior.
- Update privacy and terms before launch.

### 19. Weekly Opener 2 jurisdiction refresh

Status: deferred to v2.

PRD reference: weekly hook to refresh jurisdiction list via https://everyailaw.com MCP, filtered for actively-enforcing statutes.

Work remaining:

- Define source query and filtering criteria.
- Generate reviewed updates to the jurisdiction options.
- Preserve historical interpretation of old assessments.
- Add tests for changed option keys and likelihood-table compatibility.

### 20. Cross-vector belief propagation

Status: deferred to v2.

Work remaining:

- Model how answers in one vector should update priors or likelihoods in another.
- Keep explainability high enough that result users can understand why their estimate moved.
- Add regression tests for propagation behavior.

### 21. Larger question banks

Status: deferred until calibration data exists.

Work remaining:

- Add richer question pools per vector.
- Recompute or elicit likelihood tables for new questions.
- Review expected information gain behavior against larger banks.
- Keep total assessment length within the PRD's low-friction user expectation.

## Explicit non-goals unless roadmap changes

- Certification, seal, audit, or attestation.
- Public leaderboard or public directory of scores.
- Account system or dashboard.
- Cross-session user stitching.
- Cookies.
- Sales gating based on estimate level.
