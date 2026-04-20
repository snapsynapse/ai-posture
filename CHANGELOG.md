# Changelog

## v0.2.0 spec + PRD v0.1.0 — 2026-04-20

Spec revision and pre-assessment product definition.

SPEC.md v0.2.0
- Opened with first-principles framing. Product references moved below the fold.
- Vector set declared open with admission criteria. v1.0 ships three vectors (People, Infrastructure, Regulation). Market/Exposure collapsed into Infrastructure as its outer boundary.
- Level 0 redefined as N/A (scope boundary), not Ignoring. Falsified N/A invalidates the whole AIP assertion.
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

- Canonical spec at [SPEC.md](SPEC.md) defining the Aggregated Intelligence Posture (AIP) framework
- Landing site at https://aiposture.org/ with inline three-vector level picker
- Fifteen-question self-assessment at https://aiposture.org/assess/
