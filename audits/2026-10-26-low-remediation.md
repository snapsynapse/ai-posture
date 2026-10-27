# Five low findings: local remediation

Date: 2026-10-26, America/Denver. Scope: SEC-007 through SEC-011 from the [original code/security audit](2026-10-26-code-security-review.md), preserving the prior [six-medium remediation](2026-10-26-medium-remediation.md).

Follow-up: [precommit review fixes](2026-10-26-review-fixes.md) preserve valid version 1.0.0 delivery while retaining the semantic checks, correct model-version analytics, and show absolute confirmation expiry on resends. Counts and compatibility notes below preserve this earlier checkpoint.

Status: code fixes implemented and verified locally, pending review. The tracked CI workflow now has a test dependency; remote activation and GitHub Pages configuration remain unchanged. No commit, push, production schema operation, build, or deployment was performed. HEAD remains `696b42bb2c1d248e3090035068c72d645ad9137e` on `security/black-october-npm-audit`, one commit ahead of fetched main. All audit/remediation work remains unstaged and uncommitted. The pre-existing dependency commit remains unpushed.

## Changes and regression evidence

| Finding | Local correction | Verification |
|---|---|---|
| SEC-007 | Delivery validates scope, matching level/name, normalized posterior mass and modal levels, aggregate minimum, and the full constraining-vector set. | Contradictory artifacts fail before mail or assessment storage. Mixed-scope, all-N/A, six-decimal rounding and rounded ties pass. Bad sums, non-finite values and incomplete minimum sets fail. |
| SEC-008 | Schema lookup and required-field checks use own properties. | JSON-parsed `constructor`, `toString`, `__proto__` and `hasOwnProperty` are rejected at root and nested schema boundaries. Inherited required fields do not satisfy the schema. |
| SEC-009 | Newsletter confirmation requires a fresh pending token and atomically consumes it within a 24-hour lifetime. Expired pending tokens are replaced on resubscription. | A token one second before expiry works; exact expiry and older/future timestamps cannot confirm. Concurrent use confirms once. Resubscription gets a fresh usable token while preserving confirmed subscriptions. |
| SEC-010 | Pageleave is explicitly disabled and `before_send` filters against the disclosed event list. | Tests execute the actual inline initialization with a stubbed SDK, retain privacy settings, accept the eight disclosed event types, and reject undeclared/new SDK event names. No SDK or event ingestion request is made. |
| SEC-011 | Pull requests and main pushes run root and Worker suites; the main-only deploy job needs the test job. Write permissions are limited to deployment. | Workflow contract tests cover triggers, both commands, Node/SQLite support, permissions, dependency, and PR deployment exclusion. YAML parses locally. Both suites also pass in a clean-file snapshot without ignored configuration or credentials. |

Seventeen new tests were added in this tranche. The focused regression run produced 16 failures before implementation, with 30 passing tests. Final local suites report 160 root passes and 40 Worker passes, zero failures. Root includes the Worker tests; there are 160 distinct tests, not 200. Compared with the original audit's 118 tests, the two remediation tranches add 42 tests in total.

The clean snapshot includes tracked files plus intended new source/tests and audit documents, excludes ignored `.agents`, `worker/.dev.vars`, node_modules and Git metadata, and performs no installation. It reports 159 root passes and one explicitly explained skip for the optional local agent-context comparison; Worker reports 40 passes. The original test still checks byte equality whenever that local mirror exists. Ignored machine-specific configuration is not an input required for CI.

## Behavior and compatibility

Delivery remains an explicitly unverified client-supplied estimate. These checks establish internal consistency, not the truth of answers, evidence, or computed readiness. Scope follows the medium fix: in-scope posteriors put no probability on slot zero; out-of-scope vectors use null/N/A with `[1,0,0,0,0,0]` and no evidence checklist. Posterior mass may differ from one by at most 3e-6 plus floating-point slack, accounting for six rounded probabilities. Any tied modal level after rounding is accepted. Existing exports generated through the current runtime remain valid; older inconsistent artifacts can be rejected by the stricter delivery endpoint.

Confirmation links now expire after 24 hours, measured from issuance rather than resend. Resends during that lifetime preserve the usable token. After expiry, a new subscription request replaces it and resets issuance time. Expiry is enforced in the same SQL UPDATE that consumes the token, with no SELECT/UPDATE race. Pending cleanup is opportunistic on later subscription requests or use of an expired link, not a scheduled deletion guarantee. Confirmed records are not removed by that cleanup. Confirmation email text and prepared privacy documentation describe the lifetime.

Analytics collection remains memory-only with person profiles, recording and autocapture disabled. No event type was added. The allowlist makes the existing disclosure enforceable through the SDK callback; actual deployed SDK execution and ingested events were not observed.

## CI activation and publication boundary

The prepared workflow runs an unprivileged Node 26 test job on pull requests, main pushes and manual dispatch. It runs both suites without dependency installation. Its Pages deploy job has `needs: test`, can run only on main outside pull requests, and holds Pages/OIDC write permissions that the test job does not receive. Concurrency is separated by ref so PR activity does not share main's deployment queue.

This is a locally verified workflow definition, not a successful GitHub Actions run. The last read-only Pages API observation reported legacy main `/docs` branch-source publication, which is separate from the tracked deployment job and may bypass its dependency. Before relying on tests as the sole publication gate, separately reconcile Pages to the intended Actions source and require the test check in repository rules. Neither account setting was changed in this task. Generated-artifact regeneration is not added or executed by this tranche; existing artifact/schema consistency tests run within the suites.

The earlier additive `mail_cooldown` table remains necessary before an eventual authorized Worker deployment. This low-finding tranche adds no further schema change. Nothing here authorizes publication, workflow dispatch, a production migration, or modification of existing D1 data.

## Review and limits

An independent read-only reviewer found no confirmed bypass or legitimate false positive within SEC-007 through SEC-011. It independently reran the 46 focused tests and accepted 10,000 deterministic normalized estimates rounded to six decimals without false rejection. The parent also ran both complete suites and the clean-snapshot checks. JavaScript syntax and whitespace checks pass.

Email calls and D1 execution are tested with mocked delivery and in-memory SQLite. No live service was probed or mutated. Cloudflare D1 execution, the remote GitHub workflow, hosted bytes, Pages settings changes and the earlier SHACL runtime remain unexecuted. The original report's unnumbered hardening observations are not implicitly closed by fixing these five numbered findings.
