# Wire format for verified AI Posture assessments

This note is non-normative. The specification remains the source of truth for AI Posture requirements. This note records the format decision for machine-readable verified assessments, the alternatives considered, and the criteria that would reopen the decision.

## Scope

This note concerns the wire format for verified per-vector assessments produced by reference implementations. It does not concern the client-side Bayesian pre-assessment, which retains its current local JSON output. Verified assessments are evidence-backed assertions that a third party can validate against external artifacts; the pre-assessment is a self-reported estimate.

## Decision

W3C Evaluation and Report Language (EARL) 1.0 is the primary wire format for verified AI Posture assessments. OSCAL Assessment Results 1.1.2 is retained as a deferred projection target, not a primary format.

## What AI Posture needs from a wire format

The specification places six requirements on assessment output that any wire format must carry:

- Externally verifiable. Every claim resolves to an inspectable artifact.
- Time-stamped. Each assertion is valid at a named moment and carries a next-review belief.
- Accretive. Evidence can be added by different parties over time without rewriting earlier records.
- Per-vector. People, Infrastructure, Regulation, and any future vector are independently scored.
- Bounded by the weakest in-scope vector. The aggregate level equals the minimum of in-scope vector levels.
- Anchored to obligation identity. Where an obligation is recorded elsewhere (for example in an Obligation-First graph), the assessment references that identity rather than duplicating it.

## Why EARL

EARL is a W3C vocabulary for expressing the assertion "an assertor asserts that a subject conforms to a test criterion at a point in time, with evidence." That model maps 1:1 onto AI Posture.

- `earl:Assertor` carries the party making the claim.
- `earl:TestSubject` carries the organization assessed.
- `earl:TestCriterion` carries the obligation. Its IRI can be an AI Posture criterion IRI, an Obligation-First Obligation IRI, or both via linkage.
- `earl:passed` / `failed` / `cantTell` / `inapplicable` / `untested` carry per-criterion outcomes.
- `earl:pointer` plus `dct:source` carry evidence references that a third party can resolve.
- `dct:date` carries the assertion time-stamp; document-level properties carry next-review and at-this-level-since.

EARL is RDF-native. AI Posture criterion IRIs can be first-class graph identifiers and can resolve to or alongside Obligation-First IRIs without translation. The Catalog/Profile/Assessment-Plan chain that OSCAL requires is unnecessary because the test criterion is itself the obligation identifier.

The accretive multi-assertor model is built into EARL. Multiple assertions per subject from multiple assertors over time are the default shape of an EARL graph, not a feature that has to be designed in.

EARL is the basis for the W3C Web Content Accessibility Guidelines Evaluation Methodology (WCAG-EM), which has been used for fifteen years to express organization-level conformance with evidence. That methodology survives regulator scrutiny in the European Union under the Web Accessibility Directive 2016/2102 and the European Accessibility Act. The domain is different from AI governance; the structural problem is the same.

## Why not OSCAL as primary

OSCAL Assessment Results 1.1.2 is a strong format for federal-compliance pipelines. The structural fit for AI Posture is weaker.

- Subject-as-system assumption. OSCAL assumes the assessed thing is a deployed system. AI Posture assesses an organization across vectors. Modeling an organization as an OSCAL system is workable but is a bend.
- Catalog and Profile chain. OSCAL controls live in a Catalog. A Profile selects and tailors them. An Assessment Plan governs the assessment. Assessment Results reference the Plan. Carrying obligations identified outside OSCAL through this chain requires either a stub Catalog whose controls `link` to the external identity, or a full projection from the external source. Both are deferrable; neither is free.
- Mandatory metadata, parties, roles, UUIDs. Useful for federal-compliance lineage; overhead for a posture report that may have one assessor and one subject.
- No native multi-assertor accretion. Adding observations from a second party after publication is possible but is not the default shape of the document.

OSCAL pays back when the consumer is a GRC platform, a federal compliance pipeline, or an auditor expecting OSCAL ingestion. AI Posture does not have that consumer today. When it does, an OSCAL projection from the EARL primary is mechanical.

## Why not either-or

