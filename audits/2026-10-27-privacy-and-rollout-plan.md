# Privacy review and schema/Worker rollout plan

Date: 2026-10-27, America/Denver. Scope: repo-level privacy accuracy, publication metadata and rollout preparation for AI Posture. Reviewed code: `d89993ffd30edaf805e84e88cdc9e08420218d94`; main: `ae13413642bdb99c0350ea48be4621e975b952be`. Both existing commits remain separate and pushed; PR #1 remains draft. This report, its SQL draft and release-state record are local planning artifacts. At the initial review checkpoint, policy HTML, application code and authoritative schema were not edited. The local remediation checkpoint below records the subsequent authorized edits. No schema changes, data cleanup, merge, deployment, traffic pause or mail send was performed.

Latest local verdict: PRIV-R1 through PRIV-R3 are fixed and regression-tested. The [local diff review and closure record](/Users/snap/Git/ai-posture/audits/2026-10-27-local-diff-review.md) records the corrections. Root 179, separate Worker 45 and SHACL 26 tests pass; both build checks pass. The full 13-file staged candidate has passed local review for the authorized new local commit. Production execution still requires operational confirmations, controlled cutover and explicit authority; prior CI/simplicity apply only to the committed head.

## Local remediation checkpoint

Authorized scope: fix the five numbered privacy/publication findings, add URL-sanitization regressions and rerun both suites and build checks. This precommit checkpoint includes the subsequent authorized PRIV-R1 through PRIV-R3 fixes and review of the complete staged candidate. The finding table below preserves the initial evidence at `d89993f`; it is not a claim that the corrected local files still have those defects.

- PRIV-001: the policy now discloses potentially identifying scope labels/accepted artifact text instead of promising that every artifact is non-identifying.
- PRIV-002: the actual inline `before_send` filter removes URL credentials, queries and fragments, reduces referrers to origins, sanitizes current and initial URL/path/host fields on every permitted event, and drops malformed/non-web URL values. It disables the usual campaign capture, removes known copied campaign/search/ad-click fields and discards unused person-update containers. The complete `$session_entry_*` namespace is now dropped, including unknown future fields and non-string values; the policy describes outgoing filtering rather than claiming that SDK memory never contains attribution values. Existing event names, assessment metrics and session identifiers are preserved. Paths can still contain identifying text; the policy acknowledges that limit and does not claim historical erasure.
- PRIV-003: new-record address handling is qualified by updated-service activation. The policy explicitly acknowledges possible historical linked addresses and the absence of automatic cleanup.
- PRIV-004: backend/processor, request-IP, rights and notice descriptions now address existing processing. The paired terms no longer infer a privacy/consumer-law exemption from browser-side answers or claim that no personal data exists. The prohibition on extracting other users' personal data remains. Broad all-provider cookie claims were narrowed to the verified assessment configuration.
- PRIV-005: privacy and paired terms are v0.2.0, prepared October 27, 2026, effective on publication. Their visible dates, HTML datetime values and sitemap lastmod entries agree. The changed assessment sitemap entry is also October 27. A preparation date is not an assertion that publication or activation occurred; capture the actual publication timestamp during the future rollout. Historical May 29 counsel approval in INTENT remains untouched. Site/spec/engine versions are unchanged.

| Local verification | Result |
|---|---|
| Root `npm test` | 179 passed, zero failures/skips; includes the 45 Worker cases. |
| Worker `npm test` | 45 passed, zero failures/skips, run separately. |
| Actual SHACL runtime | 26 passed using the pinned existing temporary Python environment. RDFLib's existing parser deprecation warning remains. |
| Site `npm run build` | Passed; generated spec/criteria output has no Git diff. |
| Wrangler 4.153.0 dry-run | Passed from a secret-free temporary Worker copy: 22.88 KiB, gzip 6.62 KiB. No remote deployment. |
| Rollout command regression suite | Three tests pass using inert stubs under sh, bash and zsh: all four blocks stop on a missing directory, accept valid paths with spaces, and stop subsequent calls after a failed preflight. No provider commands run. |
| Diff review | No unrelated tracked changes, Worker/schema/lockfile changes or whitespace errors. |

