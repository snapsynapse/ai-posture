# AI Posture Pre-Assessment PRD

Archived 2026-06-01. Historical product requirements for the v1.0.0 pre-assessment. The product it specifies is built and live; this document is kept for provenance, not as a live source of truth. Remaining and future work is tracked in [ROADMAP.md](../ROADMAP.md). The framework is [SPEC.md](../SPEC.md). The runtime data files under `docs/assess/data/` are authoritative for the likelihood and rubric tables that Appendices A and B originally specified.

Version: v0.1.2
Status: Archived (was Draft)
Last modified: 2026-05-27
Related spec: SPEC.md (v1.0.0)
Canonical URL: https://aiposture.org/assess/

## Purpose

The pre-assessment is a self-administered onramp that produces an estimated Aggregated Intelligence Posture for an organization, teaches the rubric by exposing it through the estimate, and points the user to the path for a verified assertion.

This is not the verified AI Posture measure described in SPEC.md. It is a Bayesian adaptive estimate. It serves three audiences in order of priority: the person taking it (self-understanding), the stakeholder they share it with (board, exec, committee), and downstream agents that may parse the resulting artifact.

## Non-goals

- Not a certification. No seal. No attestation of compliance.
- Not an audit. No independent verification. No evidence collection.
- Not legal advice. The Regulation vector discusses obligations. It does not tell the user how to meet them for their jurisdiction.
- Not a substitute for per-vector measurement. Verified assertions require the reference implementations.
- Not a scoring leaderboard. No public directory of scores. Aggregate statistics only.
- Not a sales qualifier. Low estimates do not gate access to reference products. High estimates do not unlock anything.

## Users and context

Primary user: a person responsible for AI governance at an organization. Titles vary. CISO, CAIO, GRC lead, privacy officer, compliance director, head of IT, practitioner curious about the framework. The tool does not ask for title or role.

Context: the user arrives from the blog post, a LinkedIn share, a partner referral, or direct search. They may know nothing about AI Posture beyond the post title. They want to understand what it is and whether it applies to them. They do not want to answer 50 questions.

## Runtime flow

