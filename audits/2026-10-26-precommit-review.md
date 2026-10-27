# Complete local diff review and publication readiness

Date: 2026-10-26, America/Denver. Mode: review and preparation only. Product code was not edited during this pass. No staging, commit, push, provider configuration change, schema application, build, or deployment was performed.

Follow-up: R1-R3 are now corrected locally with regression evidence in [the review-fix record](2026-10-26-review-fixes.md). The findings and readiness assessment below preserve the review checkpoint that prompted those fixes. Deployment verification and external configuration prerequisites remain pending.

Reviewed base: `696b42bb2c1d248e3090035068c72d645ad9137e`, including its existing dependency update relative to fetched main `ae13413642bdb99c0350ea48be4621e975b952be`. The branch remains `security/black-october-npm-audit`, one commit ahead of main, with no upstream. The review covers 25 modified tracked files and eight untracked audit/source/test files, 33 files in total before this review note. No staged files or accidental deletions were found. All changes match the authorized audit/remediation scope.

Readiness: resolve the findings below before treating the patch as ready for a final commit. Push and deployment remain unexecuted. The deployment prerequisites are separate from the code corrections.

## Findings

### R1: Analytics misidentifies the new estimator as engine 1.0.0

Priority: P2. Location: [completion analytics](/Users/snap/Git/ai-posture/docs/assess/js/app.js:335), [start analytics](/Users/snap/Git/ai-posture/docs/assess/js/app.js:445), [new artifact version](/Users/snap/Git/ai-posture/docs/assess/js/app.js:784).

The patch deliberately separates the saved-answer draft format from the computation engine and exports `B.VERSION` (1.1.0). Start and completion analytics still use `state.version`, which remains the 1.0.0 draft format. New-engine outcomes are therefore attributed to the old version, mixing model versions in the observations intended for later review or recalibration.

Reproduction: run the current app through the existing runtime test harness with a completed state. The JSON artifact reports version 1.1.0, while its `assessment_completed` event reports version 1.0.0 and current per-vector results. This is a consequence of the combined changes, despite both relevant individual tests passing.

Correction: use the engine version consistently for model-dependent analytics, retaining any draft-format version under a distinct field only if needed. Add an end-to-end assertion comparing artifact and completion versions, including restored drafts. Do not change the old draft-loading compatibility merely to rename this metadata.

### R2: The stricter Worker rejects valid estimates from already-open old clients

Priority: P2, rollout compatibility. Location: [new zero-mass restriction](/Users/snap/Git/ai-posture/worker/src/deliver.js:123).

The new Worker requires an in-scope posterior's slot zero to be exactly zero. The old frontend can produce a perfectly usable level-3 estimate with a small positive slot-zero probability. Such an estimate passes the old Worker but fails the new Worker. Updating two hosting systems cannot atomically replace JavaScript already running in visitors' tabs; the old client renders a generic sending failure and encourages a later retry.

Reproduction: load `HEAD` versions of app.js/bayes.js into the runtime harness and select option index 1 for the completed bank answers. The artifact is version 1.0.0, aggregate Integrating, with slot-zero probabilities Infrastructure 0.000032, Regulation 0.000033 and People 0.000015. The old `isValidPayload()` accepts it; the current validator rejects it. This example does not use the invalid level-zero/Ignoring result from SEC-004.

Correction or explicit transition decision: preserve narrowly defined consistent legacy delivery, or provide a deliberate version/refresh transition and a tested deployment policy. Keep the new aggregate, name, scope and posterior consistency protections. Add an old-client/new-Worker compatibility regression so the intended behavior is reviewable. Current notes disclose stricter rejection but do not provide a working user transition for an already-open old client.

### R3: Resent confirmation emails overstate the remaining link lifetime

Priority: P3. Location: [plain-text confirmation copy](/Users/snap/Git/ai-posture/worker/src/newsletter.js:143), [HTML copy](/Users/snap/Git/ai-posture/worker/src/newsletter.js:153), [preserved issuance time](/Users/snap/Git/ai-posture/worker/src/newsletter.js:83).

The pending token and original `created_at` are intentionally preserved on unexpired resends, but every new email says the link expires after 24 hours. A resend at T+23h still expires at T+24h, one hour after that email. The expiry enforcement is correct; the newly added email copy does not explain the original-request deadline.