EARL primary and OSCAL projection are compatible. EARL carries the assertion semantics; OSCAL carries the federal-compliance shape. Mapping EARL to OSCAL Assessment Results is a one-way mechanical transform once vector tagging, weakest-link aggregation, and evidence references are recorded. The reverse direction (OSCAL to EARL) loses the accretive multi-assertor model and the IRI-native anchoring. Choosing EARL primary preserves the option to project to OSCAL later without committing to OSCAL's costs now.

## Why not other candidates

- SCAP and XCCDF. Predate OSCAL; the direction of travel in federal-compliance tooling is away from them.
- OpenControl. Superseded by OSCAL.
- W3C ODRL. Policy expression, not assessment results.
- W3C PROV-O. Provenance only; no pass/fail semantics.
- SHACL validation reports. Structural conformance against shapes, not domain assessment.
- CycloneDX, VEX, SPDX. Supply-chain domain.
- CSA CAIQ, CCM. Cloud-vendor questionnaires, not organization posture.
- Custom JSON-LD. Viable, but EARL already is this with battle-tested vocabulary and a regulator-facing precedent.

## Adoption considerations

EARL is widely emitted by accessibility tooling: axe-core, Pa11y, Tenon, Siteimprove, Level Access, IBM Equal Access, and the W3C WCAG-EM Report Tool. Outside accessibility, EARL adoption is concentrated in semantic-web validation. It is not present in healthcare, financial, or federal-cloud compliance pipelines.

OSCAL is widely ingested by GRC platforms and is the basis of FedRAMP Rev 5 reporting. It is not present in accessibility or AI-governance reporting today.

Neither format has native adoption in AI-specific regulatory regimes such as the EU AI Act, ISO/IEC 42001, or NIST AI RMF crosswalks. Both are bets on those regimes converging onto a machine-readable conformance format. The bet on EARL is that the AI-governance community will adopt the same structural pattern that the accessibility community already runs on, because the shape of the problem is the same: organization-level conformance with evidence, multi-party accretion, regulator-readable output. The bet on OSCAL would be that AI-specific overlays appear on top of NIST's compliance stack. Both bets remain open.

## Open questions

- Whether vector-level aggregation should be expressed entirely in custom properties or whether part of it can be expressed using EARL's existing constructs. Current decision is to compute and record aggregation in custom properties; revisit when accretion patterns are observed in practice.
- Whether a Plan of Action and Milestones analog (modeled on OSCAL POA&M) is required for v1.x or can be deferred. Current decision is to defer; reopen when a consumer asks for remediation tracking in the wire format.
- Whether to ship a validator CLI in this repository, in a separate repository, or as a documented invocation of generic RDF and SHACL tooling. Current decision is to ship a thin CLI in this repository under MIT license.

## Revision triggers

- A GRC platform, auditor, or federal-compliance consumer commits to ingestion. This is the primary trigger to ship the OSCAL projection.
- A FedRAMP-adjacent AI overlay ships. Promotes the OSCAL projection from deferred to scheduled.
- Obligation-First publishes its OSCAL Catalog projection. Removes the only argument for AI Posture authoring a stub Catalog of its own when the projection is built.
- The EU AI Act, ISO/IEC 42001, or NIST AI RMF crosswalks standardize on a wire format other than EARL or OSCAL. Reopens the primary-format decision.
- Verified-assessment usage shows that single-document, single-assertor records dominate and multi-party accretion is unused. Weakens the structural argument for EARL and may justify a simpler local format.

## Pointers

- W3C EARL 1.0 schema: https://w3.org/TR/EARL10-Schema/
- W3C EARL 1.0 guide: https://w3.org/TR/EARL10-Guide/
- W3C WCAG-EM: https://w3.org/TR/WCAG-EM/
- W3C ACT Rules format: https://w3.org/TR/act-rules-format/
- NIST OSCAL: https://pages.nist.gov/OSCAL/
- NIST OSCAL Assessment Results: https://pages.nist.gov/OSCAL/concepts/layer/assessment/assessment-results/
- AI Posture SPEC: [SPEC.md](../../SPEC.md)
- AI Posture ROADMAP entries for this work: [ROADMAP.md](../../ROADMAP.md)
