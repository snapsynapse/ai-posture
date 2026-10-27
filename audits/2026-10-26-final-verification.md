# Final local verification and commit readiness

Date: 2026-10-26, America/Denver. Scope: actual SHACL execution, generated-site build, Worker bundle, clean-file suites and final diff review. Verification only: no product code, tests, dependencies or lockfiles were changed in this pass. This report and the audit-context pointer are the only new repository edits. No staging, commit, push, schema application, provider-setting change or deployment was performed.

Verdict: the builds and regression suites pass, but the patch is not ready to be called fully verified for commit. R4 below is a confirmed SHACL aggregate-validation gap. Resolve it and rerun the affected checks before final commit review. Push and deployment also retain the separate configuration and schema prerequisites below.

Follow-up: R4 is now corrected locally. The runtime regression suite, both Node suites and both build checks pass; see [R4 remediation and current commit readiness](2026-10-26-r4-remediation.md). The findings below preserve the verification checkpoint that prompted the fix.

Reviewed HEAD: `696b42bb2c1d248e3090035068c72d645ad9137e`. Branch: `security/black-october-npm-audit`, without an upstream. Fetch succeeded; the branch is one commit ahead and zero behind `origin/main` at `ae13413642bdb99c0350ea48be4621e975b952be`. The existing unpushed dependency commit remains separate from the unstaged remediation.

## R4: SHACL accepts invalid report aggregates

Priority: P2, correctness and validator interoperability. Locations: [optional report aggregate fields](/Users/snap/Git/ai-posture/docs/schema/earl/v0/shapes.ttl:38), [minimum query](/Users/snap/Git/ai-posture/docs/schema/earl/v0/shapes.ttl:60), [published coherence contract](/Users/snap/Git/ai-posture/docs/schema/earl/v0/profile.md:82) and [JavaScript checks](/Users/snap/Git/ai-posture/scripts/validate.js:96).

The SHACL graph parses, passes Meta-SHACL, and rejects the tested contradictory-scope, missing-evidence and criterion-mismatch cases. Its report-level constraints nevertheless accept four invalid aggregate variants that the JavaScript reference validator correctly rejects. A consumer using the published SHACL can consequently accept a report that the repository's other validator and published profile reject.

The `postureLevel` property is optional regardless of scope. The minimum query requires a declared value to match before it can report a violation, and does not reject a declared value when there are no in-scope levels. `constrainingVector` has only an enum check, without a relationship to the actual minimum or a prohibition for all-N/A reports.

Reproduction uses the checked-in `docs/schema/earl/v0/example.jsonld`. For RDF parsing, replace only its remote `@context` URL with the checked-in context object's `@context` value. This prevents network access and tests the repository's own mapping. Each row starts from a fresh example. The example's overdue next-review date produces a JavaScript warning, not a validation error.

| Mutation | Required result | SHACL result | JavaScript result |
|---|---|---|---|
| Delete report `postureLevel`, retaining the original three in-scope assertions | Reject | Accept | Reject |
| Delete report `constrainingVector` | Reject | Accept | Reject |
| Replace report `constrainingVector` with `["People"]`; Regulation remains the unique minimum | Reject | Accept | Reject |
| For every assertion set `inScope` false, set outcome `earl:inapplicable`, delete result `level`, `levelName` and `source`; claim report level 5, name `Engineering` and constraining vector `People` | Reject | Accept | Reject |

These aggregate omissions also reproduce against HEAD's original SHACL. They are inherited gaps, not regressions introduced by this patch. The new all-N/A JavaScript rule and accompanying profile text now make that disagreement explicit; the existing report-level SHACL was not completed alongside them. The previous R1-R3 corrections remain valid.

Required correction: enforce the aggregate's conditional presence and absence by scope, the minimum value, and the complete constraining-vector set in SHACL. Preserve valid mixed-scope and all-N/A reports. Add runtime SHACL regressions for the false accepts and positive cases, rather than relying exclusively on Node tests that execute the JavaScript validator. Include any other aggregate-name constraints promised by the profile when establishing parity. No product correction or waiver was made during this verification pass.

## Verification evidence

Work ran in a temporary copy of all tracked and intended untracked repository files. Ignored credentials, local agent configuration and repository metadata were excluded. The installed Worker dependencies were accessed through a symlink; no dependency installation modified the repository. File hashes confirmed that the workspace's source, tests and existing reports stayed unchanged during verification.