An independent SQLite/mock-mail reproduction sent at T0, resent at T+23h, and confirmed after T+24h. The second email carried the unchanged 24-hour statement although its remaining lifetime was shorter.

Correction: include the absolute expiry derived from original `created_at`, or explicitly anchor the 24-hour window to the original request. Preserve token reuse and expiry enforcement. Add a near-expiry resend test that checks the mail content against the enforced deadline.

## Verification and review limits

- Fresh root suite: 160 passing, zero failures.
- Fresh Worker suite: 40 passing, zero failures. Root already includes Worker tests; counts are not additive.
- `git diff --check`: clean. Staging area: empty. HEAD and fetched-main relationship: unchanged.
- Existing clean-file verification remains relevant: 159 root passes and one intentional ignored-local-context skip; all 40 Worker tests pass.
- An independent read-only reviewer rechecked the combined diff and reproduced R3. The parent independently reproduced R1 and R2 with actual old/current runtime code.
- No confirmed new authentication bypass, injection, secret exposure, or accidental deletion was found. This is bounded code-review evidence, not proof of production safety.
- The current lockfile matches the earlier zero-advisory npm result; dependencies were not edited during remediation or this review. Registry results were not refreshed in this pass.
- SHACL changes have only static review. An RDF/SHACL runtime is not installed here, so execution and differential agreement with the JavaScript validator remain unverified. Fresh generated builds, Wrangler bundling and Cloudflare execution were not performed.

The green suites do not cover R1/R2 or near-expiry resend copy. They should not be used to waive these findings.

## Prepared commit scope

Keep the existing dependency commit separate. The intended next commit should include the complete authorized remediation source, regression tests, additive schema, workflow changes, paired privacy/reference documentation, and audit records. No runtime credentials, ignored `.dev.vars`, node_modules, or temporary reproductions belong in it. New `worker/src/request.js` and `worker/tests/security-regressions.test.js` are necessary, as are the two new root test files; omitting untracked implementation files would break a clean checkout.

Prepared commit title, after the findings are resolved: `fix: harden assessment delivery and validation`.

Prepared description: Bound mail sending and JSON parsing, remove persistent delivery-email linkage, align estimator scope with the published contract, and enforce declaration/EARL/estimate consistency. Add token expiry, explicit analytics event controls, and a test dependency for Pages publication, with local regression evidence and rollout prerequisites recorded.

Do not mark this commit ready solely because the current 160 tests pass. Re-run the relevant proofs and both suites after any finding correction, then inspect the exact staged diff when staging is authorized. No PR is being prepared in this turn; the cross-vendor pre-PR simplicity gate has not been run and would need to review the eventual committed diff before a PR is created.

## Before an eventual push or deployment

1. Resolve R1/R3 and choose/test the R2 compatibility policy. Review the complete resulting local diff before authorizing commit or push.
2. Verify the changed SHACL with a real validator and representative positive/negative fixtures, and check generated artifacts and a local Worker bundle. These are verification gaps, not evidence that the existing files fail those tools.
3. Reconcile the last-observed GitHub Pages legacy main `/docs` publication with the new Actions dependency. A main push may publish through that legacy source before the tracked test job completes. Switch to the intended publication path and require the appropriate check under separate account-setting authorization. No settings were changed here.
4. Apply the additive `mail_cooldown` table/index before deploying the new Worker. Without it, the send routes fail closed. Preserve the compatible nullable assessment email column; do not infer authority to modify or delete old production records.
5. Use the tested compatibility policy to order Worker and Pages publication. Treat already-open clients and caches explicitly; “deploy together” is not an atomicity guarantee.
6. Review the paired privacy text and its dated publication metadata. The policy now discloses keyed recipient controls and a confirmation lifetime but retains its prior effective/version display. This is a publication-review item, not a legal conclusion or a request to invent human approval.
7. After an explicitly authorized deployment, verify the exact hosted artifacts, Worker health and intended behavior without unsolicited mail sends. Keep local tests, provider acceptance, delivered email, deployed-byte identity and human review as separate claims.

The release artifacts, tags, hosted site and production database are unchanged by this preparation. No publication step should be inferred from this review note.
