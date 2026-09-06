# PROJECT_CONTEXT.md — ai-posture

Project context for content/docs skills working in this repo.

## What this project is

AI Posture (formally the "Aggregated Intelligence Posture" framework) is an open
governance specification plus reference implementation. It produces one governance
score for human-AI collaboration, computed across three vectors — People,
Infrastructure, Regulation — bounded by the weakest (minimum-vector rule). It ships
as a normative spec (`SPEC.md`), a public site (aiposture.org), a client-side
Bayesian pre-assessment tool, and a machine-readable declaration format
(`/.well-known/ai-posture.json`).

Steward: PAICE.work PBC (a US public benefit corporation), with a planned transition
to an independent steward (PAICE Foundation). Spec is CC BY 4.0; reference code is MIT.

## Audience

Governance, risk, and compliance (GRC) leaders who need one defensible readiness
score across people, infrastructure, and regulation, instead of three disconnected
tools that never combine into a single posture. Secondary audiences: standards
contributors, implementers building conforming tools, and AI agents/assistants that
consume the machine-readable framework profile and declaration schema directly.

## Style / tone

Formal, precise, standards-body register — closer to a spec or RFC than marketing
copy. Declarative sentences, defined terms used consistently (vector, constraint
rule, minimum-vector, posture, declaration), explicit versioning and dates on
every claim. Avoids hype and avoids implying certification, legal advice, or audit
authority. Explicitly labels estimates as "estimated," never "verified," unless a
real verification process backs the claim. Non-normative material is clearly
separated from normative spec language.

## Key URLs

- Canonical site: https://aiposture.org/
- Specification: https://aiposture.org/spec/ (source: `SPEC.md`)
- Self-assessment: https://aiposture.org/assess/
- Declaration schema: https://aiposture.org/schema/declaration/v1/ai-posture-declaration.schema.json
- Declaration viewer: https://aiposture.org/check/
- Framework profile: https://aiposture.org/.well-known/ai-posture-framework.json
- Assistant guide: https://aiposture.org/.well-known/assistant-guide.txt
- Papers: https://aiposture.org/papers/
- Privacy: https://aiposture.org/privacy/ · Terms: https://aiposture.org/terms/
- Repo: https://github.com/snapsynapse/ai-posture
- Related vectors (reference implementations): PAICE.work (People) —
  https://paice.work/ · Siteline (Infrastructure) — https://siteline.to/ ·
  EveryAILaw (Regulation) — https://everyailaw.com/

## Current status

Specification v1.1.1 includes provider-neutral criteria routing and the declaration
format. See `SPEC.md` and `CHANGELOG.md` for current version and release history.
See `ROADMAP.md` for remaining work, including delivery of the owner-approved steward declaration.
Check Git and live routes for current checkout and deployment state. `CLAUDE.md`
contains engineering conventions; `INTENT.md` contains stewardship strategy.

## Steward declaration maintenance

The project profile is People 1 / Infrastructure 3 / Regulation 1, aggregate Perceiving, next review 2026-12-05. The evidence page describes ongoing regulatory review through EveryAILaw and the PAICE Legal Graph. Update JSON, homepage, evidence, and discovery together; owner approval and live publication are distinct. Site release v1.1.2 leaves specification v1.1.1 unchanged.
