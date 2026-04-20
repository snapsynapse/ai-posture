# Implementation Handoff: AIP Pre-Assessment

For a fresh session starting implementation. Self-contained.

## Context

Build the pre-assessment tool described in [PRD.md](PRD.md), backed by the framework defined in [SPEC.md](SPEC.md). Deploy to https://aiposture.org/assess/.

The pre-assessment is a Bayesian adaptive self-assessment. A user answers up to 18 questions (3 cross-vector openers + up to 5 per in-scope vector × 3 vectors), and the tool produces an estimated Aggregated Intelligence Posture (AIP) with per-vector levels, a constraining vector, an evidence checklist, and handoff links to reference products.

Canonical docs to read before writing code:
- [SPEC.md](SPEC.md) — normative framework (what AIP is, the three vectors, the six levels, constraint rule, decay)
- [PRD.md](PRD.md) — product requirements (runtime flow, full question bank, likelihood tables in Appendix A, rubric tables in Appendix B, UX, analytics, privacy)

Read both end to end before starting. Most implementation decisions are already made.

## Repo state

- GitHub Pages serves `docs/`. `CNAME` points aiposture.org to the repo.
- `docs/index.html` is the current landing page with an inline three-vector level picker.
- `docs/assess/index.html` is a placeholder for the real pre-assessment.
- No build system yet. Current pages are hand-authored static HTML.
- No JavaScript framework in use. Keep it vanilla unless there's a strong reason.
- No cookies allowed. sessionStorage only. See PRD for why.

## What to build

A client-side Bayesian adaptive assessment at `docs/assess/`. Static hosting, no backend for the assessment flow itself. Server-side components are limited to:
- Email delivery of PDF and JSON artifacts (triggered on completion, user submits email)
- Aggregate event collection via PostHog in cookie-less mode
- An optional submit endpoint for per-run record storage (random ID keyed), 3-year retention

The assessment runtime is entirely client-side. Likelihood tables and question bank ship as JSON alongside the page.

### Core modules

