# Local privacy remediation diff review

Date: 2026-10-27, America/Denver. Baseline: `d89993ffd30edaf805e84e88cdc9e08420218d94`. Branch: `security/black-october-npm-audit`, synchronized with its upstream and two commits ahead of main after a successful fetch. Scope reviewed: all eight modified source/test files and all three existing untracked rollout artifacts. No product code or tests were changed during the initial review. The subsequent authorized remediation and fresh validation are recorded below.

Latest verdict: all three findings are corrected locally and regression-tested. Root 179, separate Worker 45 and SHACL 26 tests pass, as do the site build and Worker dry-run. The initial not-ready verdict and evidence are retained below as the reason for the fixes. This is the precommit checkpoint for the subsequently authorized local commit. The complete 13-file staged scope has been reviewed; no production operation was performed.

## Authorized remediation and closure

| Finding | Local correction | Regression proof |
|---|---|---|
| PRIV-R1 | Drop the entire `$session_entry_*` namespace from permitted events. Preserve normal URL sanitization, event names, assessment metrics and session identifiers. The privacy copy now describes outgoing attribution filtering and explicitly discloses entry-property omission. | Two new tests cover SDK-shaped entry URL/path/referrer/domain/host/campaign/search/click fields on all eight allowed events, plus unknown future entry fields with varied value types. |
| PRIV-R2 | Remove the unsupported personal-data absence claim while retaining the acceptable-use prohibition. | One paired terms consistency test rejects the old denial and retains the prohibition. |
| PRIV-R3 | Wrap each of the four production command blocks in a subshell with `set -e`, before directory selection or Wrangler invocation. | Three shell/stub tests cover invalid paths, valid paths with spaces, and stopping after the first failed preflight under sh, bash and zsh. |

Five focused failures reproduced these findings before the fixes; all 21 focused tests now pass. The six new tests are included in the root suite's 179 passes. The Worker suite also passed separately (45); actual SHACL passed (26); generated-site build passed with no generated diff; Wrangler 4.153.0 dry-run passed from a secret-free copy at 22.88 KiB / gzip 6.62 KiB. No provider call, email or production database operation is used by the shell/analytics regressions.

Current logs and the nine-file source/test manifest plus tested-command digest are in `/private/tmp/ai-posture-privacy-r1-r3-verification-a8cm_nmc/`. Manifest SHA-256: `19a99ad29424d337005fe00d089c47f238b4a75d05fabad99f05b42f6f1e171e`. Only the four extracted command blocks are hashed from the rollout plan, so status/prose updates do not invalidate the tested command fixture. Worker source, authoritative schema, SQL draft, lockfiles, generated pages and both existing commits are unchanged. Privacy/terms v0.2.0 preparation metadata still matches October 27 and remains distinct from publication.

The final local diff was reviewed for scope, remaining instances of the three findings, command guards and artifact status consistency. No remaining local blocker was found for these three findings. The complete staged scope has now been reviewed for the authorized local commit; merge and production authority, owner operational confirmations, a verified pause mechanism and fresh committed-head CI/simplicity remain separate gates.

## Initial findings, now corrected locally

### PRIV-R1 [P1]: SDK session-entry properties bypass the sanitizer

Location: [URL field selection](/Users/snap/Git/ai-posture/docs/assess/index.html:300) and [campaign-prefix handling](/Users/snap/Git/ai-posture/docs/assess/index.html:328).

The outgoing hook sanitizes current/initial URL fields but leaves `$session_entry_url`, `$session_entry_referrer`, `$session_entry_pathname`, corresponding domain fields, and `$session_entry_utm_*` / ad-click properties untouched. A local invocation of the real inline hook retained a test-only entry URL containing credentials, an email query value and a fragment, a full referrer path/query/fragment, and entry campaign/click values. No event was transmitted.