1. Landing page (optional newsletter email capture, stored in sessionStorage only, feeds https://paice.substack.com)
2. Three cross-vector openers (establish scope, set priors, identify falsified N/A candidates)
3. Up to 5 adaptive questions per in-scope vector, in order Infrastructure, Regulation, People
4. Stop condition per vector: posterior on one level reaches 0.70, or bank exhausted, or L0-skip rule triggered
5. Result screen (inline)
6. Optional email-delivered PDF and JSON artifact

Total question budget: 3 openers plus up to 15 vector questions = 18 max. Adaptive selection normally completes in fewer.

## Question bank

### Openers (3, scope + prior + cross-vector)

**Opener 1 — AI use acknowledgment.**
Does your organization acknowledge in writing that people use AI in their work?
Options: (a) Yes, written policy exists naming AI use. (b) Partial, AI is mentioned but not governed. (c) No written acknowledgment, but people use AI here. (d) People do not use AI here. (e) Don't know.
Primary: People scope and prior. Secondary: small upward tilt on Infrastructure and Regulation if (a).
N/A probe: (d) triggers educational follow-up before accepting N/A.

**Opener 2 — Regulatory exposure.**
In which of the following does your organization operate, sell to customers, or employ people? Select all that apply.
Options (checkbox): European Union. California, Colorado, Utah, or New York City. Other US states. United Kingdom. Other jurisdiction with AI-specific regulation. None of the above. Don't know.
Primary: Regulation scope and prior. Secondary: multi-jurisdiction tilts People and Infrastructure priors upward.
N/A probe: "None" triggers educational follow-up.
v2 note: pull jurisdiction list weekly from the https://everyailaw.com MCP, filter for actively-enforcing statutes.

**Opener 3 — Digital surface.**
Does your organization operate digital systems reachable from outside the organization?
Options: (a) Yes, public-facing (website, APIs, customer-facing apps). (b) Yes, employees and known partners only, no public surface. (c) No external-facing digital systems. (d) Don't know.
Primary: Infrastructure scope and prior. Secondary: (a) plus multi-jurisdictional Opener 2 tilts Regulation upward.
N/A probe: (c) triggers educational follow-up.

Cross-vector tilt magnitude: max 10 percent probability mass shift per opener on non-primary vectors.

### Infrastructure bank (5)

**I1 — Scan completed?**
Has your organization completed a scan of its digital surfaces for AI agent readiness?
Options: (a) Yes, report exists. (b) In progress. (c) No. (d) Not sure what this means.

**I2 — Declarations deployed and confirmed?**
Based on scan findings, has your organization deployed machine-readable declarations (llms.txt, structured data, agent-legible identifiers) on any critical surface, and confirmed the change with a follow-up scan?
Options: (a) Deployed and confirmed. (b) Deployed, not confirmed by follow-up. (c) Planned but not yet deployed. (d) No. (e) Don't know.

**I3 — Recurring scans with drift tracking?**
Do agent-readiness scans run on a declared cadence, with drift between scans tracked?
Options: (a) Both cadence and drift tracking. (b) Recurring scans, no drift tracking. (c) One-time or ad-hoc scans only. (d) No recurring scans. (e) Don't know.

**I4 — Declared framework-review cadence with recent artifact?**
Does the organization maintain a declared framework-review cadence for agent-readiness practices, with a review artifact from the most recent cycle?
Options: (a) Declared cadence and recent artifact. (b) Informal review, no declared cadence. (c) No review process. (d) Don't know.

**I5 — Release-time agent-readiness scoring?**
Are new deployments or releases automatically scored for agent readiness at release time?
Options: (a) At every release. (b) Manual check at release. (c) No release-time check. (d) Don't know.

### Regulation bank (5)

**R1 — Obligation register?**
Has your organization built an obligation register that maps AI-specific regulatory requirements to the jurisdictions where you operate, sell, or employ?
Options: (a) Yes, register exists. (b) In progress. (c) No. (d) Not sure what this means.

**R2 — Obligations translated to controls with traceability?**
Have the obligations in your register been translated into controls, with traceability from statute to control, for at least one jurisdiction?
Options: (a) Yes, with documented traceability. (b) Controls exist, traceability informal. (c) Register exists, controls in progress. (d) No. (e) Don't know.

**R3 — All jurisdictions plus monitoring plus interpretations?**
Do controls cover all in-scope jurisdictions, with active monitoring of regulatory change and documented interpretations of ambiguous requirements?
Options: (a) All three. (b) Some but not all. (c) Primary jurisdiction only. (d) No. (e) Don't know.

**R4 — Declared review cadence with artifact?**
Does the organization maintain a declared framework-review cadence for its regulatory compliance practices, with a review artifact from the most recent cycle?
Options: (a) Declared cadence and recent artifact. (b) Informal review, no declared cadence. (c) No review process. (d) Don't know.

**R5 — Continuous refresh with rapid jurisdiction intake?**
Is regulatory coverage refreshed continuously as a measured ratio, with a defined workflow to ingest a new jurisdiction in days rather than months?
Options: (a) Both continuous refresh and rapid intake. (b) Continuous refresh, slower intake. (c) Ad-hoc refresh only. (d) No. (e) Don't know.

### People bank (5)

**P1 — Baseline behavioral assessment?**
Has your organization completed a baseline assessment of how people actually use AI in their work, a measurement of behavior rather than a survey of attitudes?
Options: (a) Yes, report exists. (b) In progress. (c) No. (d) Not sure what this means.

**P2 — Change traces to assessment data?**
In the last year, has any policy, training, or practice change traced back to findings from a behavioral AI assessment?
Options: (a) Yes, with documented traceability. (b) Yes, informal traceability. (c) No. (d) Don't know.

**P3 — Cohort-level measurement on cadence with privacy?**
Does your organization measure AI-collaboration behavior at a cohort level (across teams or functions), with privacy-preserving aggregation, on a recurring cadence?
Options: (a) All three. (b) Some but not all. (c) One-time baseline only. (d) No. (e) Don't know.

**P5 — Declared review cadence with artifact?** (cadence gate, asked 4th)
Does the organization maintain a declared framework-review cadence for its AI-collaboration practices, with a review artifact from the most recent cycle?
Options: (a) Declared cadence and recent artifact. (b) Informal review, no declared cadence. (c) No review process. (d) Don't know.

**P4 — Continuous with attestation?** (asked 5th)
Is behavioral AI assessment continuous (not episodic) and paired with a verifiable attestation mechanism?
Options: (a) Both. (b) Continuous but no attestation. (c) Attestation but not continuous. (d) Neither. (e) Don't know.

## Scoring

### Bayesian adaptive

For each in-scope vector, maintain a posterior distribution over levels 0 to 5.
At each step, pick the question from the vector's bank with highest expected information gain given the current posterior.
Stop when a single level's posterior exceeds 0.70, or the bank is exhausted, or the L0-skip rule triggers.
Output per vector: the mode, its posterior probability, and the full distribution (shown on hover).

### L0-skip rule

If an opener answer indicates Ignoring (written denial of AI use, regulated activity, or digital presence that is externally contradicted in the same flow), the pre-assessment reports Level 0 Ignoring for that vector without asking the bank. Educational message explains the result.

### Prior

Openers set the initial prior. Default starting distribution (no opener signal) is uniform across levels 1 to 5 with small mass on Level 0.
Reference prior after opener 3 = (a) public-facing presence: L0=0.05, L1=0.20, L2=0.25, L3=0.20, L4=0.20, L5=0.10. Illustrative. Actual prior is computed from all three opener answers per vector.

### Likelihood tables

Expert-elicited for v1. See appendix A for all 15 tables. Planned recalibration pass after first 100 completed pre-assessments using observed answer distributions from respondents who subsequently complete a verified per-vector assessment.

### Aggregation

AI Posture = minimum of in-scope vector modes, per SPEC.md constraint rule. N/A vectors are excluded from the minimum.

### Revision (back button)

User can revise any previous answer. Posterior recomputes forward from the revised question. Subsequent answers and question sequence are preserved. If revision drops posterior below threshold and bank has capacity, one additional question is asked before result.

## Output contract

### Inline result (all users)

- Headline: "AI Posture (estimated): [level]" with scope label
- Per-vector levels with point estimate and hover band
- Constraining vector named
- Recommended next action (advance the constraining vector)
- Evidence checklist per vector: the artifacts required to turn this estimate into a verified assertion
- Handoff links: reference implementations per vector (https://paice.work for People, https://siteline.to for Infrastructure, https://everyailaw.com for Regulation) plus a generic "find an assessor" fallback
- "What this is not" expander listing the non-goals

### Email-gated artifacts

- PDF: print-friendly rendering of the inline result, board-shareable
- JSON-LD (or equivalent structured format): agent-parseable rendering of the same content
Both delivered by email after user submits a valid address. No double opt-in. Invalid address means no delivery. Email is not retained after delivery.

### Shareable URL

V2. Not in v1 scope.

## UI and UX

- One question per screen. Full focus. No multi-question forms.
- Progress indicator: "question N of up to M" where M flexes with the adaptive run (max 18).
- Answer options as radio (single select) except Opener 2 which is checkbox (multi-select).
- Back button on every question screen except the first opener.
- Draft state persists in sessionStorage during the tab lifetime. No cookies.
- Graceful abandonment. No server write until completion. Closed tab leaves no record.
- Mobile-first single-column layout. Keyboard navigation for desktop.
- Final screen: inline result, evidence checklist, handoff links, email field with prefill from front-page capture if provided.
- Post-submit: single confirmation screen. No account. No dashboard.
- No auth. No cookies. sessionStorage only.

## Data and privacy

- Per-run record stored under a random opaque ID. Contains: timestamp, opener answers, per-vector answers, computed posteriors, resulting AI Posture aggregate.
- Email captured for delivery. Delivered artifact, then email is dissociated from the record.
- Retention: 3 years. User can request deletion via the ID included in the delivery email (privacy@paice.work).
- Aggregate statistics (level distributions, constraining-vector frequencies, trajectory shapes over time) may be published without attribution.
- Newsletter email capture on front page flows to https://paice.substack.com under Substack's default double opt-in.
- No data sold. No third-party sharing without explicit opt-in (v2 feature when shareable URLs launch).

## Analytics

PostHog in cookie-less mode. Session-scoped identifiers only. No cross-session user stitching.

Events:
- assessment_started
- question_answered (records question_id only, not answer content)
- assessment_completed
- email_captured
- pdf_requested
- handoff_clicked (with destination URL)

## Legal

- Terms of Service: estimate not verified, no warranties, user retains rights to own answers.
- Privacy policy covers: sessionStorage use, PostHog cookie-less analytics, random-ID record retention (3 years), email delivery-only then dissociation, deletion on request, newsletter flow via Substack, aggregate use disclosure, no data sold.
- License: pre-assessment questions and likelihood tables released under CC BY 4.0 so others can reimplement or translate.
- Jurisdictional note: hosted under PAICE.work PBC (US). Users worldwide. Data handling complies with the strictest of operating jurisdictions.

## Voice

- Match the blog voice: direct, plainspoken, non-hedging, technical-literate.
- No em dashes. No semicolons. Short sentences.
- Question phrasing: concrete and artifact-focused. Not "do you feel ready" but "can you produce X if asked."
- Result phrasing: honest about uncertainty without apologizing for it. "This is an estimate. Here is what would make it verified."
- No buzzwords (synergy, leverage, solutions, journey, transformation).
- No corporate we-speak. First person plural refers to PAICE.work as maintainer of the tool, not generic soft voice.

## Success metrics

- Completion rate (starts vs finishes)
- Abandonment point distribution (which question breaks flow)
- Time to complete (median and p90)
- Email capture rate at completion
- Estimate-to-engagement conversion (email captures that click into a reference product or contact flow within 30 days)
- Level distribution over time (aggregate shape shift signals ecosystem maturation)
- Constraining-vector distribution (which vector most often caps the aggregate)

Tracked via privacy-respecting analytics. No per-user funnel attribution beyond the session.

## Open for v1

- Level name semantic validation (per SPEC.md). Carry forward into v1.1 if patterns emerge from completions.
- Likelihood table recalibration after 100 completions.

## V2 backlog

- Shareable URL (opt-in, permalink to estimate, clear "estimate not verified" labeling)
- Third-party sharing opt-in flow
- Weekly hook to refresh Opener 2 jurisdiction list via https://everyailaw.com MCP, filtered for actively-enforcing statutes
- Cross-vector belief propagation within question banks (v1 keeps strict silos after openers)
- Larger question banks with richer selection rules once real calibration data exists

## Appendix A: likelihood tables

Rows = levels. Columns = answer options. Cells = P(answer | level). Rows sum to 1.00.
Expert-elicited for v1. Recalibration planned after 100 completions. Tables are versioned with the question bank. Recalibration produces a new version. Old assessments retain the version they ran under.

### I1 — Scan completed?

| Level | a Yes | b In progress | c No | d Not sure |
|---|---|---|---|---|
| 0 Ignoring | 0.02 | 0.03 | 0.80 | 0.15 |
| 1 Perceiving | 0.05 | 0.15 | 0.70 | 0.10 |
| 2 Assessing | 0.85 | 0.05 | 0.05 | 0.05 |
| 3 Integrating | 0.92 | 0.03 | 0.03 | 0.02 |
| 4 Calibrating | 0.95 | 0.02 | 0.02 | 0.01 |
| 5 Engineering | 0.97 | 0.01 | 0.01 | 0.01 |

### I2 — Declarations deployed and confirmed?

| Level | a Deployed+confirmed | b Deployed not confirmed | c Planned | d No | e Don't know |
|---|---|---|---|---|---|
| 0 Ignoring | 0.01 | 0.02 | 0.02 | 0.80 | 0.15 |
| 1 Perceiving | 0.02 | 0.03 | 0.05 | 0.80 | 0.10 |
| 2 Assessing | 0.05 | 0.10 | 0.30 | 0.45 | 0.10 |
| 3 Integrating | 0.70 | 0.15 | 0.05 | 0.05 | 0.05 |
| 4 Calibrating | 0.85 | 0.08 | 0.02 | 0.03 | 0.02 |
| 5 Engineering | 0.92 | 0.05 | 0.01 | 0.01 | 0.01 |

### I3 — Recurring scans with drift tracking?

| Level | a Both | b Recurring no drift | c One-time/ad-hoc | d No | e Don't know |
|---|---|---|---|---|---|
| 0 Ignoring | 0.01 | 0.01 | 0.03 | 0.80 | 0.15 |
| 1 Perceiving | 0.01 | 0.02 | 0.07 | 0.80 | 0.10 |
| 2 Assessing | 0.02 | 0.05 | 0.60 | 0.25 | 0.08 |
| 3 Integrating | 0.10 | 0.25 | 0.30 | 0.25 | 0.10 |
| 4 Calibrating | 0.80 | 0.12 | 0.03 | 0.03 | 0.02 |
| 5 Engineering | 0.92 | 0.05 | 0.01 | 0.01 | 0.01 |

### I4 — Declared cadence with artifact?

| Level | a Declared+artifact | b Informal | c None | d Don't know |
|---|---|---|---|---|
| 0 Ignoring | 0.01 | 0.02 | 0.82 | 0.15 |
| 1 Perceiving | 0.01 | 0.05 | 0.84 | 0.10 |
| 2 Assessing | 0.03 | 0.15 | 0.75 | 0.07 |
| 3 Integrating | 0.10 | 0.35 | 0.50 | 0.05 |
| 4 Calibrating | 0.40 | 0.40 | 0.18 | 0.02 |
| 5 Engineering | 0.92 | 0.05 | 0.02 | 0.01 |

### I5 — Release-time agent-readiness scoring?

| Level | a Every release | b Manual at release | c No | d Don't know |
|---|---|---|---|---|
| 0 Ignoring | 0.01 | 0.02 | 0.82 | 0.15 |
| 1 Perceiving | 0.01 | 0.03 | 0.86 | 0.10 |
| 2 Assessing | 0.02 | 0.08 | 0.85 | 0.05 |
| 3 Integrating | 0.05 | 0.20 | 0.70 | 0.05 |
| 4 Calibrating | 0.15 | 0.45 | 0.38 | 0.02 |
| 5 Engineering | 0.92 | 0.05 | 0.02 | 0.01 |

### R1 — Obligation register built?

| Level | a Yes | b In progress | c No | d Not sure |
|---|---|---|---|---|
| 0 Ignoring | 0.02 | 0.03 | 0.80 | 0.15 |
| 1 Perceiving | 0.05 | 0.15 | 0.70 | 0.10 |
| 2 Assessing | 0.85 | 0.05 | 0.05 | 0.05 |
| 3 Integrating | 0.92 | 0.03 | 0.03 | 0.02 |
| 4 Calibrating | 0.95 | 0.02 | 0.02 | 0.01 |
| 5 Engineering | 0.97 | 0.01 | 0.01 | 0.01 |

### R2 — Obligations translated to controls with traceability?

| Level | a Yes+documented | b Informal | c In progress | d No | e Don't know |
|---|---|---|---|---|---|
| 0 Ignoring | 0.01 | 0.02 | 0.02 | 0.80 | 0.15 |
| 1 Perceiving | 0.02 | 0.03 | 0.05 | 0.80 | 0.10 |
| 2 Assessing | 0.05 | 0.10 | 0.35 | 0.40 | 0.10 |
| 3 Integrating | 0.70 | 0.15 | 0.05 | 0.05 | 0.05 |
| 4 Calibrating | 0.85 | 0.08 | 0.02 | 0.03 | 0.02 |
| 5 Engineering | 0.92 | 0.05 | 0.01 | 0.01 | 0.01 |

### R3 — All jurisdictions plus monitoring plus interpretations?

| Level | a All three | b Some not all | c Primary only | d No | e Don't know |
|---|---|---|---|---|---|
| 0 Ignoring | 0.01 | 0.01 | 0.03 | 0.80 | 0.15 |
| 1 Perceiving | 0.01 | 0.02 | 0.07 | 0.80 | 0.10 |
| 2 Assessing | 0.02 | 0.05 | 0.20 | 0.65 | 0.08 |
| 3 Integrating | 0.05 | 0.20 | 0.50 | 0.15 | 0.10 |
| 4 Calibrating | 0.80 | 0.12 | 0.03 | 0.03 | 0.02 |
| 5 Engineering | 0.92 | 0.05 | 0.01 | 0.01 | 0.01 |

### R4 — Declared cadence with artifact?

| Level | a Declared+artifact | b Informal | c None | d Don't know |
|---|---|---|---|---|
| 0 Ignoring | 0.01 | 0.02 | 0.82 | 0.15 |
| 1 Perceiving | 0.01 | 0.05 | 0.84 | 0.10 |
| 2 Assessing | 0.03 | 0.15 | 0.75 | 0.07 |
| 3 Integrating | 0.10 | 0.35 | 0.50 | 0.05 |
| 4 Calibrating | 0.40 | 0.40 | 0.18 | 0.02 |
| 5 Engineering | 0.92 | 0.05 | 0.02 | 0.01 |

### R5 — Continuous refresh with rapid intake?

| Level | a Both | b Refresh only | c Ad-hoc | d No | e Don't know |
|---|---|---|---|---|---|
| 0 Ignoring | 0.01 | 0.02 | 0.03 | 0.79 | 0.15 |
| 1 Perceiving | 0.01 | 0.03 | 0.07 | 0.79 | 0.10 |
| 2 Assessing | 0.02 | 0.05 | 0.10 | 0.75 | 0.08 |
| 3 Integrating | 0.03 | 0.10 | 0.35 | 0.45 | 0.07 |
| 4 Calibrating | 0.10 | 0.45 | 0.25 | 0.18 | 0.02 |
| 5 Engineering | 0.92 | 0.05 | 0.01 | 0.01 | 0.01 |

### P1 — Baseline behavioral assessment done?

| Level | a Yes | b In progress | c No | d Not sure |
|---|---|---|---|---|
| 0 Ignoring | 0.02 | 0.03 | 0.80 | 0.15 |
| 1 Perceiving | 0.05 | 0.15 | 0.70 | 0.10 |
| 2 Assessing | 0.85 | 0.05 | 0.05 | 0.05 |
| 3 Integrating | 0.92 | 0.03 | 0.03 | 0.02 |
| 4 Calibrating | 0.95 | 0.02 | 0.02 | 0.01 |
| 5 Engineering | 0.97 | 0.01 | 0.01 | 0.01 |

### P2 — Change traces to assessment data?

| Level | a Yes+documented | b Yes informal | c No | d Don't know |
|---|---|---|---|---|
| 0 Ignoring | 0.01 | 0.02 | 0.80 | 0.17 |
| 1 Perceiving | 0.02 | 0.03 | 0.85 | 0.10 |
| 2 Assessing | 0.05 | 0.10 | 0.75 | 0.10 |
| 3 Integrating | 0.70 | 0.20 | 0.05 | 0.05 |
| 4 Calibrating | 0.85 | 0.08 | 0.05 | 0.02 |
| 5 Engineering | 0.92 | 0.05 | 0.02 | 0.01 |

### P3 — Cohort plus cadence plus privacy?

| Level | a All three | b Some | c One-time | d No | e Don't know |
|---|---|---|---|---|---|
| 0 Ignoring | 0.01 | 0.01 | 0.03 | 0.80 | 0.15 |
| 1 Perceiving | 0.01 | 0.02 | 0.07 | 0.80 | 0.10 |
| 2 Assessing | 0.02 | 0.05 | 0.55 | 0.30 | 0.08 |
| 3 Integrating | 0.05 | 0.25 | 0.35 | 0.25 | 0.10 |
| 4 Calibrating | 0.80 | 0.12 | 0.03 | 0.03 | 0.02 |
| 5 Engineering | 0.92 | 0.05 | 0.01 | 0.01 | 0.01 |

### P5 — Declared cadence with artifact? (asked 4th)

| Level | a Declared+artifact | b Informal | c None | d Don't know |
|---|---|---|---|---|
| 0 Ignoring | 0.01 | 0.02 | 0.82 | 0.15 |
| 1 Perceiving | 0.01 | 0.05 | 0.84 | 0.10 |
| 2 Assessing | 0.03 | 0.15 | 0.75 | 0.07 |
| 3 Integrating | 0.10 | 0.35 | 0.50 | 0.05 |
| 4 Calibrating | 0.40 | 0.40 | 0.18 | 0.02 |
| 5 Engineering | 0.92 | 0.05 | 0.02 | 0.01 |

### P4 — Continuous with attestation? (asked 5th)

| Level | a Both | b Continuous no attestation | c Attestation not continuous | d Neither | e Don't know |
|---|---|---|---|---|---|
| 0 Ignoring | 0.01 | 0.01 | 0.02 | 0.80 | 0.16 |
| 1 Perceiving | 0.01 | 0.02 | 0.04 | 0.83 | 0.10 |
| 2 Assessing | 0.01 | 0.03 | 0.06 | 0.80 | 0.10 |
| 3 Integrating | 0.02 | 0.08 | 0.10 | 0.75 | 0.05 |
| 4 Calibrating | 0.15 | 0.35 | 0.25 | 0.23 | 0.02 |
| 5 Engineering | 0.90 | 0.05 | 0.03 | 0.01 | 0.01 |

## Appendix B: rubric tables

Per-vector level descriptors. Columns: Level, Name, Assertion, Evidence, Test, Notes. Rubric rows are the content source for the evidence checklist shown in the output.

### People

| Level | Name | Assertion | Evidence | Test | Notes |
|---|---|---|---|---|---|
| 0 | Ignoring | "Our people do not use AI." | No written acknowledgment of AI use. Or policy prohibits AI while use is observable. | Produce acknowledgment. Absent or contradicted by observable shadow use = Ignoring. | Falsified Level 0 invalidates the whole AI Posture assertion. |
| 1 | Perceiving | "Our people use AI. We have not measured how." | Written acknowledgment of AI use in policy, dated. | Produce the dated written acknowledgment. | No behavioral measurement required or expected at this level. |
| 2 | Assessing | "We have looked at how our people collaborate with AI." | Baseline behavioral assessment of human-AI collaboration. | Produce the assessment report, dated. | Data may be uncomfortable. Level is about seeing, not acting. |
| 3 | Integrating | "What we saw changed what we do." | At least one policy or practice change traceable to baseline assessment data. | Show the change and the source finding. | Traceability is the bar. Not activity. Not intent. |
| 4 | Calibrating | "We measure continuously. Data drives governance." | Cohort-level behavioral data on defined cadence. Privacy-preserving aggregation verified. | Produce cohort report, cadence document, anonymization validation. | Ongoing, not episodic. Jurisdictional variants if multi-jurisdictional workforce. |
| 5 | Engineering | "Human-AI collaboration is an engineered capability, continuously maintained." | Continuous behavioral assessment. Verifiable attestation mechanism. Declared framework-review cadence with review artifact from prior cycle. | Show continuous assessment, attestation mechanism, declared cadence, and most recent review artifact. | Reachable independently. Constraint rule still binds AI Posture aggregate. |

### Infrastructure

| Level | Name | Assertion | Evidence | Test | Notes |
|---|---|---|---|---|---|
| 0 | Ignoring | "AI agents do not interact with our systems." | No acknowledgment of agent interaction. Or prohibited while logs show agent traffic or external scan shows scrapable surfaces. | Inspect logs and run external scan. Contradicted denial = Ignoring. | Falsified Level 0 invalidates the whole AI Posture assertion. |
| 1 | Perceiving | "Agents may interact with our systems. We have not measured readiness." | Acknowledgment that agents may interact with org systems. | Produce the acknowledgment. | No scan or inventory required or expected. |
| 2 | Assessing | "We have scanned our infrastructure for agent readiness." | Agent-readiness scan complete. Inventory of external surfaces. Partner integrations mapped. | Produce scan report, surface inventory, partner map. | Outer surface and inner edge both in scope. |
| 3 | Integrating | "We have acted on what the scan showed." | Remediations made from scan findings. Machine-readable declarations deployed (llms.txt, structured data, agent-legible identifiers). Follow-up scan confirms change. | Show scan, remediation log, follow-up scan delta. | Declarations must be deployed, not drafted. |
| 4 | Calibrating | "We scan continuously. Drift is tracked." | Scans on defined cadence. Drift log. Outer-surface claims verified against internal reality on a cycle. | Produce cadence record, drift log, claim-reality reconciliation. | Claim-reality check catches outward drift without requiring a separate vector. |
| 5 | Engineering | "Agent-readiness is engineered into how systems are built and shipped." | Agent-readiness scored automatically at release. Standards contributed to, or internally extended protocols in use. Declared framework-review cadence with review artifact from prior cycle. | Show release-gate evidence, standards contribution or internal extension, declared cadence, and most recent review artifact. | Reachable independently. Constraint rule still binds AI Posture aggregate. |

### Regulation

| Level | Name | Assertion | Evidence | Test | Notes |
|---|---|---|---|---|---|
| 0 | Ignoring | "No AI-specific laws apply to us." | No acknowledgment of exposure. Or acknowledgment contradicted by regulated activity in jurisdictions the org operates, sells, or employs in. | Compare declared non-exposure to operational footprint. Contradicted = Ignoring. | Falsified Level 0 invalidates the whole AI Posture assertion. |
| 1 | Perceiving | "We are exposed to AI regulation. We have not mapped it." | Exposure acknowledged. Some jurisdictions named. | Produce the acknowledgment. | No structured mapping required or expected. |
| 2 | Assessing | "We have mapped our obligations across jurisdictions." | Obligation register. Jurisdictional coverage across operations, sales, employment footprint. Gaps identified. | Produce register with jurisdictional coverage and named gaps. | Coverage ratio is the measure, not volume of regulation. |
| 3 | Integrating | "Obligations are translated into controls." | Obligations mapped to controls. At least primary jurisdiction fully controlled. Statute-to-control traceability maintained. | Show the statute-to-control trace for at least one jurisdiction. | Obligation becomes action, not just document. |
| 4 | Calibrating | "Controls cover all in-scope jurisdictions. Regulatory change is monitored." | Controls across all in-scope jurisdictions. Active regulatory-change monitoring. Documented interpretations with counterparties where applicable. | Produce coverage map, monitoring cadence, interpretation records. | Documented interpretations matter where ambiguity exists. |
| 5 | Engineering | "Compliance is continuous. New jurisdictions onboard rapidly." | Obligations met as measured coverage ratio, refreshed continuously. Proactive interpretation recordkeeping. New jurisdiction ingested in days. Declared framework-review cadence with review artifact from prior cycle. | Show coverage refresh cadence, interpretation registry, jurisdiction-intake workflow, declared review cadence, and most recent review artifact. | Reachable independently. Constraint rule still binds AI Posture aggregate. |
