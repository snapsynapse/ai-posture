# Worked example: using the framework on the steward's own declaration

Status: illustrative, non-normative. Prepared 2026-09-23.

This note shows the framework used as a mental model on one real, public case: the steward's own declaration for aiposture.org. It is one example from available evidence. It is not adoption evidence, a validation result, or a claim that the framework has a demonstrated external application.

## The case

- Who: the steward of aiposture.org (PAICE.work PBC), preparing the next declaration review due 2026-12-05.
- Question: where should the next unit of effort go before that review?
- Source: the [declaration JSON](../.well-known/ai-posture.json) and [evidence page](../declaration/index.html), owner approved 2026-09-05. Profile: People 1, Infrastructure 3, Regulation 1. Aggregate Perceiving (1), constrained by People and Regulation. Basis: self-assertion.

## What the framework says

Without the framework, the obvious next move is more infrastructure work. That's the strongest vector, it has the richest evidence (route checks, machine-readable surfaces, an assistant guide), and it's the easiest to improve.

The weakest-link rule says that move changes nothing about combined readiness. Infrastructure is already two levels above the constraint. Raising it to 4 leaves the aggregate at 1. Only People and Regulation can move the aggregate, and both must move together: raising one alone leaves the other as the constraint.

The published level 2 criteria name the smallest steps:

- People 2 (Assessing): a dated baseline assessment of how the project's people collaborate with AI. The evidence page records that no dated behavioral baseline was located and that repository AI guidance shows workflow intent, not measured outcomes.
- Regulation 2 (Assessing): an obligation register with jurisdictional coverage and named gaps. The [Delaware applicability review](delaware-applicability-review.md) is a start and names an open project-footprint question; a register would consolidate it.

Useful output for this decision: "Infrastructure is not your constraint. Produce a dated People baseline and a Regulation obligation register; both are required to move the aggregate."

## Does the combined score add information?

In this case, partly.

- The aggregate alone ("Perceiving") understates what is known. It hides a two-level gap between vectors and the fact that two vectors tie as constraints.
- The constraining-vector list and the per-vector profile carry the decision. They redirect effort away from the strongest vector.
- The aggregate adds one thing: a single, conservative claim that can't be inflated by the strongest vector. That matters when the steward reports externally. It matters less for internal prioritization.

Tentative reading: for prioritization, the profile plus the constraint is the useful output; the aggregate is a reporting summary. One case can't settle this. It doesn't justify any change to normative aggregation.

## Do the three vectors fit this use?

They separate distinct evidence and effort: behavioral practice, technical surfaces, and legal obligations. That separation is what exposes the misallocation. The example doesn't test whether another actor-class should be a vector.

## Unknowns

- All levels are self-asserted. No independent review has checked them.
- Whether the redirected effort would improve anything beyond the declaration is untested.
- The beneficiary is the steward. Whether other organizations would face the same decision, or find this output useful, is unknown.

## What would count as a concrete application

Per the [INTENT reopen criteria](https://github.com/snapsynapse/ai-posture/blob/main/INTENT.md), an external case would need a named beneficiary, a task, an observed need, existing alternatives, a smallest useful output, and evidence that justifies investment. This example suggests one candidate task: helping a team see that its strongest area isn't its constraint. That's a hypothesis to test with someone outside the steward, not a finding.
