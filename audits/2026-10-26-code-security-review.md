# AI Posture code audit and security review

Date: 2026-10-26, America/Denver. Scope: this repository, including the static site, assessment engine, validators, build scripts, Cloudflare Worker, database schema, tests, dependency lockfile, and deployment workflow. Reference: OWASP Top 10:2021. This is a code review, not a certification or a legal-currentness assessment.

Follow-up: [six-medium remediation](2026-10-26-medium-remediation.md) is implemented and tested locally, pending review. Findings and counts below preserve the original audit snapshot, not the uncommitted remediation state or a deployed-state assertion.

Further follow-up: [five-low remediation](2026-10-26-low-remediation.md) is implemented and tested locally. The tracked workflow has a test dependency; remote Pages-source and required-check activation remain external work.

Reviewed revision: `696b42bb2c1d248e3090035068c72d645ad9137e`, branch `security/black-october-npm-audit`. Fetched `origin/main`: `ae13413642bdb99c0350ea48be4621e975b952be`. The checkout started clean and is one commit ahead of main. The branch has no upstream and no matching remote branch was returned. Its existing lockfile update is committed locally and has not been pushed. No application code was changed for this audit.

## Executive summary

The main risks are incomplete privacy cleanup after delivery, abuse of public email endpoints, and validators accepting or producing contradictory assessment data. Six medium and five low findings were confirmed in the reviewed code. No critical or high application-code issue was established.

| Severity | Current-code findings |
|---|---:|
| Critical | 0 |
| High | 0 |
| Medium | 6 |
| Low | 5 |
| Total | 11 |

Overall assessed code risk: medium. This rating excludes uninspected provider/account controls and does not assert that production records have been exposed. Several findings are correctness or validation-integrity defects rather than remote exploits.

Both approved test commands passed: root `npm test` reported 118 passing tests; Worker `npm test` reported 13 passing tests. The root command already discovers the Worker tests, so this represents 118 distinct tests, not 131. Existing tests do not exercise the failure and adversarial paths reproduced below.

The current lockfile returned zero npm vulnerability findings. The fetched main branch still returned six affected development-tool packages, five rated high and one low by npm. The existing local commit resolves that dependency result; it is not on main. These development dependencies are not bundled runtime dependencies of the deployed Worker.

## Automated scan results

### Dependencies and local-only remediation

Node.js v26.12.1 and npm 11.20.0 were used. npm's live advisory service was queried with `npm audit --package-lock-only --json`, including development dependencies. An initial sandbox DNS failure was resolved by repeating the query with elevated network access. No package installation or audit fix was run. Root has no dependencies and needs no dependency scanner. Python SAST and dependency scanners are not applicable.

