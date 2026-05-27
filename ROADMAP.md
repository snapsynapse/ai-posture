# AI Posture Roadmap

Current roadmap for remaining pre-assessment work. Source of truth is [PRD.md](PRD.md), reconciled against [HANDOFF.md](HANDOFF.md) as of 2026-05-14.

## Current state

The static site, canonical spec page, Bayesian adaptive pre-assessment, privacy page, terms page, OG image, result evidence checklist, verification handoff links, local JSON artifact, copyable summary, and browser print/save-PDF path are live.

The remaining roadmap is mostly about turning the client-side estimate into an optional delivered artifact flow, plus post-launch calibration work once real usage exists.

## V1 remaining

### 1. Newsletter capture on landing page

Status: not started.

PRD reference: landing page optional newsletter email capture, stored in `sessionStorage`, feeds https://paice.substack.com.

Work remaining:

- Add an email capture form to the landing page.
- Store the entered email in `sessionStorage` only.
- Prefill the assessment result artifact email field once that field exists.
- Route newsletter subscription to https://paice.substack.com under Substack's double opt-in behavior.
- Track `email_captured` without recording the address.
- Update privacy copy if the final flow differs from current Substack disclosure.

Acceptance criteria:

- No cookies.
- No server-side storage in this repo.
- Invalid email is rejected client-side before handoff.
- PostHog event records only that capture happened.

### 2. Optional artifact delivery backend

Status: deferred.

PRD reference: optional email-delivered PDF and JSON artifact, email dissociated after delivery, per-run record stored under a random opaque ID.

Likely path noted in handoff: Resend + Vercel. No backend is currently configured.

Work remaining:

- Choose hosting/runtime for the delivery endpoint.
- Generate a random opaque run ID.
- Persist completed assessment record without direct identifiers.
- Accept an email address only for artifact delivery.
- Deliver JSON and PDF artifacts by email.
- Dissociate email from the assessment record after delivery.
- Return clear success and failure states to the result screen.
- Track `email_captured` and delivery request events without recording the address.
- Add deletion-request support keyed by run ID.

Acceptance criteria:

- Email is not retained after delivery.
- Assessment record contains timestamp, opener answers, per-vector answers, posteriors, and aggregate.
- Assessment record does not contain name, organization, email, IP address, or direct identifier.
- Retention policy is three years.
- Delivery failure does not create an additional retained record.
- Privacy and terms pages match the deployed behavior before launch.

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

Status: not implemented.

PRD reference: final screen includes email field with prefill from front-page capture if provided.

Work remaining:

- Add result-page email field only when delivery backend exists.
- Prefill from landing-page `sessionStorage` newsletter capture when present.
- Keep newsletter opt-in and artifact delivery conceptually separate.
- Validate address before submission.
- Show single confirmation screen after successful request.

Acceptance criteria:

- No account.
- No dashboard.
- No double opt-in for artifact delivery.
- Newsletter subscription remains separate and uses Substack behavior.

### 5. Legal copy finalization

Status: beta draft, under legal review.

PRD reference: terms and privacy cover estimate status, no warranties, rights in user answers, sessionStorage, analytics, random-ID retention, email delivery, deletion, newsletter flow, aggregate use disclosure, no data sold.

Work remaining:

- Review privacy policy after delivery backend is implemented.
- Review terms after delivery backend is implemented.
- Remove current status notice only when per-run storage and email delivery are live.
- Update effective dates when material behavior changes.

Acceptance criteria:

- Public legal pages exactly match deployed data behavior.
- Repository commit history remains authoritative for changes.

## V1 operational follow-up

### 6. Analytics QA

Status: partially implemented.

Live events include `assessment_started`, `question_answered`, `assessment_completed`, `handoff_clicked`, and `pdf_requested`.

Work remaining:

- Add `email_captured` when newsletter or artifact email capture ships.
- Confirm PostHog remains memory-only with no autocapture, recording, heatmaps, rage-click detection, or person profiles.
- Verify event payloads never include answer text, email address, name, organization, or direct identifier.

Acceptance criteria:

- Analytics payloads match privacy policy.
- Completion, abandonment, handoff, and artifact-request metrics are usable without session stitching.

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

## Recalibration gates

### 12. First 100 completions recalibration

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

### 13. Annual recalibration

Status: future scheduled work.

Work remaining:

- Review likelihood tables annually after launch.
- Review prior distributions annually after launch.
- Publish recalibration notes even if no scoring change is made.

Acceptance criteria:

- Annual review outcome is documented in CHANGELOG.md.

## V2 backlog

### 14. Shareable URL

Status: deferred to v2.

Work remaining:

- Add opt-in permalink generation.
- Label permalink result clearly as estimate not verified.
- Decide whether permalink stores full result server-side or encodes a minimized client-side payload.
- Add deletion and expiry behavior if server-side storage is used.

### 15. Third-party sharing opt-in

Status: deferred to v2.

Work remaining:

- Add explicit consent flow for third-party sharing.
- Define recipient, payload, retention, and revocation behavior.
- Update privacy and terms before launch.

### 16. Weekly Opener 2 jurisdiction refresh

Status: deferred to v2.

PRD reference: weekly hook to refresh jurisdiction list via https://everyailaw.com MCP, filtered for actively-enforcing statutes.

Work remaining:

- Define source query and filtering criteria.
- Generate reviewed updates to the jurisdiction options.
- Preserve historical interpretation of old assessments.
- Add tests for changed option keys and likelihood-table compatibility.

### 17. Cross-vector belief propagation

Status: deferred to v2.

Work remaining:

- Model how answers in one vector should update priors or likelihoods in another.
- Keep explainability high enough that result users can understand why their estimate moved.
- Add regression tests for propagation behavior.

### 18. Larger question banks

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
