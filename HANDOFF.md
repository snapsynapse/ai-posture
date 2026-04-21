# Implementation Status: AI Posture Pre-Assessment

Current-state snapshot. Prior sessions built the runtime described in [PRD.md](PRD.md) against the framework in [SPEC.md](SPEC.md). This document tracks what is live, what is pending, and the non-negotiables that still bind future work.

## Live

- Canonical site at https://aiposture.org/ (GitHub Pages, `docs/` source)
- Bayesian adaptive pre-assessment at https://aiposture.org/assess/
  - Three cross-vector openers with N/A falsification dialogs
  - Up to five adaptive bank questions per in-scope vector, chosen by expected information gain
  - Stop condition: max posterior ≥ 0.70 or bank exhausted or L0-skip
  - Per-vector mode plus full posterior on hover
  - Evidence checklist per vector pulled from rubric
  - Back button revises any prior answer, posterior recomputes forward
  - sessionStorage draft persistence, no cookies
- PostHog cookie-less analytics (`persistence: memory`, `person_profiles: never`, autocapture/recording/heatmaps disabled)
  - Events: `assessment_started`, `question_answered` (question_id only), `assessment_completed` (per-vector levels + aggregate)
- Privacy policy at `docs/privacy/` (beta draft, under legal review)
- Terms of service at `docs/terms/` (beta draft, under legal review)
- Consistent header and footer across landing, assess, privacy, terms

## Deferred

- Email delivery of PDF and JSON artifacts (would require a backend endpoint; Resend + Vercel identified as likely path, not yet configured)
- Per-run record storage with random-ID retention (deferred with email; no backend in play)
- PDF generation (client-side via jsPDF planned for v1, not yet wired)
- OG image (1200×630) for share cards (deferred)
- Newsletter capture on landing page (planned to flow into https://paice.substack.com, not yet configured)

## Open for v1

- Likelihood tables in `docs/assess/data/likelihoods.json` are expert-elicited. Recalibration planned after 100 completed pre-assessments.
- Prior distributions in `docs/assess/js/bayes.js` are pragmatic starting points. Tune when signal accumulates.
- Level name semantic validation (per SPEC). Watch for patterns in completions, revisit in v1.1.

## V2 backlog

- Shareable URL (opt-in permalink, clear "estimate not verified" label)
- Third-party sharing opt-in flow
- Weekly hook to refresh Opener 2 jurisdiction list via EveryAILaw MCP, filtered for actively-enforcing statutes
- Cross-vector belief propagation within question banks (v1 keeps strict silos after openers)
- Larger question banks once calibration data exists

## Non-negotiables

1. **No cookies.** sessionStorage only. Includes analytics.
2. **No em dashes. No semicolons.** In all user-facing copy.
3. **Bare-domain URLs with https.** Never www. Never http.
4. **Back button works on every question screen except the first opener.** Posterior recomputes forward on revision.
5. **L0-skip rule.** If opener indicates Ignoring for a vector, skip the bank and report L0 with educational framing.
6. **N/A is falsifiable.** Educational follow-up dialog required for any N/A declaration.
7. **Uncertainty visible.** Point estimate primary, full posterior on hover.
8. **Estimate labeling.** Result always labeled "estimated AI Posture." Never "verified" or "assessed."
9. **Voice matches blog.** Direct, artifact-focused, non-hedging. See PRD Voice section.

## Reference products per vector

- People: https://paice.work
- Infrastructure: https://siteline.to
- Regulation: https://everyailaw.com
- Generic handoff: https://paice.foundation

## Governance

Stewarded by PAICE.work PBC. Transition to an independent steward (PAICE Foundation) is planned. Structural decisions captured in [CHANGELOG.md](CHANGELOG.md). Questions on intent should reference SPEC.md v0.3.0 and PRD.md v0.1.1 (dated 2026-04-20).
