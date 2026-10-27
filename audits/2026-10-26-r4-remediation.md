# R4 remediation and local commit readiness

Date: 2026-10-26, America/Denver. Scope: the confirmed SHACL aggregate gap from [final verification](2026-10-26-final-verification.md). R4 is corrected locally and verified by runtime tests. No staging, commit, push, provider-setting change, schema application or deployment was performed.

Verdict: ready for final local commit review. No confirmed code findings remain from R1-R4 or the medium/low remediation review. Publication readiness remains conditional on the separate Pages, schema and privacy work below. This is bounded local execution and review evidence, not proof of production safety or remote CI success.

## Correction

The published [SHACL](/Users/snap/Git/ai-posture/docs/schema/earl/v0/shapes.ttl) now requires the in-scope aggregate and computes its minimum separately for each report. It rejects missing or extra constraining vectors, checks an optional aggregate name against the level, and prohibits level or constraining-vector claims when all assertions are N/A. An all-N/A aggregate name remains optional and may be `N/A`.

The four false accepts from R4 now fail: an omitted in-scope aggregate, missing constraining vector, wrong constraining vector and an all-N/A report claiming Engineering with a constraining vector. Valid mixed-scope and all-N/A reports continue to pass. Level ties require every constraining vector, and repeated assertions for one minimum vector do not require duplicate vector declarations. The JavaScript validator is unchanged by this tranche.

The [runtime suite](/Users/snap/Git/ai-posture/tests/shacl_runtime.py) executes the actual SHACL with pySHACL and RDFLib, uses the checked-in JSON-LD context without remote fetching, and compares representative valid/invalid decisions with the actual JavaScript validator. It also checks Meta-SHACL and multiple reports in one graph. The new suite reproduced ten failures in 26 tests before the shape correction; all 26 now pass.

The separate `npm run test:shacl` command requires the pinned test dependencies in `tests/requirements-shacl.txt`. It fails on missing dependencies or validator-engine errors; it does not skip these checks. Root and Worker Node suites retain their dependency-free execution. The prepared CI test job installs the Python test dependencies and requires the SHACL suite alongside both Node suites. README, the EARL profile, CLAUDE.md and the workflow regression test reflect this setup. The site, Worker, normative specification and release versions are unchanged.

## Verification

| Check | Result |
|---|---|
| Focused SHACL runtime regressions | 26 passed, zero failures. Covers the four reported false accepts, aggregate-name checks, tied/extra/missing vectors, all five aggregate levels, valid N/A variants, repeated assertions, multiple reports and retained scope/criterion/evidence checks. |
| Workspace root `npm test` | 167 passed, zero failures or skips. |
| Workspace Worker `npm test` | 45 passed, zero failures or skips. Root already includes these tests; counts are not additive. |
| Clean-copy root and Worker suites | Root: 166 passed, zero failures, one expected skip for absent ignored `.agents` configuration. Worker: 45 passed. |
| Clean-copy `npm run test:shacl` | 26 passed, zero failures. |
| Clean-copy `npm run build` | Passed. Generated spec, criteria, registry and rubric files remain byte-identical to the working tree. |
| Clean-copy Wrangler 4.153.0 `deploy --dry-run --outdir` | Passed. Worker bundle remains 22.88 KiB, gzip 6.62 KiB. No remote deployment or database action. |
| Workflow regression checks and whitespace | Passed; staging area remains empty. |
| Independent read-only adversarial review | All 26 runtime tests and additional aggregate, tied-vector, N/A/name and mixed-report cases pass. No confirmed bypass or valid-input false positive found in the RDF aggregate rules. |

Node was v26.12.1, npm 11.20.0, Python 3.9.6, pySHACL 0.30.1 and RDFLib 7.6.0. Python dependencies remained in the previously installed temporary environment, with no repository virtual environment or Node dependency change. CI is configured for Node 26 and Python 3.12; that remote job has not been run. The temporary verification copy excluded ignored credentials, local agent configuration and Git metadata. Source/test hashes remained unchanged while the gates ran; final report and profile-boundary documentation edits followed those checks.

SHACL validates RDF aggregate meaning, while JavaScript also validates compact JSON. An independently checked example, `postureLevelName: null` on an in-scope report, remains JavaScript-invalid but expands to omission of that optional RDF property. Repeated identical literal values likewise collapse into one RDF triple. No SHACL constraint can distinguish those serializations after expansion. These representation checks remain in JavaScript; the fix does not weaken them or claim universal byte-level agreement between the two input models. The profile now states this boundary explicitly.

RDFLib emits a deprecation warning from its own JSON-LD parser about `ConjunctiveGraph`. No test is skipped or failed because of it. Tool and dependency upgrades are outside this aggregate fix.

## Final diff and commit scope

Fetch succeeded before editing. HEAD remains `696b42bb2c1d248e3090035068c72d645ad9137e` on `security/black-october-npm-audit`, without an upstream, one commit ahead and zero behind `origin/main` at `ae13413642bdb99c0350ea48be4621e975b952be`. The existing lockfile-only dependency commit remains unpushed and separate from the unstaged remediation.

The R4 tranche changes only the EARL SHACL/profile, test runner and pinned test requirements, package test script, prepared CI job and its regression checks, paired developer documentation, changelog and audit records. It preserves all prior source changes and the valid old-client delivery compatibility. No unrelated edit, accidental deletion or missing implementation file was found in the final review.

Prepared commit title: `fix: harden assessment delivery and validation`.

Include the complete local remediation, additive schema, paired documentation, all new source/tests, the legacy estimate fixture and audit evidence. In particular, `worker/src/request.js`, the new Worker security tests, analytics/workflow tests and the two SHACL test files must be included. Keep ignored `.dev.vars`, local configuration, dependencies, Python caches and temporary verification files out. No paths have been staged; inspect the exact staged diff when staging and committing are authorized.

Before an eventual push or deployment, the existing publication prerequisites remain:

1. Reconcile GitHub Pages' legacy main `/docs` source and required-check settings so the intended CI gate governs publication. The last read still shows no effective required checks on main. No account setting was changed here.
2. Apply the additive `mail_cooldown` table/index before activating the new Worker. Existing nullable assessment email storage remains compatible; no production rows were changed.
3. Review the paired privacy text and dated publication metadata. No human/legal approval or new effective date is inferred from tests.
4. If a PR is requested, run the required cross-vendor simplicity gate against the eventual committed diff. No PR or paid model review was performed. After an authorized rollout, verify hosted-byte identity and Worker behavior separately from local tests, without unsolicited mail sends.

All remediation is local, unstaged and uncommitted. The preexisting dependency commit is committed but unpushed. Nothing has been pushed, deployed, migrated or published.
