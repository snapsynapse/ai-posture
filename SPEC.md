---
version: v0.3.2
status: Published
published: 2026-04-19
last_modified: 2026-05-27
license: CC BY 4.0
---

# Aggregated Intelligence Posture

## Summary

The Aggregated Intelligence Posture is a unified maturity assertion for human-AI collaboration. It rolls up independently measured vectors into a single level that a board, regulator, partner, or customer can act on.

AI Posture measures verified behavior across domains where human-AI collaboration produces externally observable consequence. It is an output measure, not an input or remediation measure. It is progressive, not regressive. It is a time-stamped assertion, not a guarantee of future state. It is bounded by its weakest in-scope vector.

## First principles

- Externally verifiable. Every claim under AI Posture resolves to an artifact a third party can inspect. Surveys and self-reported sentiment do not qualify. Intent is signal. Only behavior scores.
- Progressive, not regressive. AI Posture is a maturity model. Risk models feed it as inputs. Risk exposure that is imposed from outside (new regulation, new jurisdiction, reclassification) does not reduce maturity. It only reveals where maturity is bounded.
- Coverage, not volume. Scores reflect obligations met as a ratio of obligations in scope, not total work performed. A smaller organization can score equal to a larger one.
- Time-stamped. Every AI Posture report is an assertion valid at the moment it is instantiated. Scores decay. The assessor records a next-review belief at stamping time, which later readers use to weight the assertion retroactively.
- Bounded by the weakest vector. The constraint rule is structural, not a scoring convenience. Domains depend on each other. A Calibrating People vector cannot support a Calibrating compliance claim if Regulation is Perceiving, because the compliance claim has no behavioral ground to stand on.
- Output-orthogonal to program frameworks. AI Posture does not replace NIST AI RMF, ISO/IEC 42001, or conformance to the EU AI Act. Those frameworks govern program inputs and remediations. AI Posture measures detectable output behavior.

## The vector set

The vector set is open. New vectors may be admitted as the landscape evolves. Vectors may also retire. A candidate qualifies as a vector when it meets all of the following:

- Has an externally observable artifact, or can produce one
- Has a distinct actor-class it measures (humans, digital systems, regulators, or an analogous class not yet named)
- Can vary independently of the other vectors
- Can independently constrain the whole under the weakest-link rule

v1.0 ships with three vectors.

| Vector | Span | What it measures | Artifact class |
|---|---|---|---|
| People | Inside-out | How effectively humans in the organization collaborate with AI | Behavioral assessment with verifiable telemetry |
| Infrastructure | Bottom-up through outer surface | How ready the organization's digital systems are for AI agent interaction, from internal systems to partner integrations to public-facing surfaces | Agent-readiness scans, machine-readable declarations, structured identifiers |
| Regulation | Top-down | How completely the organization has met its AI-specific obligations across the jurisdictions that bind it | Obligation register with verifiable coverage, recorded interpretations with authorities |

Infrastructure spans the full stack, inside to edge. The outer surface (how the organization presents to humans and agents) is not a separate vector. It is the outer boundary of the same infrastructure.

Misrepresentation (claims that exceed reality) is not a separate measurement. It is a signal of immaturity within whichever vector the claim falsifies. An organization that asserts a People maturity it cannot evidence has, by that act, reduced its People score.

## The five-level maturity model

Each vector is scored at one of five levels, shared across all vectors. Level 0 indicates the vector is not in scope.

0. N/A. The vector does not apply to this organization at this time. N/A defines the scope boundary of the AI Posture claim. It does not count toward the minimum. N/A is itself a falsifiable claim. An N/A declaration that is externally contradicted (for example, a "no AI in use" declaration against demonstrable shadow AI use) invalidates the entire AI Posture assertion for that stamping, not only the falsified vector. A falsified scope is not a low score. It is not a score at all.
1. Perceiving. The organization is aware the domain exists but has not acted.
2. Assessing. The organization has begun inventorying its state but has no deliberate practice.
3. Integrating. Deliberate practice is in place; evidence is starting to accumulate.
4. Calibrating. Practice is measured, tuned, and defensible to outside inspection.
5. Engineering. Practice is systematized; the organization advances the frontier rather than catching up.

