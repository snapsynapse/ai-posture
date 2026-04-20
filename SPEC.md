# Aggregated Intelligence Posture (AIP)

Version: v0.1.0
Status: Draft
Published: 2026-04-04
Last modified: 2026-04-19
License: CC BY 4.0

## Summary

The Aggregated Intelligence Posture (AIP) is a unified governance score for human-AI collaboration. It combines three independently measured vectors into a single, board-reportable maturity level.

An organization's AIP is bounded by its weakest vector. This is structural, not a scoring convenience: the domains constrain each other.

## The three vectors

| Vector | What it measures | Reference product |
|---|---|---|
| People | How effectively humans collaborate with AI — behavioral, not self-reported | https://paice.work/ |
| Infrastructure | How ready the organization's digital presence is for AI agent interactions | https://siteline.to/ |
| Regulation | How informed and prepared the organization is for AI-specific compliance | https://everyailaw.com/ |

## The five-level maturity model

Each vector is scored at one of five levels, shared across all three:

1. Perceiving — Organization is aware the domain exists but has not acted.
2. Assessing — Organization has begun inventorying its state but has no deliberate practice.
3. Integrating — Deliberate practice is in place; evidence is starting to accumulate.
4. Calibrated — Practice is measured, tuned, and defensible to outside reviewers.
5. Engineered — Practice is systematized; advancing the frontier, not catching up.

## The constraint rule

AIP is the minimum of the three vector levels.

An organization Calibrated on People but Perceiving on Regulation has an AIP of Perceiving. The constraint rule is normative, not a reporting choice. You cannot be Calibrated on compliance if your people have no evidence of AI collaboration behavior to support compliance claims. You cannot be Engineered on people if your infrastructure is not usable by agents. Each vector depends on the others.

## Reporting format

```
Aggregated Intelligence Posture: Assessing

  People:          Calibrated     ████████░░
  Infrastructure:  Integrating    ██████░░░░
  Regulation:      Assessing      ████░░░░░░

  Constraining vector: Regulation
  Recommended next action: Advance Regulation to Integrating
```

## Measurement

Each vector has its own assessment methodology under its reference product. AI Posture does not replace those assessments — it aggregates them.

A self-assessment at https://aiposture.org/assess/ provides a fast approximation. It is a starting point, not a substitute for per-vector measurement.

## License

Specification: CC BY 4.0.
Reference implementations: MIT.

## Canonical location

https://aiposture.org/ is the canonical home of this specification. Any cross-posts or references should cite this URL.