This is an SDK-generated path. The [SessionPropsManager source](https://github.com/PostHog/posthog-js/blob/main/packages/browser/src/session-props.ts) derives entry values independently, and [event construction](https://github.com/PostHog/posthog-js/blob/main/packages/browser/src/posthog-core.ts) merges them into event properties. `save_campaign_params: false` and `person_profiles: 'never'` do not remove these session-entry event properties. The public script captured at the initial review from the assessment's configured [asset URL](https://us-assets.i.posthog.com/static/array.js) contains the same entry-property generation and event merge. It was downloaded as inert source, not executed. SHA-256: `8086fbcfbca96945d256858be296c5bd4e06ea3a600e0981cfa2461624f475ed`, 335908 bytes; version candidate in the asset: 1.438.24. No historical event contents or actual live user traffic were inspected.

Impact: after publication, an assessment URL containing sensitive query/fragment data can still be sent through the session-entry copy even though the normal URL is cleaned. Session-entry campaign values can also contradict the new campaign-collection disclosure. The existing tests omit that namespace, so their green result does not close PRIV-002.

Required correction: cover the complete SDK session-entry URL/path/referrer/domain and campaign/search/click namespace, either by sanitizing it consistently or deliberately dropping it. Add regressions using SDK-shaped events, preserving allowed events and intended metrics. Reconcile the policy and reopen/close the rollout completion evidence only after the fix passes. This is a coverage gap in the new fix, not evidence of a production leak or a reason to weaken the disclosure.

### PRIV-R2 [P2]: revised terms still deny the existence of personal data

Location: [acceptable-use sentence](/Users/snap/Git/ai-posture/docs/terms/index.html:159).

The v0.2.0 terms still say, "The service is designed so that no such data exists" immediately after referring to personal data about other users. The new privacy policy correctly acknowledges newsletter addresses, request IP buckets, potentially identifying artifact text and possible historical address-linked records. Republishing the revised terms with the remaining denial leaves the paired notices contradictory.

This sentence predates the local diff; it is a residual issue in the expressly requested review of the complete revised privacy/terms package. Keep the prohibition on extracting other users' data, remove the unsupported absence guarantee, and include the assertion in the policy consistency regression coverage. The new jurisdiction note does not correct this separate sentence.

### PRIV-R3 [P2]: production command blocks continue after a failed directory change

Initial finding location: the [planned production commands](/Users/snap/Git/ai-posture/audits/2026-10-27-privacy-and-rollout-plan.md:108), now guarded; the preflight and D1 blocks originally had the same unguarded pattern.

Each copy/paste block runs `cd` on one line and Wrangler on the next without a failure guard. If the customized release-folder path is invalid, an interactive shell continues in its current folder. If that folder contains another Worker checkout and Wrangler installation, the deployment can execute different source/configuration despite the plan's approved-export requirement. The schema block can similarly select a database using the wrong folder's configuration.

A local reproduction used the exact deployment block with a nonexistent release folder and a harmless stub executable in a different temporary folder. `cd` failed, the stub still ran from that folder, and the block returned success. No actual Wrangler/provider command ran.

Required correction: make every documented command block fail closed before invoking Wrangler, using an explicit successful-directory guard or a guarded subshell. Keep the target account/DB, approved-source and SQL-hash checks in the sequence. Add a lightweight shell/stub regression showing that invalid release paths never invoke any subsequent command; no live deployment or database write is needed to prove it.

## Evidence at the initial review checkpoint

- At the initial review, all eight source/test files exactly matched `/private/tmp/ai-posture-privacy-verification-1ya590tr/verified-source-hashes.json`. Manifest SHA-256: `eed14a91dd4340927c529abf69be4559791fbbadd8e8d0498ff5e5303b7bdcf3`. Those root 173-pass, separate Worker 45-pass, SHACL 26-pass, site build and Wrangler dry-run results applied at the initial review. The remediation above now has fresh results for the changed source/test bytes; the old manifest does not describe the corrected source.
- The sanitizer correctly cleans the current/initial URL fields tested, strips credentials/queries/fragments, reduces covered referrers to origins, drops invalid/non-web inputs, preserves the event allowlist/metrics, and removes covered person-update and campaign fields. No additional functional regression was found in those paths.
- Privacy and terms v0.2.0 visibly distinguish October 27 preparation from effectiveness on publication. Their datetime values and sitemap lastmod entries align; the assessment sitemap date is updated. This does not establish actual publication or renewed counsel approval. Original INTENT approval history remains unchanged.
- The additive SQL is an exact two-statement extraction from the existing Worker schema. SHA-256 remains `201fb608500f549b4cb634a644b6beaefb5e0bde630698d4a225b78fa4e6530d`. An in-memory SQLite check passed twice and verified NOT NULL columns, composite primary key and expiry index. No backfill, historical deletion or schema mutation was performed.
- Release-state JSON has valid structure, unique step IDs and separate prior-head CI/simplicity evidence. The initial review reopened privacy completion; the authorized fixes above now close the three findings with fresh evidence. Local suite success and production readiness remain distinct facts. Worker/schema/lockfile and generated spec/criteria files have no local diff. Whitespace checks pass.
- The rollout order, explicit write/approval gates, legacy-client verification, retained additive schema and roll-forward preference are appropriate. Provider IDs/bookmarks are dated preflight evidence and must be refreshed during an authorized rollout. The original deployment source remains unmapped to a verified Git commit.

## Commit and rollout readiness

Before commit: the three corrections, missing regressions, both suites/build gates and rollout-state reconciliation are complete locally. Sam authorized staging and one new local commit. The exact 13-file staged scope includes the new command test and all four review/rollout artifacts; its reviewed source/test and command bytes match the passing verification manifest. Keep the dependency commit and existing remediation commit separate. Do not stage ignored credentials, dependencies, caches, provider downloads or temporary verification files.

Before merge/publication/activation: obtain owner confirmation for retention/rights handling and provider/legal assertions, select and verify the mail-pause mechanism, pin the corrected committed source, run fresh exact-head CI and the required simplicity review, then obtain the respective merge/schema/Worker/Pages authority. These execution prerequisites are separate from the three local commit findings.

This report records the initial findings, authorized closure and staged review before the local commit. The staged candidate comprises eight tracked source/test modifications, one new command test and four review/rollout artifacts. The existing two commits are unchanged and already pushed. This precommit snapshot does not embed its own eventual commit ID; Git history records that outcome. Push, merge, schema application, traffic pause, deployment, secret changes and mail sends remain outside the authorization. Additional inert SDK and stub-proof evidence is under `/private/tmp/ai-posture-local-diff-review-kb609rvw/`.

## Staged review checkpoint

The index contains exactly the intended 13 regular files and no unrelated files, ignored credentials, dependencies or temporary provider evidence. The nine source/test hashes and four extracted command-block hashes match the successful local checks. SQL is still an exact source extraction and passes the repeat-application/table/index check in memory. Staged whitespace checks pass; Worker code, authoritative schema, lockfiles and generated outputs are unchanged. No blocking staged-diff finding remains. Commit subject: `fix(privacy): sanitize analytics and align notices`.
