# AI Posture EARL profile, v0

Status: published with AI Posture spec v1.1.0. Profile version v0 (pre-stabilization; field names may tighten before v1, IRIs will not be re-minted).

Canonical IRI base: https://aiposture.org/schema/earl/v0/

This profile defines how a verified AI Posture assessment is expressed in the W3C Evaluation and Report Language (EARL) 1.0, extended with AI-Posture-local terms in the `apos:` namespace (https://aiposture.org/ns#). It is the citable wire format for the `verified` assertion basis named in the declaration format. The decision to use EARL as the primary wire format, and the alternatives weighed, are recorded in the non-normative note [wire-format-earl.md](../../../research/wire-format-earl.md).

The declaration format and this EARL profile express the same assertion in two registers. A `/.well-known/ai-posture.json` declaration is the organization's own published summary; an EARL document is the citable, accretive, multi-assertor evidence record that a third party (an assessor, an auditor, a partner) produces about that organization. One organization can have one declaration and many EARL assertions about it from different assertors over time.

## Files in this profile

- [context.jsonld](context.jsonld) — the JSON-LD context binding EARL, Dublin Core, FOAF, and `apos:` terms.
- [shapes.ttl](shapes.ttl) — SHACL shapes for required fields, vector and level enums, evidence-pointer requirement, and weakest-link coherence.
- [example.jsonld](example.jsonld) — the SPEC.md Acme Corp reporting block rendered in this profile.
- [profile.md](profile.md) — this document.

The reference validator is `scripts/validate.js` in the repository root. It validates both a `/.well-known/ai-posture.json` declaration against its JSON Schema and an EARL document against the structural shapes below, including the weakest-link rule. It is zero-dependency Node and is wired into `npm test`.

## Document model

An EARL AI Posture report is a single node of type `apos:PostureReport` that carries report-level metadata and an `apos:assertion` set. Each member of that set is an `earl:Assertion`: a statement that an assertor asserts a subject meets a test criterion, at a level, at a point in time, with evidence.

### Report-level fields

| Field | EARL / term | Required | Notes |
|---|---|---|---|
| `specVersion` | `apos:specVersion` | yes | The AI Posture spec version, e.g. `v1.1.0`. |
| `subject` | `earl:subject` | yes | IRI of the assessed organization. |
| `assertedBy` | `earl:assertedBy` | yes | IRI of the assertor producing the report. |
| `date` | `dct:date` | yes | Stamping instant (xsd:dateTime). |
| `nextReview` | `apos:nextReview` | yes | Assessor's next-review belief (xsd:date). Consumers weight a report past this date as a weaker signal. |
| `scope` | `apos:scope` | recommended | Organizational, business-unit, product-line, or team. |
| `postureLevel` | `apos:postureLevel` | yes unless all vectors N/A | Aggregate level. Must equal the minimum in-scope assertion level. |
| `constrainingVector` | `apos:constrainingVector` | yes unless all vectors N/A | The in-scope vector(s) at the minimum. |

### Per-assertion fields

| Field | EARL / term | Required | Notes |
|---|---|---|---|
| `assertedBy` | `earl:assertedBy` | yes | The asserting party. |
| `subject` | `earl:subject` | yes | The assessed organization. |
| `vector` | `apos:vector` | yes | One of `People`, `Infrastructure`, `Regulation`. |
| `inScope` | `apos:inScope` | yes | `false` marks the vector N/A; see N/A handling. |
| `test` | `earl:test` | yes | A criterion IRI (see below). |
| `mode` | `earl:mode` | recommended | `earl:manual`, `earl:automatic`, etc. |
| `result.outcome` | `earl:outcome` | yes | `earl:passed`, `failed`, `cantTell`, `inapplicable`, `untested`. |
| `result.level` | `apos:level` | yes for in-scope | Integer 1-5, the level the criterion attests. |
| `result.levelName` | `apos:levelName` | recommended | The level name string. |
| `result.atLevelSince` | `apos:atLevelSince` | recommended | When the subject reached this level. Trust signal, not a gate. |
| `result.date` | `dct:date` | yes | When this assertion was made. |
| `result.source` | `dct:source` | yes for passed | One or more evidence-artifact IRIs a third party can resolve. |

## Vector tagging and level encoding

Each assertion is tagged to exactly one vector with `apos:vector`. The level is encoded twice and the two must agree: as the EARL outcome (`earl:passed` for a met criterion) and as the explicit `apos:level` integer on the result. The explicit integer is what aggregation reads; the EARL outcome is what generic EARL consumers read.

## Criterion IRIs

The `earl:test` of each assertion is a criterion IRI minted in the AI Posture criteria namespace:

https://aiposture.org/criteria/v1/{vector}/{level}

where `{vector}` is `people`, `infrastructure`, or `regulation` and `{level}` is 1-5. The registry of all fifteen criterion IRIs, with the assertion text, evidence rows, and test from the rubric, is published at [/criteria/v1/index.json](../../../criteria/v1/index.json). Level 0 (N/A) is a falsifiable scope boundary, not a test criterion, and has no IRI.

IRIs are stable. A criterion is never re-minted; a superseded criterion is replaced by a new IRI under a new namespace version, and the old IRI continues to resolve to its original meaning.

### Proposed Obligation-First linkage (pending steward review)

Regulation-vector criteria can optionally carry a `dct:source` linkage to a published Obligation-First obligation IRI in the EveryAILaw namespace, joining an AI Posture assessment to the Legal Graph. This linkage is editorial, not mechanical: each mapping asserts that meeting an AI Posture Regulation criterion corresponds to discharging a specific named obligation. The mappings below are proposed and are held for steward review before they are committed to the registry. They are not yet normative. The same draft block appears inline in [example.jsonld](example.jsonld) under `_draftObligationFirstLinkage`; the reviewer strikes a mapping by removing its entry in both places.

| AI Posture criterion | Proposed Obligation-First IRIs | Rationale |
|---|---|---|
| `criteria/v1/regulation/2` (Assessing) | `everyailaw.com/obligations/obligation-register-coverage`, `everyailaw.com/obligations/jurisdictional-mapping` | L2 requires obligation register with jurisdictional coverage and named gaps. |
| `criteria/v1/regulation/3` (Integrating) | `everyailaw.com/obligations/statute-to-control-traceability`, `everyailaw.com/obligations/primary-jurisdiction-coverage` | L3 requires statute-to-control trace for at least one jurisdiction. |
| `criteria/v1/regulation/4` (Calibrating) | `everyailaw.com/obligations/continuous-regulatory-monitoring`, `everyailaw.com/obligations/recorded-interpretation` | L4 requires active regulatory-change monitoring and documented interpretations. |

These proposed IRIs are placeholders that assume the Obligation-First namespace stabilizes on the `everyailaw.com/obligations/{slug}` shape. The shape is itself part of what the reviewer confirms before commit; the EveryAILaw obligation registry is the authority.

## Weakest-link coherence

`apos:postureLevel` MUST equal the minimum `apos:level` over assertions where `apos:inScope` is `true`. `apos:constrainingVector` MUST name every in-scope vector at that minimum. The SHACL shapes express this as a SPARQL constraint; the reference validator enforces it directly.

## Scope and N/A handling

A vector that does not apply is expressed as an assertion with `apos:inScope: false` and `earl:outcome: earl:inapplicable`. N/A assertions are excluded from the weakest-link minimum. An N/A assertion that is externally contradicted invalidates the entire report for that stamping, mirroring the spec's falsifiable-scope rule.

## Correspondence to the SPEC reporting block

[example.jsonld](example.jsonld) renders the Acme Corp block from SPEC.md "Reporting format": People Calibrating since 2025-09-01, Infrastructure Integrating since 2026-02-14, Regulation Assessing since 2026-04-20, aggregate Assessing, constraining vector Regulation, stamped 2026-04-20, next review 2026-10-20. The same assertion as a declaration would carry the same per-vector levels, dates, and aggregate in the `/.well-known/ai-posture.json` shape.

## Projection to OSCAL

An OSCAL Assessment Results projection is deferred (ROADMAP Item 13). EARL-to-OSCAL is a one-way mechanical transform once vector tagging, weakest-link aggregation, and evidence references are recorded, which this profile does. The projection is built when a federal-compliance consumer commits to ingestion.