Eight new analytics regressions (ten analytics tests total) execute the real inline hook in a VM without network calls. They cover every permitted event, initial/current URLs, relative handoff destinations, referrer paths, credentials, queries/fragments, invalid/non-web values, direct visits, host duplication, ports, campaign/search/ad-click copies, person-update containers and the entire SDK session-entry namespace. The earlier 173-pass suite omitted entry properties; the new entry cases failed before PRIV-R1 was fixed. A paired terms regression catches PRIV-R2. The exact documented command blocks are exercised with inert stubs for PRIV-R3, with both rejection and success cases. Five red-phase failures reproduced the three findings; all six new tests now pass. Final full checks passed after the final product/test and command-block edits.

Current verification logs and the nine-source/test-file SHA-256 manifest, including the tested command-block digest, are in `/private/tmp/ai-posture-privacy-r1-r3-verification-a8cm_nmc/`. Manifest SHA-256: `19a99ad29424d337005fe00d089c47f238b4a75d05fabad99f05b42f6f1e171e`. Rollout command-block SHA-256: `649de2e8223b3dab62de2554078ce1afa8a6c85ee541606b65bab79d2649175e`. The previous 173-pass checkpoint remains historical evidence, not current coverage. Node 26.12.1 / npm 11.20.0. The [PostHog configuration reference](https://posthog.com/docs/libraries/js/config) documents the outgoing-event hook; the [SDK campaign-property source](https://github.com/PostHog/posthog-js/blob/main/packages/browser-common/src/utils/event-utils.ts) and [event construction source](https://github.com/PostHog/posthog-js/blob/main/packages/browser/src/posthog-core.ts) informed the copied-property checks. This is deterministic local-hook and inert-shell verification, not inspection of historical analytics, live SDK traffic or actual rollout execution.

Remaining before publication/activation: confirm retention and rights operations, provider/account/legal assertions, choose and verify the mail-pause mechanism, review the complete candidate, and obtain the respective merge/schema/Worker/Pages authority. A future committed candidate needs fresh exact-head CI and the required simplicity review. The existing SQL draft is unchanged and unapplied.

## Privacy findings at initial review

| ID | Priority | Evidence and finding | Required correction |
|---|---|---|---|
| PRIV-001 | P2 | [privacy policy](/Users/snap/Git/ai-posture/docs/privacy/index.html:155) says the stored artifact contains no name, organization or direct identifier. [delivery validator](/Users/snap/Git/ai-posture/worker/src/deliver.js:72) accepts arbitrary `scope.label` text and persists the serialized artifact. A test-only legacy fixture with `Example Organisation / Alex Example` in that field passed the real validator. | Describe the absence of dedicated delivery-identity fields, rather than claiming every artifact is non-identifying. A scope label or other accepted artifact text can contain identifying information. The current normal UI does not expose a scope-label input; this is a wire-format capability, not evidence of observed customer data. |
| PRIV-002 | P2 | The pageview statement at line 142 promises page path/referrer with no identity. The event filter at [analytics filter](/Users/snap/Git/ai-posture/docs/assess/index.html:285) restricts event names and returns allowed events unchanged. A local call with test-only identifying URL/referrer query strings retained both. No event was transmitted. | Prefer client-side property sanitization with regressions for URL query/fragment and referrer handling. Otherwise accurately disclose the actual URL properties. Do not treat the event-name allowlist as property redaction or proof that historical events contained no identifiers. PostHog project transformations and live event bodies were not inspected. |
| PRIV-003 | P2 | The absolute address-never-stored statement at line 159 describes the new implementation, but the additive schema leaves the legacy nullable email column and all old rows intact. | Qualify the promise to new delivery requests after verified activation. Separately decide how to inspect and remediate legacy linked rows. Do not claim historical deletion or infer the legacy row count from a schema read. |
| PRIV-004 | P3 | Lines 195/208/211 still describe identifiable-data processing/storage or backend documentation as hypothetical. Workers/D1 and Resend are already used for optional delivery and newsletter processing; request-limit code also stores IP buckets. | Replace the future-tense backend text and broad no-personal-data premise with an accurate distinction between browser-side answers, optional artifact delivery and security controls. Explain Cloudflare Workers/D1 and Resend in the privacy page, as the terms already do. |
| PRIV-005 | P3 | The revised policy still displays v0.1.0 / May 29, 2026; the privacy entry in [privacy sitemap entry](/Users/snap/Git/ai-posture/docs/sitemap.xml:35) has the same date. The policy itself says material changes receive a new effective date. | Propose privacy version v0.2.0, subject to owner approval, effective on the actual publication/cutover date. Update the visible date, HTML datetime and privacy sitemap lastmod together. Preserve May 29 as the prior approval/publication checkpoint. Do not relabel that historical counsel approval as approval of this revision. |

The PostHog documentation describes pageview Current URL properties and separate URL-parameter masking; an event-name filter alone does not establish their absence. See [pageview URL properties](https://posthog.com/docs/product-analytics/paths) and [URL masking](https://posthog.com/docs/data-pipelines/transformations/template-url-masking). These sources explain SDK/data capabilities, not this project's actual historical payloads.

### Operational confirmations, not established violations

- Three-year assessment retention is a published commitment, but no assessment-purge handler, Cron Trigger or scheduled deletion was found in the reviewed Worker/scripts. A manual process may exist; identify its owner, schedule and evidence before renewing the promise. Code search alone does not establish that any record exceeded its permitted retention.
- Confirm who monitors `privacy@paice.work`, performs deletion/unsubscribe requests and meets the stated response deadline. New delivery records are not linked to the delivery address; the run ID is the practical lookup key. Do not imply that all record holders can be notified through a retained email address.
- Have the owner or qualified reviewer confirm the lawful-basis and transfer assertions, processor arrangements, and the broad cookie/identity language. The technical review does not establish those contractual or jurisdictional facts. IP/online identifiers can be personal data; absence of requested name fields is insufficient to decide otherwise. [European Commission definitions](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/application-gdpr_en).
- The paired [terms](/Users/snap/Git/ai-posture/docs/terms/index.html:159) now remove both the no-personal-data absence claim and the related jurisdiction premise. Their v0.2.0 preparation date and sitemap entry match the privacy revision. Any legal approval of the revised terms remains an owner/reviewer decision.
- Edge cookies, PostHog project-side settings, provider retention/deletion settings and processor agreements were not inspected. The repository's memory-only analytics configuration is verified; an all-provider no-cookie/no-identification guarantee is not.

### Proposed factual copy

These initial review drafts explain the proposed corrections. The current local policy now contains the refined wording described in the remediation checkpoint. These drafts are not an approval of legal bases or publication.

Completed-assessment records: "When you request email delivery, we store the estimate artifact under a random run ID. It includes the scope label if one is present. Text supplied in an artifact can identify a person, team or organization. For new requests handled by the updated delivery service, we do not add your delivery email address or request IP to the assessment record. Separate request-security records are described below."

Email delivery: "The updated service sends the artifact before writing the assessment record. A send rejected by the provider creates no assessment record. If the provider accepts the message but record storage fails, the message may still arrive without a saved record. Records created by the previous implementation are a separate historical-data review; this change does not by itself erase them."

Security/backend: "The assessment answers are processed in the browser during the flow. If you request artifact delivery, the estimate artifact and delivery address are sent to the Cloudflare Worker, and the address, message and attachment are passed to Resend. D1 stores the assessment artifact, newsletter subscription data and separate abuse-control records. Those controls use request IP buckets and keyed recipient identifiers; they are not used for analytics identification."

Analytics: the local sanitizer and its policy disclosure are now implemented and tested as described above. Keep the eight disclosed event types and their stated purpose. Retained paths can still contain identifying text; no blanket anonymity claim is made.

Publication metadata: local privacy and terms v0.2.0 now distinguish the October 27 preparation date from effectiveness on publication. Capture the actual publication timestamp in rollout evidence; do not interpret the preparation date as publication or renewed counsel approval. Site release v1.1.3, normative spec v1.1.1 and estimator engine 1.1.0 need no change solely for this review. No tag, package release or GitHub Release is proposed.

## Verified provider preflight

| Resource | Observed state |
|---|---|
| Worker / route | `ai-posture-worker`, `https://api.aiposture.org` |
| Account | `d0f3df068c5873f126e83591246f1b29` |
| Active deployment | `70818932-eafa-404d-b782-16570245e9ab` |
| Active Worker version | `64243110-2e25-4db9-9ee6-2ec070d0e0a1`, 100% traffic; deployment timestamp 2026-05-28T03:07:09.528611Z |
| Source mapping | Provider version metadata has no verified Git-commit mapping. A version ID is not evidence that its source equals a repository commit. |
| Live DB binding | `DB` points to `ai_posture`, ID `299cdd40-a0d9-452e-8b89-7b23047a64e3`; matches the repository configuration. |
| Secret metadata | `RESEND_API_KEY` is present as a secret binding; its value was not read. Public origin/from variables match the local config. |
| Live schema | `newsletter`, `rate_limit` and `assessments` exist with the expected legacy columns/indexes. `mail_cooldown` and its expiry index are absent. |
| Schema-read evidence | SQLite schema metadata only; `changes: 0`, `changed_db: false`, `rows_written: 0`. No application records or raw addresses were read. |
| Recovery | D1 catalog says `version: production`; Time Travel bookmark retrieval succeeded. Refresh the bookmark immediately before any later DDL. The current bookmark is recorded in the release-state evidence, not authorized for restoration. |
| Access anomaly | `wrangler d1 info` returned authentication code 10000. Catalog, schema query and Time Travel reads succeeded. Do not infer that all D1 access is unavailable or start a new login solely from that isolated endpoint failure. |
| Pages controls | Actions publication, app-bound required `test` check with strict/admin enforcement, and main-only `github-pages` approval by `snapsynapse`; administrator bypass disabled. Own-run approval remains allowed. |

Wrangler 4.153.0 was used from a secret-free temporary config workspace, with interactive login disabled. The raw provider evidence is under `/private/tmp/ai-posture-rollout-review-zulsf5kw/`. The D1 catalog's `num_tables: 0` conflicts with the successful schema query; the actual schema query controls the table inventory. Do not treat that catalog count as an empty database. No new access token or secret was requested, extracted or changed.

Existing evidence at `d89993f`: CI root 166 passes plus one expected ignored-local-config skip, Worker 45 passes, SHACL 26 passes; local generated-site and Worker dry-run builds passed. Argon passed the full committed diff. Any future source correction must receive appropriate tests, builds, exact-head CI and a fresh required simplicity review; do not transfer this acceptance to a changed commit.

## Prepared schema artifact

[Additive SQL](/Users/snap/Git/ai-posture/audits/2026-10-27-mail-cooldown-additive.sql) contains only the two existing CREATE statements for `mail_cooldown` and `idx_mail_cooldown_expiry`, extracted unchanged from [Worker schema](/Users/snap/Git/ai-posture/worker/schema.sql). SHA-256: `201fb608500f549b4cb634a644b6beaefb5e0bde630698d4a225b78fa4e6530d`. Worker Git tree reviewed: `caee367522a2ec38d9d05e0aa54f812e2530d595`.

No migration framework, data backfill, email-column removal or old-record deletion is introduced. The statements are idempotent for the expected schema. `IF NOT EXISTS` does not repair an incompatible pre-existing table/index; stop on any definition mismatch. Leave all existing tables, rows, nullable assessment email values and confirmed subscriptions intact.

## Ordered rollout, not execution authorization

1. Review the local PRIV-001 through PRIV-005 corrections and record the operational confirmations. Their privacy/terms/sitemap changes and analytics sanitizer are implemented and locally verified. Keep the two original commits intact. Sam has authorized one new local commit after the complete staged review; push and rollout remain separate gates.
2. Pin the final approved commit and verify source, full suites, SHACL, site generation and Worker bundle. Reconcile main/PR refs, fresh CI and simplicity evidence. Obtain explicit merge, schema, Worker and Pages-publication authority before their respective operations. The local-commit request does not authorize push or production execution.
3. Plan a short pause for new `POST /api/newsletter` and `POST /api/deliver` requests. This is a recommendation, not a configured rule. Choose and verify the pause mechanism and its bounded failure response before executing the cutover; inspect in-flight mail work. The existing read-only plan does not authorize changing Cloudflare traffic controls. If a pause is unacceptable, use a separately approved transition notice/sequence; do not assume two hosts update atomically.
4. When merge is separately authorized, retain the original commits with a merge commit and let required main CI finish. Keep the Pages deployment waiting for `snapsynapse` approval. Merging does not authorize clicking that approval. Confirm the gate is still installed and main-only.
5. With new mail requests paused, capture the current Worker version/bindings, fresh D1 schema and fresh recovery bookmark. Reconfirm the target DB ID and draft SQL hash. Apply only the two additive statements, then verify the table's NOT NULL columns, composite primary key and expiry index. No historical-data cleanup is part of this step.
6. Deploy the reviewed Worker from a clean export of the approved commit, using the existing lockfile/toolchain and no copied `.dev.vars` or other ignored credentials. Reuse the existing remote secret. Route 100% to the reviewed new version and record the provider version/deployment IDs, source tag and bundle evidence. A mixed old/new mail rollout would not consistently enforce the new controls.
7. While the mail pause remains active, verify the new version/bindings and health/CORS/non-sending behavior. `/healthz` alone proves liveness, not the mail implementation. Then approve the exact intended Pages run, verify the published privacy/terms revision, preparation dates and sitemap, and record the actual publication timestamp, and inspect the new frontend/artifact engine metadata. Compare source/artifact hashes where direct identity is available; distinguish any Cloudflare HTML transformation from a source mismatch.
8. Resume mail requests only after the matching Worker and disclosures are verified. A backend-first rollout with mail left live would introduce recipient-hash processing before the new notice, while a frontend-first rollout would publish new handling claims before the old backend changes. The planned pause avoids relying on either mismatch.
9. Run the separately authorized controlled-mail checks below, observe errors/counters without logging addresses or bodies, and retain the operator's accept/rollback decision. Leave privacy request handling and retention follow-up owned, rather than inferring completion from a green test run.

The pause mechanism, owner decisions, final corrected commit and actual publication timestamp are still open. This is a concrete SQL/Worker plan, not a declaration that production execution is ready. A different notice sequence is possible after explicit review; no zero-downtime or atomicity claim is made.

### Planned production commands

These commands have not been run against production. They are for the later authorized window only. Each block runs in a subshell that stops on a failed directory change or command; failures do not close the invoking interactive shell. Regression tests execute these exact blocks only with inert Wrangler stubs. Prepare a clean Worker folder from the final approved commit, install its locked dependencies, exclude ignored credential files, and verify its config/binding IDs before using it. Re-read deployment and recovery state at execution time; today's version/bookmark may become stale.

Read-only preflight in that folder:

Replace: RELEASE_WORKER_DIR -> absolute path to the clean Worker folder exported from the final approved commit.
Customize
```
(
  set -e
  cd "RELEASE_WORKER_DIR"
  CI=true node_modules/.bin/wrangler deployments status --json
  CI=true node_modules/.bin/wrangler d1 list --json
  CI=true node_modules/.bin/wrangler d1 time-travel info ai_posture --json
)
```
After schema-write authorization and SQL-hash verification, the noninteractive additive apply is:

Replace: RELEASE_WORKER_DIR -> absolute path to the same approved clean Worker folder.
Customize
```
(
  set -e
  cd "RELEASE_WORKER_DIR"
  CI=true node_modules/.bin/wrangler d1 execute ai_posture --remote --file /Users/snap/Git/ai-posture/audits/2026-10-27-mail-cooldown-additive.sql --yes
)
```
Before deploying the Worker, verify the new schema without reading application rows:

Replace: RELEASE_WORKER_DIR -> absolute path to the same approved clean Worker folder.
Customize
```
(
  set -e
  cd "RELEASE_WORKER_DIR"
  CI=true node_modules/.bin/wrangler d1 execute ai_posture --remote --command "PRAGMA table_info(mail_cooldown); PRAGMA index_info(idx_mail_cooldown_expiry);" --json
)
```
After Worker-deployment authorization, deploy from that approved export. Supply its full approved source commit as the version tag; the command makes the deployment active, so it is a separate write gate.

Replace: RELEASE_WORKER_DIR -> absolute path to the same approved clean Worker folder.
Replace: APPROVED_SOURCE_COMMIT -> full commit SHA of the approved source exported into that folder.
Customize
```
(
  set -e
  cd "RELEASE_WORKER_DIR"
  CI=true node_modules/.bin/wrangler deploy --tag "APPROVED_SOURCE_COMMIT" --message "Reviewed AI Posture security remediation"
)
```
Re-read deployment status and binding metadata afterward. Do not run `secret put`, change the D1 ID or rotate the Resend secret as an incidental deployment step. Rotation changes recipient HMAC keys and needs a separate decision.

### Controlled verification

- Obtain explicit authorization for the exact operator-controlled recipient address(es) and message count before sending anything. No production email was sent in this review.
- Validate one current 1.1.0 estimate and the captured valid 1.0.0 legacy fixture. Use two approved owned addresses or respect the ten-minute recipient cooldown. Check both provider acceptance and actual inbox receipt separately, and verify the stored test records lack delivery email and retain the unchanged attachment payload. Query only those owned test run IDs.
- Use one approved owned newsletter address to verify issuance, uniform pending response on a suppressed retry, the original UTC deadline, and one-time confirmation. Do not print confirmation tokens. Existing confirmed subscriptions must remain confirmed; pending tokens older than 24 hours will no longer confirm after this security change and require resubscription.
- Keep planned attempts below the five-per-IP/per-route hourly bound and the shared global budget. Do not drive extra public assessment completions to test or recalibrate the model. Local tests already cover provider rejection, post-send storage failure, concurrency and expiry boundaries; do not induce live provider/DB failures to repeat them.
- Verify the public privacy page, assessment page, canonical URLs and sitemap after approval. The earlier web-tool privacy response was cached and is not a new hosted-byte attestation.

## Recovery and stop conditions

Stop on a failed gate, wrong account/DB ID, incompatible schema, lost recovery access, missing secret binding, unexpected traffic split, invalid new/legacy delivery, new privacy/retention contradiction, or a publication artifact that cannot be tied to the approved source. Keep the mail pause and Pages hold in place while investigating.

Prefer a reviewed roll-forward. The captured prior Worker version is a provider identity, not a verified hardened Git artifact. A rollback can restore earlier privacy, token-expiry and sending-limit defects; do not assume it preserves this remediation. If an emergency rollback is explicitly authorized, re-read the current/prior version IDs, review that risk and privacy-copy coordination, then use the verified prior-version target. It is `64243110-2e25-4db9-9ee6-2ec070d0e0a1` at this checkpoint, not an unconditional future command target.

Keep the additive table/index during a Worker rollback. Do not drop columns/tables or restore all of D1 to undo two additive CREATE statements. Point-in-time restoration can discard legitimate writes and cancel in-flight work; it requires separate explicit authorization and a reviewed recovery point. No restore command is included for accidental execution.

## Sources and remaining authority

Provider behavior was checked against the installed Wrangler help plus [D1 commands](https://developers.cloudflare.com/d1/wrangler-commands/), [Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/), [Worker commands](https://developers.cloudflare.com/workers/wrangler/commands/workers/) and [Worker rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/). These references support command semantics, not a claim that a deployment or restore occurred. [Resend's policy](https://resend.com/legal/privacy-policy) is a provider reference, not evidence of this account's retention or processor-contract configuration.

This precommit snapshot accompanies the authorized local privacy commit: eight modified source/test files, one new command-block regression test and four review/rollout artifacts, all staged and reviewed. The SQL draft remains unapplied. Git history identifies the eventual commit; this snapshot does not embed its own commit ID. No push, merge, schema application, traffic pause, Worker deployment, Pages approval, secret change, personal-row query or email send is authorized or performed by this local-commit step. Production decisions remain with Sam.