| Dependency | Fetched main | Reviewed local lock | npm rating on main | Relevant advisory or relationship |
|---|---|---|---|---|
| wrangler | 4.95.0 | 4.153.0 | High, inherited | Parent of esbuild and miniflare |
| miniflare | 4.20260526.0 | 5.20261023.0-beta | High, inherited | Parent of sharp, undici, ws |
| undici | 7.24.8 | 7.30.1 | High | Multiple advisories, including [GHSA-xjj6-f33q-929c](https://github.com/advisories/GHSA-xjj6-f33q-929c) |
| sharp | 0.34.5 | 0.35.5 | High | Includes [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) and libvips/libheif advisories |
| ws | 8.20.1 | 8.21.0 | High | [GHSA-96hv-2xvq-fx4p](https://github.com/advisories/GHSA-96hv-2xvq-fx4p) |
| esbuild | 0.27.3 | 0.28.2 | Low | [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr), Windows development-server condition |

DEP-001 is resolved in the local reviewed revision but remains present on fetched main. The table counts affected packages, not independent CVEs: parent-package entries inherit child advisories and must not be counted as separate exploit paths. No applicable known vulnerability remains in the reviewed lockfile according to this query. npm audit covers registry-known advisories, not package provenance or every possible defect; see [npm audit documentation](https://docs.npmjs.com/cli/commands/npm-audit/).

Recommended next dependency action: review and deliver the existing lockfile commit through the normal repository process. No additional dependency edit is required by this scan, and pushing or merging was not performed. Updated Wrangler includes a beta Miniflare dependency; the Node tests do not validate the Wrangler development runtime. No build or deployment smoke test was run.

### Secrets

Tracked-file scanning found no likely hardcoded secret matching API-key assignments, AWS access keys, private-key headers, GitHub tokens, Resend tokens, or credential-bearing MongoDB URIs. A reachable-history scan of 381 text blobs across 50 commits also returned no matches. Binary/media assets and lockfile integrity strings were excluded. This was a targeted pattern scan, not a comprehensive entropy or credential-validity scanner.

The tracked `worker/.dev.vars.example` contains an obvious placeholder. `worker/.dev.vars` exists locally and is ignored; its contents were not printed or used. No real environment or private-key file was found in the tracked-file inventory. `.env` and `.env.*` are ignored. The ignore rule for `worker/.dev.vars` does not cover environment-specific variants such as `worker/.dev.vars.production`; extend that rule before introducing such files. No exposed variant was found.

### Configuration and deployment

| Area | Result | Evidence and boundary |
|---|---|---|
| CORS | Specific origins, no credentials | `worker/src/index.js:10-24`. CORS does not authorize requests or prevent email side effects; see SEC-002. |
| SQL injection | No finding | All Worker SQL values are bound parameters. |
| Rate limiting | Partial | Atomic per-IP/hour limits exist for sending routes; recipient and global sending controls are absent. Confirmation queries are not rate-limited. |
| Script restrictions | Hardening gap | HTML CSP uses only `upgrade-insecure-requests`; this does not restrict script execution. |
| External script integrity | Hardening gap | Assessment loads mutable PostHog `/static/array.js` without an integrity hash. |
| Test and publication gates | Finding | Pages workflow uploads and deploys without running tests; see SEC-011. |
| Deployment action pinning | Hardening gap | Actions use mutable major-version tags in a job with Pages/OIDC write permission. |
| Live security headers | Unverified | Read-only HEAD requests to root, assess, check, and API health returned Cloudflare 403 responses. Those headers cannot establish origin application controls. |
| HTTPS enforcement | Needs account reconciliation | GitHub Pages API reported `https_enforced: false`. Cloudflare enforcement was not inspected, and HEAD requests on both transport schemes were blocked. No successful plaintext application response was demonstrated. |

GitHub reported Pages source as main `/docs`, legacy build type, and a successful Pages workflow at main revision `ae13413`. Both a Pages build/deployment run and the repository workflow were visible. These observations do not prove the hosted bytes or deployed Worker revision. Provider configuration, D1 contents, Resend delivery settings, PostHog project settings, and branch protection were outside inspection.

## Code findings

### SEC-001: Delivery cleanup failure leaves email linked to assessment data

Severity: Medium. Priority: P2. OWASP A04:2021; related A09:2021 recovery/monitoring gap.

Location: [worker/src/deliver.js:169](/Users/snap/Git/ai-posture/worker/src/deliver.js:169), [cleanup handling:190](/Users/snap/Git/ai-posture/worker/src/deliver.js:190).

The handler persists email and assessment together before sending. After provider success, the email-nulling UPDATE can fail. After provider rejection, the cleanup DELETE can fail. Either case rejects the handler and leaves the linked record in D1. There is no durable retry or reconciliation path. The public policy at `docs/privacy/index.html:159` promises removal after successful sending or removal of the partial record on failure.

Reproduction: with an in-memory D1 stub, make sending succeed and the UPDATE throw; then separately make sending fail and the DELETE throw. Both cases leave one row containing the fixture email and payload. No production data was inspected, so this proves a failure mode rather than an existing production retention incident.

Remediation: avoid persisting the email when it is needed only within the active request, or implement durable cleanup with a bounded retention deadline, retries, and an alert on unresolved cleanup. Add fault-injection tests for both database failures and worker interruption around the provider call.

### SEC-002: Public mail routes lack recipient cooldown and global abuse bounds

Severity: Medium. Priority: P2. OWASP A04:2021.

Location: [worker/src/newsletter.js:53](/Users/snap/Git/ai-posture/worker/src/newsletter.js:53), [worker/src/deliver.js:135](/Users/snap/Git/ai-posture/worker/src/deliver.js:135), [worker/src/ratelimit.js:12](/Users/snap/Git/ai-posture/worker/src/ratelimit.js:12).

Both send routes limit by source IP only. An attacker can target the same address from multiple IPs, consuming provider quota and sending repeated unwanted messages. Pending newsletter submissions always replace the confirmation token, so an unauthenticated resubmission also invalidates a recipient's previous link. Even a single IP can repeat this within its five-request allowance.

Reproduction: subscribe the same fixture address from two simulated IPs. Two messages are sent, the stored token changes, and the first confirmation link becomes invalid. Requests with an untrusted Origin and JSON carried as `text/plain` are still processed. Browser CORS blocks response access, not these side effects. Cloudflare's client-IP header is appropriately trusted in production; this finding does not assume it can be spoofed there.

Remediation: add a recipient cooldown, preserve a usable pending token during that window, deduplicate sends, and enforce a global provider sending budget. Apply matching protections to artifact delivery. Origin/content-type checks reduce browser-driven abuse but cannot replace server-side recipient controls. Keep signup response bodies uniform.

### SEC-003: The payload limit does not bound request parsing

Severity: Medium. Priority: P2. OWASP A04:2021.

Location: [worker/src/deliver.js:146](/Users/snap/Git/ai-posture/worker/src/deliver.js:146), [worker/src/newsletter.js:38](/Users/snap/Git/ai-posture/worker/src/newsletter.js:38).

`request.json()` buffers and parses the complete request before the 32 KiB check. That check measures only `body.payload`; ignored request-envelope fields are unbounded. Newsletter requests have no application byte limit. Oversized requests can consume memory and CPU despite the advertised payload limit, within whatever limits Cloudflare independently imposes.

Reproduction: a 1,049,443-byte request with a small valid payload and one MiB of ignored top-level padding returned 200 and sent one mocked email. No resource-exhaustion load test was run.

Remediation: enforce a streaming byte limit before JSON parsing and validate exact envelope keys. Return 413 for oversized input, including requests with missing or inaccurate Content-Length. Keep a separate reasonable payload limit if needed.

### SEC-004: An ordinary assessment path produces a rejected level-zero artifact

Severity: Medium, correctness. Priority: P2. OWASP A04:2021.

Location: [docs/assess/js/app.js:183](/Users/snap/Git/ai-posture/docs/assess/js/app.js:183), [artifact serialization:774](/Users/snap/Git/ai-posture/docs/assess/js/app.js:774), [estimate schema:38](/Users/snap/Git/ai-posture/docs/assess/schema/estimate-result.schema.json:38).

The Bayesian model still permits an in-scope mode of zero named `Ignoring`. The runtime exports this directly. The published estimate schema and Worker accept only levels 1-5 or null and exclude `Ignoring`; SPEC.md reserves level zero for out-of-scope N/A. A normal user can therefore finish an assessment, download an invalid artifact, and have email delivery rejected with `invalid_payload`.

Reproduction through actual app hooks: O1=`c`, O2=`["us_other"]`, O3=`b`; answer every adaptively selected bank question with its uncertainty option, “Not sure what this means” or “Don't know.” The runtime reaches the result stage with Infrastructure and People both `{in_scope:true,level:0,level_name:"Ignoring"}` and aggregate `{level:0,level_name:"Ignoring"}`. Regulation is level one. No session tampering is required.

Remediation: reconcile the estimator's in-scope state space with the published five-level contract. Keep confirmed out-of-scope handling separate from low readiness or uncertainty. This needs an explicit modeling choice, not merely weakening the API schema. Add complete adaptive-flow tests that validate artifacts and their delivery acceptance.

### SEC-005: Contradictory EARL scope fields bypass the weakest-link check

Severity: Medium, integrity. Priority: P2. OWASP A08:2021.

Location: [scripts/validate.js:58](/Users/snap/Git/ai-posture/scripts/validate.js:58), [aggregation:70](/Users/snap/Git/ai-posture/scripts/validate.js:70).

The validator excludes an assertion when either `inScope` is false or the outcome is `earl:inapplicable`. The published profile requires coherent N/A fields and computes the minimum over `inScope:true` assertions. An in-scope assertion can consequently be excluded merely by changing its outcome. When every assertion is excluded, aggregate checks are skipped entirely.

Reproduction: start with the shipped EARL example; keep Regulation `inScope:true`, change its outcome to `earl:inapplicable`, remove its result level, and declare posture level 3 constrained only by Infrastructure. `validateEarl()` returns zero errors despite removing the weakest in-scope vector. Staleness is reported only as a warning and does not explain this acceptance.

Remediation: require boolean scope and coherent scope/outcome pairs. Determine aggregation membership from the validated scope value. Validate the all-N/A aggregate representation explicitly. Add contradictory-field and all-N/A regression cases.

### SEC-006: EARL validation accepts absent provenance and invalid evidence types

Severity: Medium, correctness/integrity. Priority: P2. OWASP A08:2021.

Location: [scripts/validate.js:40](/Users/snap/Git/ai-posture/scripts/validate.js:40), [assertion fields:51](/Users/snap/Git/ai-posture/scripts/validate.js:51), [evidence:62](/Users/snap/Git/ai-posture/scripts/validate.js:62).

The implementation does not enforce several advertised EARL-profile requirements. Report-level assertor/date are not checked, assertion scope need not be boolean or present, and subject/assertor/evidence checks rely on non-nullness rather than IRI types and nonempty evidence lists. A passing validator result can therefore misrepresent structural conformance and evidence presence. This is not cryptographic verification of an assertion's truth.

Reproduction: replace the shipped report subject with an object, remove report assertor/date, give each assertion numeric assertor and boolean subject, remove its scope, and use an empty evidence array. The validator still returns zero errors. The published profile and SHACL require stronger identity/evidence types.

Remediation: implement the complete declared structural contract, including required report fields, boolean scope, valid IRI fields, and at least one valid evidence IRI for passed assertions. Keep offline syntax validation distinct from actually resolving evidence. Add malformed-type and missing-field tests; reconcile profile and SHACL requirements as part of that work.

### SEC-007: Delivery validation accepts contradictory estimate fields

Severity: Low, data integrity. Priority: P3. OWASP A08:2021.

Location: [worker/src/deliver.js:47](/Users/snap/Git/ai-posture/worker/src/deliver.js:47), [aggregate:79](/Users/snap/Git/ai-posture/worker/src/deliver.js:79), [payload:111](/Users/snap/Git/ai-posture/worker/src/deliver.js:111).

Field-level validation does not enforce coherent scope, matching level/name, normalized posterior mass, aggregate minimum, or the complete constraining-vector set. A payload with aggregate level 5 named `Perceiving` and posterior `[1,1,1,1,1,1]` is accepted. Such artifacts can be retained and sent under the site's delivery identity.

These are explicitly client-supplied estimates, so this is not an authentication bypass or proof of forged verified assessments. It does weaken retained-data quality and downstream interpretation.

Remediation: share semantic validation between exporter and Worker. Check level/name and scope coherence, aggregate minimum and constraining vectors, and posterior sums with tolerance for six-decimal export rounding.

### SEC-008: Inherited object keys bypass declaration additional-property rejection

Severity: Low, correctness. Priority: P3. OWASP A08:2021.

Location: [docs/check/validator.js:169](/Users/snap/Git/ai-posture/docs/check/validator.js:169).

The property lookup uses `props[k]`, which also resolves inherited Object.prototype members. Adding `constructor:"unrecognized"` to a valid declaration returns zero errors despite `additionalProperties:false`. Reserved keys such as `toString` and `__proto__` receive the same unintended schema lookup treatment.

Remediation: use own-property checks for schema properties and required input fields. Add JSON-parsed reserved-key fixtures. No prototype mutation, executable XSS, or code execution was demonstrated.

### SEC-009: Pending newsletter confirmation tokens have no expiry

Severity: Low. Priority: P3. OWASP A07:2021.

Location: [worker/src/newsletter.js:89](/Users/snap/Git/ai-posture/worker/src/newsletter.js:89).

Confirmation looks up email/status by token but never checks the recorded creation time. A pending row with `created_at=0` still confirms. Tokens have strong 256-bit entropy and are consumed on successful confirmation; the concern is an old leaked or forwarded link remaining usable indefinitely, not token guessing.

Remediation: apply an explicit confirmation expiry, reject expired links without activating the subscription, and clean up expired pending state. Test the expiry boundary and token reuse after success.

### SEC-010: Analytics defaults exceed the declared event allowlist

Severity: Low, privacy/configuration. Priority: P3. OWASP A05:2021.

Location: [docs/assess/index.html:276](/Users/snap/Git/ai-posture/docs/assess/index.html:276), [privacy event list:140](/Users/snap/Git/ai-posture/docs/privacy/index.html:140).

The assessment enables automatic pageviews without disabling pageleaves. PostHog's current SDK defaults `capture_pageleave` to `if_capture_pageview`, so this configuration permits `$pageleave`, which is absent from the policy's exhaustive event list. This conclusion follows from the configuration and [official SDK source](https://github.com/PostHog/posthog-js/blob/main/packages/browser/src/posthog-core.ts); [official guidance](https://posthog.com/docs/product-analytics/cutting-costs) documents the separate switches. Live SDK execution and actual ingested events were not observed.

Remediation: explicitly set `capture_pageleave:false`, or deliberately document the additional event. An explicit event allowlist in `before_send` would also constrain future SDK defaults. No first-party answer/email analytics transmission or cross-session stitching was found.

### SEC-011: Publication has no automated regression gate

Severity: Low, engineering control. Priority: P3. OWASP A08:2021.

Location: [.github/workflows/pages.yml:23](/Users/snap/Git/ai-posture/.github/workflows/pages.yml:23).

The sole tracked workflow checks out the repository, uploads `docs/`, and deploys. No pull-request or deployment job runs the available tests or checks generated-artifact consistency. Existing correctness, schema, and privacy regression tests can fail without this workflow detecting it. External branch rules or checks were not inspected.

Remediation: add pull-request checks for both relevant test scopes and generated-artifact consistency, then make the appropriate checks required in repository settings. Keep provider deployment credentials out of test jobs. Existing tests need the new negative/failure cases described above; merely running today's passing suite would not detect all audit findings.

## OWASP coverage

| Category | Review result |
|---|---|
| A01 Broken Access Control | Public signup/delivery are intentional. No user-record retrieval endpoint or demonstrated IDOR. CORS is not an abuse barrier; SEC-002. |
| A02 Cryptographic Failures | Web Crypto generates 256-bit tokens/run IDs. No password store or custom cryptography. Plaintext newsletter email storage is expected architecture; token hashing at rest is optional defense in depth. |
| A03 Injection | Bound SQL, fixed provider URL, escaped email/viewer output. No confirmed SQL, command, or executable DOM injection. |
| A04 Insecure Design | SEC-001 through SEC-004. Failure recovery, abuse controls, parsing bounds, and estimator state space reviewed. |
| A05 Security Misconfiguration | SEC-010. CSP, action pinning, header/HTTPS limits documented separately. |
| A06 Vulnerable and Outdated Components | Zero current-lock advisories; DEP-001 remains on fetched main and is locally remediated. |
| A07 Identification and Authentication Failures | SEC-009. Confirmation consumes a strong token; public send endpoints intentionally do not require account login. |
| A08 Software and Data Integrity Failures | SEC-005 through SEC-008 and SEC-011. Validator acceptance and publication controls reviewed. |
| A09 Security Logging and Monitoring Failures | Cleanup failures have no durable reconciliation or alert path, part of SEC-001. Provider exception text may contain operational details; no public secret response was established. |
| A10 Server-Side Request Forgery | No finding. Worker outbound fetch goes to fixed Resend HTTPS URL. Declaration URL fetching occurs in the visitor's browser, not a server. |

## Privacy architecture

| Requirement or public commitment | Assessment |
|---|---|
| In-progress answers stay in browser | First-party code supports this. Remote analytics SDK executes in page context, so its supply-chain trust remains relevant. |
| No answer/email values in explicit analytics calls | Supported by reviewed first-party call sites. |
| No persistent analytics identity, replay, or autocapture | Explicit memory persistence, no person profiles, replay/autocapture/heatmaps/rage clicks disabled. Actual provider state uninspected. |
| Event types confined to the public list | Configuration drift, SEC-010. |
| Delivery email removed after sending or failure | Failure-path defect, SEC-001. |
| Stored assessment has no direct identifier | Email is cleared on the ordinary success path. The optional user-controlled scope label is free text and can contain identifying information; qualify the policy's absolute wording. No separate collection or cross-session linking was demonstrated. |
| Rate-limiter IP handling | D1 stores IP/hour buckets. Opportunistic 1% cleanup removes old buckets only when requests trigger it, so 24 hours is a cleanup threshold rather than a guaranteed deletion deadline. Disclose this operational IP storage and define a retention bound if one is intended. |
| Three-year assessment retention | Explicitly manual in ROADMAP.md:52; first documented purge is due in 2029. No overdue record or current retention violation was established. |
| Unsubscribe/deletion route | Privacy policy supplies a manual email path. README's “TBD” wording is documentation drift, not proof that unsubscribe is unavailable. |

The last two disclosure qualifications are review notes, not additional numbered vulnerabilities. They should be reconciled before strengthening privacy claims.

## Remediation priority

| Order | Findings | Recommended bounded work | Estimated scope |
|---:|---|---|---|
| 1 | SEC-001 | Remove persistent delivery-email linkage or add durable cleanup and fault-injection coverage | Small to medium |
| 2 | SEC-002, SEC-003 | Add recipient/global send controls and pre-parse body limits | Medium |
| 3 | SEC-004 | Decide and implement the estimator's in-scope level contract; test normal uncertainty paths | Medium; modeling decision required |
| 4 | SEC-005, SEC-006 | Bring EARL scope, structure, provenance, and evidence validation into contract | Medium |
| 5 | SEC-007, SEC-008 | Share estimate semantics and fix own-property schema lookup | Small to medium |
| 6 | SEC-009, SEC-010 | Add token expiry and explicit analytics event controls | Small |
| 7 | SEC-011 | Add regression and artifact checks to publication workflow | Small to medium |

P0/P1 application work is not supported by the findings. Separately, finish review of the already prepared dependency remediation before discarding or superseding its local commit. Estimated scope is relative engineering effort, not a delivery promise.

Additional hardening, not included in the 11 finding count: pin deployment action SHAs; use a reviewed, immutable analytics SDK asset with integrity checks; introduce a real script/connect CSP; use explicit security response headers at the hosting layer; reconcile Cloudflare transport enforcement with Pages settings; restrict viewer evidence links to intended schemes; render bootstrap error text through textContent; add credential-file variant ignores. No compromise or executable exploit was established for these observations.

## Positive security controls

- SQL queries bind all untrusted values; no string interpolation into SQL identifiers or statements was found.
- Confirmation tokens and run IDs use 32 random Web Crypto bytes. Confirmation clears its token after use.
- Signup response bodies avoid directly revealing confirmed membership.
- D1 rate-limit increments are atomic, and both sending routes check them before processing input.
- Email-rendered values and declaration-viewer values are escaped.
- Artifact type/source/notice constants and object field sets are narrowly validated.
- Email-provider URL is fixed, uses HTTPS, and reads credentials from environment secrets.
- Analytics disables major invasive collection features and uses memory persistence.
- Dependency lock entries include integrity hashes, and the local dependency update clears currently reported advisories.

## Baseline and issues

No prior structured security-audit report was found in the tracked inventory or audit-skill configuration. This is the first baseline for SEC-001 through SEC-011, all open. DEP-001 records the independently verified main-to-local dependency delta and is resolved locally only. No GitHub issues, source fixes, commits, pushes, merges, builds, database operations, or deployments were performed.

## Methodology and verification limits

Manual review covered all five Worker source modules (519 lines), both Worker tests, schema/configuration, all three build/validation scripts, assessment JS and data contracts, declaration viewer/validator, inline site scripts, schemas/profile/shapes, privacy/terms, and the tracked workflow. The standalone JS files total approximately 3,001 lines, with HTML and data reviewed additionally. Archive material was treated as historical context, not a current security contract.

Verification used the approved Node suites, live npm audits of the current lock and temporary copies of main's lock, targeted tracked-file and reachable-history secret scans, Git/Pages API reads, read-only public HEAD requests, and isolated Node/VM reproductions. Mocked reproductions make no external calls and do not use real credentials or production D1. They reproduce input acceptance, token replacement, schema drift, and cleanup failure; they do not prove production incidence or sustained denial of service.

Temporary reproduction scripts are [frontend proof](/private/tmp/ai-posture-frontend-audit-repro.cjs) and [Worker proof](/private/tmp/ai-posture-worker-audit-repro.mjs). They are session scratch artifacts and may be removed by operating-system cleanup; exact inputs and outcomes are retained in the findings above. npm evidence is in `/private/tmp/ai-posture-npm-audit.json` and `/private/tmp/ai-posture-origin-main-npm-audit.json` for this session. No secret values are included.

Build commands were not run. Generated output consistency was inspected through existing tests and source review, not a fresh regeneration. Live responses were blocked at the edge; no browser recovery, malicious live probing, runtime scanner, external issue creation, or provider configuration change was attempted.
