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
| 1 | Estimate | Output of the free pre-assessment | Self | JSON artifact from /assess/, optionally published as a `self-estimate` declaration |
| 2 | Self-attested | Organization publishes the assertion and links its own evidence per vector | Self, but public and inspectable | `/.well-known/ai-posture.json` declaration with `assertion_basis: self-assertion` |
| 3 | Externally verified | Vector evidence reviewed by an independent assessor | Named third party | Declaration plus a machine-checkable EARL evidence record; not yet accepted by v1.1 validators |

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
- The specification defines `/.well-known/ai-posture.json` as the decentralized publication mechanism for estimates and self-assertions. No central registry is required.
- The declaration schema, example, validator, and browser-based viewer are published under `docs/schema/declaration/v1/` and `docs/check/`.
- The result page routes to neutral per-vector criterion and evidence pages under `/criteria/v1/`, not to a designated provider.

What does not ship yet: an accepted `verified` assertion basis, a verifier program for tier 3, or a validity badge. The `verified` vocabulary value remains reserved and validators reject it until a verification process is specified.

## Open questions

- Whether a syntactic-validity badge adds useful discovery without resembling certification. Any future badge must communicate parse validity and freshness only, never endorse a level claim.
- Whether domain control plus publication at the well-known path is sufficient provenance for tier 2, or whether a later version should add cryptographic signing.
- Verifier program governance is out of scope for this note and parked until tier 2 has real entries.

## Revision triggers

- First third-party well-known declaration published: review whether the tier definitions belong in the normative specification, with a version decision.
- A tier 2 assertion is challenged on evidence quality: revisit whether tier 2 needs minimum artifact criteria per level rather than checklist presence alone.
- EARL decision reopens (see revision triggers in the wire-format note): re-anchor tier 3 to whatever format succeeds it.
