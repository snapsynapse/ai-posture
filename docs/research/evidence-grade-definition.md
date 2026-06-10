# Evidence-grade assertions: working definition and tiers

This note is non-normative. The specification remains the source of truth for AI Posture requirements. This note defines the term "evidence-grade" as used on public surfaces ("Self-estimate now, evidence-grade later"), names the assertion tiers, and records what promotes an assertion from one tier to the next. It exists so the public promise resolves to a definition a risk, compliance, or audit reader can test.

## Scope

This note concerns the trust status of an AI Posture assertion: who stands behind it and what a third party can inspect. It does not change scoring, vector admission, level semantics, or the constraint rule. The wire format for verified assessments is covered in [Wire format for verified AI Posture assessments](wire-format-earl.md).

## Working definition

An evidence-grade AI Posture assertion is a vector-by-vector claim in which each in-scope vector resolves to a checklist of third-party-inspectable artifacts. The aggregate level is the minimum of the evidenced vector levels. The assertion is time-stamped, carries a next-review date, names the asserting organization, and is published where a third party can retrieve it.

The definition inherits the specification's existing requirements: evidence must be externally verifiable (survey data and self-reported sentiment do not qualify), assertions decay against their next-review date, and a falsified N/A declaration invalidates the entire assertion for that stamping.

## Tiers

| Tier | Name | What it is | Who validates | Artifact |
|---|---|---|---|---|
| 1 | Estimate | Output of the free pre-assessment | Self, private | JSON artifact from /assess/ |
| 2 | Self-attested | Organization publishes the assertion and links its own evidence per vector | Self, but public and inspectable | Registry entry plus badge |
| 3 | Externally verified | Vector evidence reviewed by an independent assessor | Named third party | Registry entry plus badge carrying the verifier identity |

"Evidence-grade" means tier 2 or tier 3. Tier 1 is labeled an estimate everywhere it appears and never qualifies.

## What promotes an assertion

From tier 1 to tier 2:

- Every in-scope vector's evidence checklist (already emitted by the pre-assessment per vector) resolves to artifact URLs a third party can open.
- The organization publishes the assertion with org name, declared scope, per-vector levels, stamped date, and next-review date.
- The assertion is retrievable at a stable public location.

From tier 2 to tier 3:

- An independent assessor inspects the linked evidence per vector and records the outcome.
- The verifier is named in the published assertion.
- The verified record is expressed in the EARL wire format so the verification chain is machine-checkable.

## What already ships

- The pre-assessment result page emits a per-vector evidence checklist: the artifacts that would turn the estimate into a verified assertion at each vector's estimated level. The checklist content is sourced from the published rubric.
- The JSON artifact carries the checklist (`evidence_checklist` per vector) and the estimate-not-assertion notice.
- Routing exists from the result page to the per-vector reference implementations and to a generic find-an-assessor path.

What does not ship yet: the publication mechanism for tier 2 (assertion format and registry location), the badge, and any verifier program for tier 3.

## Open questions

- Registry location: aiposture.org/registry/ in this repo keeps the spec and the registry under one canonical URL; routing through paice.foundation separates stewardship from publication. Current lean: this repo.
- Badge format: SVG only, or SVG plus a JSON-LD sidecar for agent discovery. Current lean: both.
- Signature scheme for "signed by the asserting org": repository provenance (a registry entry submitted from the org's own account) may be sufficient for tier 2; cryptographic signing can wait for tier 3.
- Verifier program governance is out of scope for this note and parked until tier 2 has real entries.

## Revision triggers

- First registry entry published: promote the tier definitions from this note into a spec issue per CONTRIBUTING.md, with a version decision.
- A tier 2 assertion is challenged on evidence quality: revisit whether tier 2 needs minimum artifact criteria per level rather than checklist presence alone.
- EARL decision reopens (see revision triggers in the wire-format note): re-anchor tier 3 to whatever format succeeds it.
