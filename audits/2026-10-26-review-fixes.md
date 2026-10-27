# Precommit review findings: local fixes

Date: 2026-10-26, America/Denver. Scope: R1-R3 from the [complete diff review](2026-10-26-precommit-review.md). All three code findings are corrected locally. No staging, commit, push, migration, build, provider-setting change or deployment was performed. HEAD remains `696b42bb2c1d248e3090035068c72d645ad9137e`, one commit ahead of fetched main. The existing dependency commit remains unpushed.

## Corrections and proof

| Finding | Correction | Regression evidence |
|---|---|---|
| R1 | Start and completion analytics use `B.VERSION`, matching the exported result's computation engine. Saved-answer drafts retain format version 1.0.0. | A real opener submission and completion identify engine 1.1.0. A restored 1.0.0 draft also emits 1.1.0 for newly computed results. Existing completion deduplication remains intact. |
| R2 | Exact artifact version 1.0.0 may retain legacy slot-zero probability for an in-scope modal level from 1-5. Every other semantic/shape check still applies. Newer and unknown versions retain zero-mass enforcement for in-scope slot zero. | A captured old-client artifact passes validation, sends through the new handler and is stored/attached unchanged. Version variants do not receive the exception. Invalid aggregate/name/scope/mass/mode, level-zero/Ignoring and incomplete constraining vectors still fail. |
| R3 | Newsletter UPSERT returns the original issuance timestamp; both email formats show its absolute UTC deadline. Resending does not extend token lifetime. | Signup at T0 and resend at T+23h show the same T+24h expiry, not T+47h. The token is unchanged and is rejected at that original deadline. |

Seven regressions were added. Before implementation, the focused run had five failures and 52 passes; the two passing new tests already guarded against relaxing unrelated rules. After correction, all 57 focused tests pass.

Final complete suites: 167 root passes and 45 Worker passes, zero failures. The root suite includes Worker tests, so there are 167 distinct tests. Clean-file verification reports 166 root passes and one expected skip for absent ignored local agent configuration; Worker reports 45 passes. Whitespace and JavaScript syntax checks pass. No dependency or lockfile was changed.

## Legacy fixture and compatibility boundary

`worker/tests/fixtures/estimate-1.0.0.json` was captured using app.js and bayes.js from commit `696b42b`. Openers were O1=a, O2=[eu], O3=a. The old engine chose each adaptive question, and option index 1 was selected until the result stage. Infrastructure asked I3/I2; Regulation R2/R3/R5/R4/R1; People P3/P4/P5/P2/P1. The generated timestamp was fixed for deterministic testing; computed results and probabilities were preserved.

The old engine produced an Integrating aggregate with in-scope slot-zero probabilities 0.000510, 0.000005 and 0.000001. The old Worker and corrected new Worker both accept it. Its version and all payload fields remain unchanged through storage and the emailed JSON attachment. Tests require only checked-in source and the fixture; they do not need Git history or network access in CI.

Version 1.0.0 is compatibility metadata supplied by the client, not an authentication or verification claim. It changes only the legacy posterior rule. It does not bypass normalized mass, modal level, scope coherence, matching level names, aggregate minimum, complete constraining vectors, request limits or sending budgets. Current-engine artifacts still use the corrected scope boundary. Invalid old level-zero results remain invalid.

## Independent check and remaining boundaries

An independent read-only reviewer reran the focused suite and found no confirmed bypass or regression in R1-R3. Email and database behavior were exercised with mocked delivery and disposable in-memory SQLite, without real credentials or mail sends.

The prior deployment prerequisites remain: additive `mail_cooldown` schema before Worker activation; Pages-source and required-check reconciliation; actual SHACL execution, generated-output/Worker-bundle verification and privacy publication review. These were not performed or waived. The compatibility correction removes the known old-client rejection identified by R2; it does not establish deployed-byte identity or a successful production rollout.

All implementation, tests, fixture and audit updates remain local, unstaged and uncommitted for review.