1. **Question bank loader.** Load questions and likelihood tables from versioned JSON. Both are in PRD Appendices A and B. Transcribe once into `docs/assess/data/questions.json` and `docs/assess/data/likelihoods.json`. Include a version field.
2. **Bayesian engine.** Per vector, maintain a posterior over levels 0-5. On each answer, multiply likelihood row by prior, normalize. Select next question by expected information gain (entropy reduction). Stop when max(posterior) ≥ 0.70 or bank exhausted.
3. **Opener flow.** Three cross-vector openers ask first. Each opener sets primary-vector prior and tilts two secondary vectors by at most 10%. Openers also flag L0-skip (if opener indicates Ignoring in a vector, skip that vector's bank and report L0).
4. **N/A falsification dialog.** Opener answers indicating N/A (e.g., "people do not use AI here") trigger educational follow-up before accepting N/A. See PRD Opener sections for phrasing.
5. **Adaptive runtime.** Infrastructure first, Regulation second, People last. 5 questions max per vector. Back button revises any prior answer and recomputes forward.
6. **Result rendering.** Per-vector mode + hover band. AIP aggregate = min over in-scope vectors. Evidence checklist per vector pulled from rubric (PRD Appendix B). Handoff links.
7. **Email delivery.** Post-completion user can request PDF + JSON by email. Prefill from sessionStorage if user subscribed to newsletter on landing page. No validation theater. If email is invalid, delivery fails silently.
8. **sessionStorage draft persistence.** Draft state persists across page loads within the tab. Cleared on submit or tab close. No cookies.

### Data shapes

Proposed JSON shapes (adjust as implementation requires):

Questions (`questions.json`):
```
{
  "version": "1.0.0",
  "openers": [
    { "id": "O1", "primary_vector": "People", "text": "...", "options": [...], "na_trigger": "...", "secondary_tilts": {...} },
    ...
  ],
  "banks": {
    "Infrastructure": [
      { "id": "I1", "text": "...", "options": [...], "discriminates": "1v2" },
      ...
    ],
    "Regulation": [...],
    "People": [...]
  }
}
```

Likelihoods (`likelihoods.json`):
```
{
  "version": "1.0.0",
  "I1": {
    "0": { "a": 0.02, "b": 0.03, "c": 0.80, "d": 0.15 },
    "1": { ... },
    ...
  },
  ...
}
```

Per-run record (submitted to storage endpoint on completion):
```
{
  "id": "<random opaque>",
  "version": "1.0.0",
  "stamped_at": "<iso timestamp>",
  "scope_label": "<freeform>",
  "opener_answers": {...},
  "vector_answers": {...},
  "posteriors": {...},
  "aip_aggregate": "<level name>"
}
```

## Tech stack recommendations

- Vanilla JS or a minimal framework (Preact/Alpine/Svelte). No React unless you're already on it.
- No bundler required for vanilla JS. If bundling, use esbuild or Vite.
- PostHog JS SDK in cookie-less mode. Follow their "disable persistence" guide.
- Email delivery via an existing transactional provider (Postmark, Resend, SES). Minimal — send PDF attachment and JSON attachment to submitted address.
- PDF generation client-side (jsPDF) or server-side. Client-side avoids a backend hop but limits typography. Either works.
- Per-run record storage: simple POST endpoint writing to S3 or a small database. Random ID is the user's handle for deletion requests.

## Non-negotiables

1. **No cookies.** sessionStorage only. Includes analytics.
2. **No em dashes. No semicolons.** In all user-facing copy.
3. **Bare-domain URLs with https.** Never www. Never http.
4. **Back button works on every question screen except the first opener.** Posterior recomputes forward on revision.
5. **L0-skip rule.** If opener indicates Ignoring for a vector, skip the bank and report L0 with educational framing.
6. **N/A is falsifiable.** Educational follow-up dialog required for any N/A declaration.
7. **Uncertainty visible.** Point estimate primary, full posterior on hover.
8. **Estimate labeling.** Result always labeled "estimated AIP." Never "verified" or "assessed."
9. **Handoff links present.** https://paice.work, https://siteline.to, https://everyailaw.com per vector plus a generic "find an assessor" fallback.
10. **Voice matches blog.** Direct, artifact-focused, non-hedging. See PRD Voice section.

## First tasks in order

1. Transcribe PRD Appendix A into `docs/assess/data/likelihoods.json`
2. Transcribe PRD question bank (openers + 15 bank questions) into `docs/assess/data/questions.json`
3. Transcribe PRD Appendix B rubric into `docs/assess/data/rubric.json` for the evidence checklist
4. Build the Bayesian engine (pure functions, unit-testable)
5. Build the question-screen UI (one question per screen, back button, sessionStorage draft)
6. Build the result screen (per-vector posterior, AIP aggregate, evidence checklist, handoff)
7. Wire email delivery
8. Wire PostHog events (see PRD Analytics section)
9. Write the privacy policy and ToS at `docs/privacy/` and `docs/terms/`
10. Replace `docs/assess/index.html` placeholder with the finished app

## Open for v1

- Level name semantic validation. Watch for patterns in completions, revisit in v1.1.
- Likelihood table recalibration after 100 completions.
- Likelihood numbers in Appendix A are expert-elicited. Treat as starting point, not ground truth.

## V2 backlog

- Shareable URL (opt-in permalink, clear "estimate not verified" label)
- Third-party sharing opt-in flow
- Weekly hook to refresh Opener 2 jurisdiction list via https://everyailaw.com MCP, filtered for actively-enforcing statutes
- Cross-vector belief propagation within question banks (v1 keeps strict silos after openers)
- Larger question banks once calibration data exists

## Reference products to link from handoff

- People vector: https://paice.work
- Infrastructure vector: https://siteline.to
- Regulation vector: https://everyailaw.com
- Steward: https://paice.work (PBC), planned transition to https://paice.foundation

## Governance

AIP spec and pre-assessment are maintained by PAICE.work PBC. Transition to an independent steward (PAICE.foundation) is planned. Contributions from outside the current steward's product line are welcome. The spec does not favor any particular reference implementation.

Questions on intent should reference the conversation that produced PRD v0.1.0 and SPEC v0.2.0 (dated 2026-04-20). Structural decisions captured in CHANGELOG.md.