| Check | Result |
|---|---|
| `npm run build` in the temporary repository copy | Pass. Both `build-spec.js` and `build-criteria.js` complete. Every tracked/copied file remains byte-identical after regeneration, including the generated spec, criteria, registry and rubric files. |
| Installed Wrangler 4.153.0, `deploy --dry-run --outdir` in the temporary Worker copy | Pass. Bundle 22.88 KiB, gzip 6.62 KiB; expected D1 and public configuration bindings. No remote deployment or database operation. |
| Fresh root `npm test` in the clean copy | Pass: 166 passed, zero failures, one expected skip for absent ignored `.agents` configuration; 167 tests total. |
| Fresh Worker `npm test` in the clean copy | Pass: 45 passed, zero failures or skips. The root suite already includes these Worker tests; counts are not additive. |
| Previous workspace suites, with unchanged source/test hashes | Still applicable: 167 root passes and 45 Worker passes, zero failures. |
| SHACL Turtle parse and Meta-SHACL | Pass using pySHACL 0.30.1 and RDFLib 7.6.0. |
| SHACL/JavaScript differential cases | Fail: nine of thirteen decisions match the expected result; four invalid aggregates are accepted only by SHACL. No validator engine exception occurred. |
| `git diff --check` and staging-area inspection | Pass; whitespace clean and staging area empty. |
| Independent read-only final diff review | No additional confirmed findings beyond R4. No accidental deletions, missing implementation files or unrelated dependency changes found. |

Node was v26.12.1; npm was 11.20.0. The SHACL validator and its pinned installation were confined to a temporary Python 3.9.6 environment. No remote JSON-LD context or evidence URL was fetched by the validation harness. The repository has no new Python dependency.

The thirteen differential cases were: shipped example, wrong minimum, missing aggregate, missing evidence, empty evidence array, wrong criterion IRI, in-scope/inapplicable contradiction, out-of-scope/level contradiction, valid mixed scope, valid all-N/A, all-N/A with an asserted aggregate, missing constraining vector and wrong constraining vector. All three valid cases passed both validators; six of the ten invalid cases failed both. The remaining four are listed under R4.

Primary tool references: [pySHACL release and validation options](https://github.com/RDFLib/pySHACL), [Wrangler dry-run options](https://developers.cloudflare.com/workers/wrangler/commands/workers/). The pass/fail statements above are local execution results, not claims inferred from those references. Temporary command logs and the detailed SHACL results were retained under `/private/tmp/ai-posture-final-*` and `/private/tmp/ai-posture-shacl-*` for this review session.

## Commit scope and publication prerequisites

The intended commit remains `fix: harden assessment delivery and validation`, after R4 is corrected and the final diff is reviewed again. Include the new request reader, abuse/security tests, analytics/workflow tests, captured legacy fixture, additive schema, paired documentation and audit records. These untracked implementation files are required for a clean checkout. Keep `.dev.vars`, ignored local configuration, dependencies and temporary verification artifacts out of the commit. Preserve the existing dependency commit separately. No files have been staged.

Before an eventual push or deployment:

1. Resolve R4, run actual SHACL regressions and both suites, then inspect the exact staged diff when commit/staging is authorized. Do not treat syntax-valid SHACL or passing JavaScript tests as aggregate-rule parity.
2. Reconcile GitHub Pages publication under separate account-setting authority. A fresh read reports `build_type: legacy`, source `main:/docs`, status `built`, and `https_enforced: false`. Main's branch-protection endpoint reports `Branch not protected`; the effective branch-rules endpoint returns an empty array. The prepared Actions dependency therefore does not gate the current branch-source publishing path. The HTTPS setting is a provider observation, not a conclusion about the public Cloudflare edge. No setting was changed.
3. Apply the additive `mail_cooldown` table/index before activating the new Worker. Do not remove the compatible nullable assessment email column or change old production rows as part of this preparation. Tests exercised only disposable SQLite databases.
4. Retain the tested old-client compatibility policy during rollout. Exact version 1.0.0 estimates with valid common semantics remain deliverable; new/unknown engine versions retain zero slot-zero mass for in-scope vectors. The fixture and end-to-end delivery/storage regression are included. Cached or already-open clients cannot be replaced atomically by publishing two hosts.
5. Review the updated privacy text and its publication metadata before publication. Its displayed effective date remains May 29, 2026. This record does not establish human/legal approval or choose a replacement date.
6. If a PR is later requested, run the required cross-vendor simplicity gate against the eventual committed diff. No PR or paid model review was executed here. After an authorized rollout, verify hosted-byte identity, Worker health and the intended behavior separately from this local evidence.

Current delivery state: the preexisting dependency commit is committed but unpushed; all audit/remediation work remains local, unstaged and uncommitted. Nothing was pushed, deployed, migrated or published by this pass.
