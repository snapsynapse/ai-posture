# Validation backlog

This backlog turns AI Posture assumptions into testable questions. It is non-normative. Findings should feed copy updates, PRD updates, spec issues, or recalibration work as appropriate.

## Construct validity

Question: Do AI Posture levels reflect observable maturity rather than program size, budget, or policy sophistication?

Data source: completed pre-assessments, verified per-vector assessments, evidence artifacts submitted during verified follow-up.

Lightweight method: compare estimated and verified levels against organization size bands and artifact completeness.

Revision trigger: large organizations score higher without stronger artifacts, or policy-heavy organizations consistently outrank artifact-complete smaller organizations.

## Inter-rater reliability

Question: Would two qualified reviewers assign the same vector level from the same evidence package?

Data source: anonymized evidence packages from verified per-vector assessments.

Lightweight method: blind duplicate review for a small sample, then compare level agreement and reasons for disagreement.

Revision trigger: reviewers disagree by more than one level on the same vector, or disagreements cluster around one rubric boundary.

## Cross-vector comparability

Question: Do Perceiving, Assessing, Integrating, Calibrating, and Engineering carry equivalent maturity weight across People, Infrastructure, and Regulation?

Data source: reviewer feedback, user interviews, pre-assessment completion comments if a consented feedback path is added, verified assessment outcomes.

Lightweight method: ask reviewers to rank example evidence packages across vectors, then identify inconsistent level interpretations.

Revision trigger: one vector regularly appears easier or harder to reach at the same named level without a defensible artifact reason.

## Freshness semantics

Question: Do users understand a posture score as a time-stamped assertion rather than a durable certificate?

Data source: result-page comprehension prompts, support questions, stakeholder review sessions, artifact-sharing feedback.

Lightweight method: ask users what happens when the next-review date passes and whether the old score becomes invalid or weaker.

Revision trigger: users repeatedly interpret expired freshness as automatic failure, or treat old assertions as current guarantees.

## Weakest-link validity

Question: Does the minimum-vector rule produce the most defensible aggregate claim for real stakeholder decisions?

Data source: edge-case scenarios, verified assessment distributions, board or reviewer feedback.

Lightweight method: present high-variance vector profiles and compare decisions made from the minimum score against decisions made from an average.

Revision trigger: the minimum score hides material strengths needed for the decision, or an average creates claims reviewers consider more defensible.

## Stakeholder interpretability

Question: Can boards, executives, regulators, partners, customers, practitioners, and agents understand what the score does and does not claim?

Data source: qualitative feedback from result artifacts, partner review, public issue comments, agent parsing checks.

Lightweight method: test whether each audience can identify the constraining vector, required evidence, and estimate-not-verified boundary.

Revision trigger: a stakeholder group consistently treats the estimate as certification, legal advice, audit output, or product endorsement.

## Vector sufficiency

Question: Are People, Infrastructure, and Regulation sufficient for v1 adoption, or is another actor-class repeatedly constraining real posture claims?

Data source: open issues, verified assessment notes, failed assertion cases, partner implementation feedback.

Lightweight method: classify proposed additions against vector admission criteria before discussing names or scoring.

Revision trigger: repeated cases show an externally observable, independently varying actor-class that constrains the whole and is not reducible to existing vectors.

## Data-model implications

Retained run records should preserve assessment version, question identifiers, answer keys, posterior distributions, aggregate result, constraining vector, timestamp, and declared scope.

Verified follow-up matching should use a random opaque run ID or explicit consent flow. It should not require name, organization, email, IP address, or other direct identifiers.

Qualitative reviewer feedback requires explicit consent and should be stored separately from anonymous assessment telemetry unless a later product decision changes the privacy model.
