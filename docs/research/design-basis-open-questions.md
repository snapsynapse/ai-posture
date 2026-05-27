# Design basis and open questions

This note is non-normative. The specification remains the source of truth for AI Posture requirements. This note records why the current design is plausible, where it is still provisional, and what evidence would justify revision.

## Design basis

AI Posture treats maturity as observable output behavior. The framework does not ask whether an organization has adopted a governance program, bought a tool, or declared intent. It asks whether the organization can produce artifacts that a third party can inspect.

That choice is deliberate. AI governance claims are already easy to overstate. A framework that accepts internal sentiment, policy aspiration, or vendor adoption as maturity would reward presentation over operating reality. AI Posture instead measures whether behavior has become visible enough to be checked.

The three v1 vectors reflect three actor classes that can independently constrain the whole:

- People: humans using AI inside the organization.
- Infrastructure: digital systems that AI agents, partners, workers, or customers interact with.
- Regulation: legal obligations that bind the organization across jurisdictions.

Each vector can mature independently. Each can also make the others less defensible. A strong behavioral AI practice does not make compliance obligations disappear. A clean obligation register does not prove people use AI well. Agent-ready infrastructure does not prove responsible human-AI collaboration.

That is why the aggregate score uses the minimum in-scope vector. The minimum-vector rule is not intended to average effort. It names the ceiling of a defensible cross-domain claim. If one domain cannot support the claim, the whole posture claim is bounded there.

The model is progressive rather than exposure-driven. New regulation, new jurisdictions, or new system surfaces may reveal that a previous scope was incomplete. They do not, by themselves, erase evidence of mature practice already achieved. They change what must be covered for the next assertion.

The assertion is time-stamped because posture decays as evidence ages. Regulation may shift quickly. Infrastructure can change with every deployment. People behavior changes as tools, tasks, policies, and incentives change. A posture claim remains an assertion about a named scope at a named time, not a guarantee.

## Open questions

The shared level names may not carry equal semantic weight across all vectors. Perceiving, Assessing, Integrating, Calibrating, and Engineering are intended to describe the same maturity shape, but users may interpret them differently for people, systems, and regulation.

The minimum-vector rule may be correct but under-explained. Some readers may expect a weighted average because averages are common in dashboards. The framework should test whether the rule is rejected on substance or only because the explanation is too thin.

The current v1 vector set may be sufficient for early adoption but incomplete over time. Candidate vectors should be admitted only when they meet the published admission criteria and can independently constrain the whole.

The pre-assessment likelihood tables are expert-elicited. They are useful enough for a beta estimate, but not final. Recalibration after real completions and verified follow-up assessments is required before treating the estimate as strong signal.

The audience boundary needs validation. Boards, regulators, partners, customers, practitioners, and agents may need different explanations of the same score. The framework should keep one scoring model while testing which supporting artifacts each audience needs.

## Revision triggers

Revise copy if users can compute or explain the minimum-vector rule correctly only after assisted interpretation.

Open a spec issue if edge cases show the minimum-vector rule creates misleading aggregate claims even when correctly understood.

Open a spec issue if a candidate vector repeatedly appears in real assessments, has distinct artifacts, and independently constrains the whole.

Revise level terminology if qualitative feedback shows persistent cross-vector confusion that cannot be fixed with examples.

Recalibrate likelihood tables after the first 100 completed pre-assessments with verified follow-up data, and annually thereafter.
