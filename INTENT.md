---
title: "AI Posture INTENT"
version: "0.1.3"
last_updated: 2026-09-05
status: working-hypothesis
description: "Standards-level strategy for the AI Posture framework. Subscribes to portfolio-level working hypotheses. Defines stewardship principles, vector admission criteria, recalibration gates, contribution norms."
tags: [intent, strategy, ai-posture, standards]
---

# AI Posture INTENT

Strategy for the AI Posture framework and the aiposture.org canonical home. Scoped to the open spec, the pre-assessment, and surrounding materials. Subscribes to portfolio-level working hypotheses (see https://github.com/snapsynapse/paice-foundation/blob/main/INTENT.md).

## Purpose

AI Posture is the unified governance framework for aggregated intelligence readiness across observable vectors. v1.0 ships three vectors (People, Infrastructure, Regulation). The vector set is open; admission criteria are documented below and in SPEC.md.

Position within portfolio: AI Posture is the first category-ownership claim under the Measurement Authority hypothesis. The pre-assessment is the first significant data-collection surface under the Calibration Compounding hypothesis.

## Stewardship principles

1. **Spec is free. Measurement is separately earned.** CC BY 4.0 on the spec. MIT on reference code. Verified assertions of posture require evidence, not license.

2. **Externally verifiable, or it does not qualify.** Every claim in the framework must resolve to an artifact a third party can inspect. Survey data and self-reported sentiment do not qualify as evidence.

3. **Progressive, not regressive.** The framework is a maturity model. External risk changes (new regulation, new jurisdiction, reclassification) reveal where maturity is bounded. They do not reduce it.

4. **Bounded by the weakest in-scope vector.** The constraint rule is structural, not a scoring convenience. Domains constrain each other in practice; the framework expresses that reality.

5. **Time-stamped assertion, not guarantee.** Every posture report has a next-review date and decays as a signal. Duration at level is a trust signal, not a gate.

6. **Assistant-facing instructions are human-verifiable.** AI Posture adopts the GuideCheck Human-Verifiable Assistant Guide profile for repository and site maintenance instructions. The canonical artifact is `https://aiposture.org/.well-known/assistant-guide.txt`, with a Level 4 sidecar manifest and a byte-identical repository-root mirror for source review.

## Vector admission criteria

A new vector is admitted to v1.x when all of the following hold (also documented in SPEC.md):

1. Has an externally observable artifact, or can produce one
2. Has a distinct actor-class it measures (humans, digital systems, regulators, or an analogous class not yet named)
3. Can vary independently of existing vectors
4. Can independently constrain the whole under the weakest-link rule

Candidate vectors observed but not admitted in v0.2.0: Market / Exposure (collapsed into Infrastructure as its outer boundary). Additional candidates will be evaluated against the criteria, not added aspirationally.

## Recalibration gates

Likelihood tables and prior distributions in the pre-assessment are expert-elicited for v1.x. Scheduled recalibration triggers:

- **First 100 completions:** first recalibration pass using observed answer distributions from respondents who subsequently complete a verified per-vector assessment
- **Annually thereafter:** full review of likelihood tables against accumulated data
- **On vector addition:** likelihood tables for any new vector must be elicited and published before that vector goes live in the pre-assessment

Recalibration is documented in CHANGELOG.md. Major recalibrations bump the minor version (e.g., v0.2 to v0.3). The 1.0.0 promotion is a one-time stability declaration, not a recalibration: it locks the three-vector set as the v1.x baseline without changing scoring, likelihood, prior, or aggregation rules. Subsequent recalibrations continue to bump the minor version within the v1.x line.

## Contribution norms

External contributions are welcome under the CC BY 4.0 / MIT dual-license structure. Spec revisions require:

- A documented case for the change (what does it enable or fix?)
- Backward-compatibility assessment (how does it affect existing posture assertions?)
- Compatibility with the constraint rule and the five-level maturity model

Spec changes enter as pull requests. Steward reviews against this INTENT doc, SPEC.md, and the admission criteria above.

Contributions from outside the current steward's product line are explicitly welcome. The spec does not favor any particular reference implementation.

## Relationship to reference implementations

v1.0 ships with one named reference implementation per vector, all produced by PAICE.work PBC as the current steward. This is a function of current stewardship, not a structural requirement of the framework.

When alternative implementations emerge for any vector, they will be listed alongside existing ones. The spec does not favor any implementation. Any implementation that conforms to the spec is a valid implementation, regardless of who built it.

Planned: a separate implementations page will be published when a second implementation (first-party alternative or third-party) exists for any vector. Until then, implementation references live in repo documentation only, not on the public aiposture.org surface.

## Governance

Stewarded by PAICE.work PBC. Transition to an independent steward (PAICE Foundation) is planned but not timed. See portfolio INTENT for transition logic.

Steward responsibilities:

- Maintain SPEC.md (the pre-assessment PRD is archived at archive/PRD.md as of v1.0.0)
- Triage contributions against admission and recalibration criteria
- Publish recalibration results transparently
- Own the canonical URL (aiposture.org) and its infrastructure

Non-responsibilities:

- Not a certification body
- Not a compliance guarantor
- Not a scoring judge; organizations self-assess and self-assert. The framework defines the evidence standard, not the grader.

## Steward declaration practice

The aiposture.org project publishes a self-asserted declaration with linked evidence and a dated review cycle. Its scope is the informational specification site and pre-assessment, not PAICE.work PBC as a whole. Regulatory applicability is an ongoing practice supported by EveryAILaw.com and the PAICE Legal Graph, beginning with Delaware and the US federal baseline and expanding with relevant jurisdictional connections. It is not a claim of exhaustive worldwide coverage or a permanently settled obligation map. The first owner-approved declaration is People 1, Infrastructure 3, Regulation 1, with the next declaration review on 2026-12-05. This practice does not change normative scoring or requirements.

## Status

Subscribes to: Measurement Authority, Calibration Compounding (both from the portfolio INTENT).

Current tier: working hypothesis.

Last strategic review recorded: 2026-05-25.

The previously scheduled strategic review was 2026-07-31 or after the first 100 pre-assessment completions. Its completion is not established here; the December declaration review is a separate checkpoint.

## Related docs

- Portfolio INTENT: https://github.com/snapsynapse/paice-foundation/blob/main/INTENT.md
- Spec: [SPEC.md](SPEC.md)
- Pre-assessment PRD (archived): [archive/PRD.md](archive/PRD.md)
- Changelog: [CHANGELOG.md](CHANGELOG.md)

## Changelog

- 2026-09-05 v0.1.3 - Recorded the approved project-scoped declaration and ongoing regulatory review practice. Specification remains v1.1.1.

- 2026-06-01 v0.1.2 - Specification promoted to v1.0.0, locking the three-vector set (People, Infrastructure, Regulation) as the v1.x baseline. Stability declaration only; no scoring, likelihood, prior, or aggregation changes. Pre-assessment product, site, and agent surfaces aligned to v1.0.0. Legal copy finalized (counsel verbal approval 2026-05-29). Documented the 1.0 promotion as distinct from recalibration in the versioning policy above.
- 2026-05-27 - Decision logged. W3C EARL 1.0 selected as the primary wire format for verified per-vector assessments. OSCAL Assessment Results 1.1.2 retained as a deferred projection target with explicit re-open triggers. Rationale, alternatives, and revision triggers in `docs/research/wire-format-earl.md`. No stewardship-principle changes; this is a positioning decision under the externally-verifiable and obligation-anchored principles already in force.
- 2026-05-25 v0.1.1 - Adopted GuideCheck for assistant-facing repository maintenance instructions. Added canonical `assistant-guide.txt` publication path, Level 4 sidecar manifest, repository hash anchor, and repository mirror requirement.
- **2026-04-20 v0.1.0** — Initial standards-level INTENT. Subscribes to portfolio working hypotheses. Formalizes stewardship principles, vector admission criteria, recalibration gates, contribution norms, and relationship to reference implementations.
