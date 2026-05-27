# Weakest-link and level-semantics stress tests

This note pressure-tests the two design choices most likely to draw serious critique: minimum-vector aggregation and shared level names. It is non-normative.

## Scenarios

### High People, low Regulation

Profile: People is Calibrating. Infrastructure is Integrating. Regulation is Perceiving.

Surprise: A board may feel the organization deserves credit for strong human-AI practice.

Classification: keep rule, improve guidance.

Reason: the organization may have strong internal behavior, but the aggregate claim cannot support a defensible compliance narrative. The result should highlight People strength while naming Regulation as the investment case.

### High Regulation, low People

Profile: Regulation is Calibrating. Infrastructure is Integrating. People is Perceiving.

Surprise: compliance teams may expect a high posture because obligations are mapped and monitored.

Classification: keep rule, improve guidance.

Reason: obligation coverage does not prove people actually collaborate with AI responsibly. The aggregate should remain bounded by People.

### High Infrastructure, low People

Profile: Infrastructure is Engineering. Regulation is Integrating. People is Assessing.

Surprise: technical teams may expect agent-readiness maturity to dominate the score.

Classification: keep rule.

Reason: agent-ready systems can amplify poor human practice. Infrastructure strength is a capability, not an aggregate maturity substitute.

### One vector N/A

Profile: Infrastructure is N/A. People is Integrating. Regulation is Assessing.

Surprise: readers may treat N/A as a hidden zero.

Classification: improve guidance.

Reason: N/A defines scope. It should be excluded from the minimum, but it remains falsifiable. Result copy should make both points visible.

### Falsified N/A

Profile: organization declares no AI use, but later evidence shows material AI use.

Surprise: users may expect this to become Level 1 rather than invalidating the assertion.

Classification: keep rule, improve guidance.

Reason: a falsified scope boundary invalidates the stamping. It is not low maturity. It is a claim that cannot be trusted.

### Fast external change

Profile: Regulation was Calibrating. A new jurisdiction applies two weeks later.

Surprise: users may expect the old score to drop immediately.

Classification: keep rule.

Reason: AI Posture is time-stamped. The old assertion weakens as a current signal but remains truthful for its stamped scope and date unless scope was false.

### Narrow scope, high maturity

Profile: one business unit scores Calibrating while the enterprise overall would score Assessing.

Surprise: readers may compare the business-unit score to enterprise scores without noticing scope.

Classification: improve guidance.

Reason: scope must travel with the score. Result artifacts should keep scope adjacent to the aggregate.

### Average score looks more flattering

Profile: People is Engineering. Infrastructure is Calibrating. Regulation is Perceiving.

Surprise: an average would read near Integrating, while the minimum is Perceiving.

Classification: keep rule.

Reason: the average would imply a cross-domain posture that Regulation cannot support. The minimum prevents a mature vector from laundering an immature one.

## Level-semantics checks

Perceiving should mean awareness without deliberate practice in all vectors.

Assessing should mean inventory or baseline measurement without sustained practice in all vectors.

Integrating should mean deliberate practice with early evidence in all vectors.

Calibrating should mean measured, tuned, externally defensible practice in all vectors.

Engineering should mean systematized frontier practice with a declared review cadence and recent review artifact in all vectors.

## Open watchpoints

Regulation may feel more binary than People or Infrastructure because legal obligations are often read as met or unmet. Guidance should emphasize coverage ratio and recorded interpretations.

People may feel more subjective than the other vectors. Guidance should keep returning to behavioral evidence and privacy-preserving cohort measurement.

Infrastructure may be mistaken for public website readiness only. Guidance should preserve the full span from internal systems to partner integrations to public-facing surfaces.

Any scoring change requires a spec version decision and CHANGELOG.md entry.