Defensibility at level 4 is not audience-specific. A Calibrating score must hold up to auditors, regulators, boards, partners, and customers alike. The analogy is physical immunity: a healthy immune system defends against both germs and viruses without knowing in advance which will arrive.

Level name semantics are intended to carry equivalent weight across vectors. Validation of this assumption is open for v1.0 and may tighten in later versions.

Each vector reaches each level independently. An organization may score Engineering on one vector while another sits at Assessing. The constraint rule still applies. AI Posture is the minimum of in-scope vectors. Cohesion at the aggregate level is enforced by the minimum, not by gating level progression within any single vector.

## The constraint rule

AI Posture equals the minimum of the in-scope vector levels. N/A vectors are excluded from the minimum.

The rule is normative. Domains constrain each other in practice. A Calibrating People score without a Calibrating Regulation score cannot support a defensible compliance narrative. A Calibrating Infrastructure score without Calibrating People cannot support a claim of responsible human-AI collaboration. The minimum captures the organization's true operating ceiling, which is only as strong as its weakest link.

## Scope and comparability

An AI Posture score applies to the organization as declared, at the scope declared, for the vectors declared. Organizations with different footprints may publish identical scores. That is intentional. Maturity is progressive. The model rewards what is genuinely in scope and met.

Scores may be issued at organizational, business-unit, product-line, or team scope. The scope must be named alongside the score.

## Decay and freshness

An AI Posture assessment is an assertion at the moment it is instantiated. It is not a promise about the future.

Each assessment stamps a next-review date reflecting the assessor's belief about the assertion's likely valid window. Decay rates are not uniform across vectors or even within a single vector. Regulation can shift weekly. People behavior shifts over months. Infrastructure shifts on deployment cadence.

Each vector's level assertion also carries an at-this-level-since date. Duration at level is a trust signal, not a gate. Two organizations at the same level with different tenures publish truthfully different signals, and readers weight accordingly. Level 5 additionally requires a declared framework-review cadence and a review artifact produced within the prior cadence window. The organization sets the cadence. The artifact proves adherence.

Freshness is the reader's weighting. A score three months past its next-review date is not invalid. It is a weaker signal and should be treated as such.

## Relationship to adjacent frameworks

AI Posture is orthogonal to NIST AI RMF, ISO/IEC 42001, EU AI Act conformance programs, and similar regimes. Those frameworks measure program design, governance structure, and remediation discipline. AI Posture measures verified output behavior.

An organization may run any or all of those programs and still receive a Perceiving AI Posture if the programs have not yet produced externally observable behavioral change. Conversely, an organization may score Calibrating on AI Posture without formally adopting any of those frameworks, provided the behavioral evidence exists.

AI Posture does not replace those frameworks. Where they are required, they remain required. Where they are optional, AI Posture does not substitute for them.

## Reporting format

```
Aggregated Intelligence Posture: Assessing
Scope: Acme Corp, organizational
Stamped: 2026-04-20
Next review: 2026-10-20

  People:          Calibrating    ████████░░    since 2025-09-01
  Infrastructure:  Integrating    ██████░░░░    since 2026-02-14
  Regulation:      Assessing      ████░░░░░░    since 2026-04-20

  Constraining vector: Regulation
  Recommended next action: Advance Regulation to Integrating
```

Additional vectors, if in scope, are listed in the same block. Vectors marked N/A are listed explicitly to make scope legible.

## Measurement

Each vector has its own assessment methodology. AI Posture does not define those methodologies. It defines how their outputs aggregate into a single board-reportable level.

A self-assessment at https://aiposture.org/assess/ provides a fast approximation. It is a starting point, not a substitute for per-vector measurement.

Reference implementations for each vector are listed in the companion document at https://aiposture.org/implementations/.

## Governance

AI Posture is currently stewarded by PAICE.work PBC. The spec is maintained in public under CC BY 4.0 and accepts contributions under the repository's contribution terms.

Adoption by organizations outside the current steward's product line is explicitly welcome. The spec does not favor any particular reference implementation.

## License

Specification: CC BY 4.0.
Reference implementations: MIT.

## Canonical location

https://aiposture.org/ is the canonical home of this specification. Any cross-posts or references should cite this URL.
