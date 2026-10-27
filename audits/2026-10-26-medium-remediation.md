# Six medium findings: local remediation

Date: 2026-10-26, America/Denver. Scope: SEC-001 through SEC-006 from the [code/security audit](2026-10-26-code-security-review.md). Prepared on top of `696b42bb2c1d248e3090035068c72d645ad9137e`, branch `security/black-october-npm-audit`.

Subsequent local work addresses the five low findings; see [the follow-up](2026-10-26-low-remediation.md). Test counts and open-low status below preserve this medium-tranche checkpoint.

Status: implemented and verified locally, pending human review. No commit, push, production schema application, build, or deployment was performed. The five low findings remain open. The existing dependency commit remains local and unpushed.

## Changes and regression proof

| Finding | Change | Regression evidence |
|---|---|---|
| SEC-001 | Send before inserting the assessment; never write the delivery address to that row. Return a distinct storage failure after accepted mail. | Provider rejection/network failure create no assessment even when cleanup is unavailable. Successful sending needs no email cleanup. Post-send insert failure returns 503 without a retained email. UI tells the user to check the inbox and disables duplicate retry. |
| SEC-002 | Atomic rolling recipient reservations with separate route cooldowns, shared global hourly budget, HMAC recipient keys, and reuse of pending confirmation tokens. | Different IPs and concurrent requests send only once. The first link stays usable. Cooldowns cross hour boundaries. Newsletter and delivery have separate recipient windows and a shared 100-attempt budget. Suppressed recipients do not consume that budget. |
| SEC-003 | Shared bounded UTF-8 JSON reader, content-type checks, and exact envelope validation before handler processing. | Both routes reject oversized complete envelopes, unknown fields, and text/plain. Missing or inaccurate Content-Length does not bypass byte counting. Streaming reads stop and cancel near the budget; stalled cancellation does not delay rejection. |
| SEC-004 | Condition in-scope priors on levels 1-5 before applying secondary tilts; preserve the six-slot posterior and explicit N/A boundary. Export engine version 1.1.0. | The audit's adaptive uncertainty-answer path reaches a valid result and passes Worker validation. Sixty opener combinations and all question/answer updates keep in-scope mass off zero. Existing N/A and normal artifact tests pass. |
| SEC-005 | Require boolean scope and coherent outcome, aggregate from validated in-scope assertions, and check all-N/A aggregate representation. | Contradictory scope cannot hide the weakest vector. Mixed-scope and legitimate all-N/A reports pass; inflated or nonempty all-N/A aggregate metadata fails. |
| SEC-006 | Validate report provenance, assertion/result object structure, IRI references and nonempty evidence, and criterion namespace/vector/level correspondence. | Missing fields, wrong types, malformed IRIs, empty evidence, and mismatched criteria fail. Shipped examples, string/node IRI references, and evidence arrays pass. Invalid documents return errors without throwing. |

The regression tranche initially produced 20 failing tests against the original implementation. Subsequent edge-case and UI tests were added during review. Final root suite: 143 passing, zero failing. Final Worker suite: 29 passing, zero failing. The root suite includes the Worker tests; do not add the counts together. There are 25 additional tests compared with the audit baseline's 118 distinct tests.

The tests execute Worker SQL against disposable in-memory SQLite using Node's built-in `node:sqlite`, and mock every email-provider request. No production credentials, D1 records, or external mail sends are used. JavaScript syntax checks and `git diff --check` also pass.

## Decisions and tradeoffs

Delivery no longer needs persistent email dissociation. A worker interruption or provider rejection cannot strand that email on an assessment row because no such row exists before sending. Provider acceptance and D1 storage are not one transaction: mail may be accepted even when the later record insert fails. The API exposes this as `storage_failed`; the UI explains that the artifact may already be in the inbox. Acceptance is not proof of inbox delivery.

Recipient cooldowns are one hour for newsletter and ten minutes for artifacts. Both routes share 100 reserved send attempts per hour, in addition to existing five-attempt per-IP limits. Failures consume reservations to bound retries. Public unauthenticated sending still permits unwanted bounded messages, and a distributed attacker can exhaust the global quota. No claim of recipient ownership or complete bot prevention is made.

Recipient identifiers are HMAC-SHA-256 values made with the existing Resend secret and a purpose-specific prefix. They live only in the separate cooldown table, not on assessment records. Secret rotation changes those keys and can reset a recipient window; IP/global limits continue to apply. Expired keys are removed on later mail reservations, not by an asserted timer guarantee. Prepared privacy copy discloses this separate control and the existing operational IP storage.

Request limits are 1 KiB for newsletter and 33 KiB for the complete delivery request, with the existing separate 32 KiB payload limit. Application/json with optional charset is accepted; unknown envelope fields are rejected. These are intentional visible API restrictions.

The estimator correction follows the existing normative scope boundary: level zero means N/A, never low readiness or uncertainty for an in-scope vector. It changes estimated output and adaptive selection where the old model assigned mass to zero. No elicited likelihood table is recalibrated. Relative initial weights within levels 1-5 are retained, then the existing tilts operate within that space. Exported engine version 1.1.0 distinguishes newly computed artifacts; old saved answer drafts remain readable in their original format. Normative specification and wire-schema shape are unchanged.

EARL evidence checks establish syntactic pointers, not evidence truth or remote availability. JSON-LD identified nodes remain supported, including the richer report subject/assertor in the shipped example. Reference profile/SHACL updates track the strengthened provenance, scope, criterion, and passed-evidence rules. SHACL received static independent review but was not executed through an RDF/SHACL runtime, which is not installed here.

## Independent recheck

A separate read-only reviewer exercised the changed code and found two gaps in the first patch: generic test-IRI acceptance and awaited cancellation on declared-length rejection. Both were fixed and converted into regressions. The follow-up review found no additional confirmed defect within SEC-001 through SEC-006. This is local verification, not a penetration test or proof of deployed behavior.

## Eventual rollout requirements

No rollout is authorized by this document. Before an eventual authorized Worker deployment, apply the additive `mail_cooldown` table/index from `worker/schema.sql`; without it, sending fails closed. The nullable legacy assessment email column remains compatible. No existing production row was inspected, rewritten, or deleted; any review of previously retained email requires separate production-data authorization.

Deploy the paired frontend, Worker, and privacy changes together under the usual approval process. Fresh generated-output builds, deployed-byte identity, Cloudflare execution, external provider settings, and SHACL execution were not verified in this local tranche. No release/version promotion of the site package or specification was made.
