# AI Posture security audit context

This context applies only to audit artifacts in this directory. Engineering and strategic authority remain in repository CLAUDE.md and INTENT.md.

## Output Configuration

- output_mode: markdown
- Output choice: Sam explicitly selected Markdown report on 2026-10-26.
- Latest report: audits/2026-10-26-code-security-review.md
- Local remediation: audits/2026-10-26-medium-remediation.md
- Low-finding remediation: audits/2026-10-26-low-remediation.md
- Precommit review: audits/2026-10-26-precommit-review.md
- Precommit finding fixes: audits/2026-10-26-review-fixes.md
- Final verification: audits/2026-10-26-final-verification.md
- R4 correction and current commit readiness: audits/2026-10-26-r4-remediation.md
- Reviewed revision: 696b42bb2c1d248e3090035068c72d645ad9137e
- Standard: OWASP Top 10:2021, with repository-specific privacy and correctness checks.
- No issue creation or source remediation is implied by audit output.

## Known Finding IDs

| ID | Severity | Current local status | Description |
|---|---|---|---|
| SEC-001 | Medium | Resolved locally | Delivery cleanup failure retains linked email |
| SEC-002 | Medium | Resolved locally | Recipient/global email abuse bounds absent |
| SEC-003 | Medium | Resolved locally | Full request is parsed before bounded payload check |
| SEC-004 | Medium | Resolved locally | Reachable in-scope level-zero assessment artifact |
| SEC-005 | Medium | Resolved locally | EARL contradictory scope bypasses minimum |
| SEC-006 | Medium | Resolved locally | EARL provenance and evidence types not enforced |
| SEC-007 | Low | Resolved locally | Delivery accepts contradictory estimate semantics |
| SEC-008 | Low | Resolved locally | Inherited schema-property lookup accepts reserved keys |
| SEC-009 | Low | Resolved locally | Pending confirmation token has no expiry |
| SEC-010 | Low | Resolved locally | PostHog pageleave default exceeds disclosed event list |
| SEC-011 | Low | Workflow prepared locally; remote activation pending | Tracked publication workflow lacks regression gates |
| DEP-001 | High on main | Resolved locally only | Main has six npm-affected dev packages; local lock reports zero |

DEP-001 records one dependency-remediation group, not six independent vulnerabilities. Its high rating is the registry's maximum dependency rating, not a demonstrated production application exploit. Keep main, local, and deployed state separate during follow-up.

## Precommit Review Findings

| ID | Priority | Current local status | Description |
|---|---|---|---|
| R1 | P2 | Resolved locally | Analytics reports computation engine version rather than draft format |
| R2 | P2 | Resolved locally | Valid exact-version 1.0.0 estimates retain delivery compatibility |
| R3 | P3 | Resolved locally | Resent confirmation mail shows the original absolute expiry |
| R4 | P2 | Resolved locally | Runtime-verified SHACL aggregate presence, minimum, optional name, exact constraining set and all-N/A rules |

R4's inherited SHACL aggregate gap is corrected with 26 passing runtime regressions and a required step in the prepared CI job. Workspace suites pass with 167 root and 45 Worker passes; clean-file verification reports 166 root passes, one expected local-config skip, 45 Worker passes and 26 SHACL passes. Generated-site and Worker dry-run builds pass. Final local commit review found no confirmed remaining code findings. GitHub Pages still uses legacy main `/docs` publication; main has no effective required checks in the 2026-10-26 read-only inspection. Pages configuration, additive schema activation and privacy publication review remain separate prerequisites.

Audit reports preserve their dated verification checkpoints. Git records the current commit and staging state. Sam authorized a separate local remediation commit after staged review; push and deployment remain outside this authorization.
