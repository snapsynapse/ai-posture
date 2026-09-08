# Contributing

AI Posture is an open specification and pre-assessment, with its current version recorded in SPEC.md. Contributions are welcome when they preserve the framework boundaries in SPEC.md and the strategy in INTENT.md.

## Before proposing a change

Read these first:

- [SPEC.md](SPEC.md): normative framework definition.
- [archive/PRD.md](archive/PRD.md): pre-assessment behavior and output contract (archived; historical reference).
- [INTENT.md](INTENT.md): standards-level strategy and contribution norms.
- [docs/research/README.md](docs/research/README.md): non-normative positioning and validation notes.

## Contribution types

Spec changes should explain what the change enables or fixes, how it affects existing posture assertions, and whether it changes scoring, vector admission, level semantics, or the constraint rule.

Vector proposals must satisfy the published admission criteria:

- Has an externally observable artifact, or can produce one.
- Has a distinct actor-class it measures.
- Can vary independently of existing vectors.
- Can independently constrain the whole under the weakest-link rule.

Validation findings should name the assumption tested, data source, method, result, and recommended action.

Copy or terminology feedback should include the audience, confusing text, observed interpretation, and proposed replacement.

## Boundaries

Do not imply AI Posture is certification, legal advice, audit output, or a compliance guarantee.

Do not make reference implementations mandatory.

Do not replace minimum-vector aggregation with averaging without a spec issue and version decision.

Do not add analytics, retained records, email delivery, or new data collection without matching privacy and terms updates.

## Verification

Run the narrowest relevant check before submitting:

```
npm test
```

If SPEC.md changes, regenerate the generated spec page:

```
npm run build
```

Update CHANGELOG.md for public standards language, scoring behavior, metadata surfaces, or artifact shape changes.

## Hosted-site Siteline assessment

For changes to the hosted site or its machine-readable surfaces, assess the canonical site at https://aiposture.org/ with Siteline before delivery review and after an authorized deployment. Retrieve an existing result when appropriate; respect scan limits and cached-result timestamps.

- Retain the result ID, scan timestamp, scanner and rubric versions, grade, score, findings, and repository commit. A shareable result requires confirmed storage.
- Reconcile every finding against current source, generated output, and deployed evidence. Classify it as confirmed target work, scanner defect, deployment drift, stale or unreproduced, or informational. Record evidence and rationale for exceptions.
- Resolve confirmed defects that affect the site's promised agent tasks before declaring acceptance. Do not add irrelevant APIs, feeds, contact forms, or commerce features merely to raise the grade.
- Keep SNAP grades and passive standards panels separate from full GuideCheck, Graceful Boundaries, accessibility, or other applicable conformance checks. A high grade does not replace those checks.
- Local candidate checks do not establish live acceptance. After deployment, verify the intended bytes and reconcile a scan of those deployed surfaces; a cached scan of earlier content remains historical evidence.
