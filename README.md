# AI Posture

The Aggregated Intelligence Posture framework. One governance score for human-AI collaboration across three vectors, bounded by the weakest.

Status: stable (v1.1.0). The specification is at v1.1.0 with the three-vector set locked and the declaration format published. The landing page, pre-assessment, supporting legal pages, and agent surfaces are live.

- Canonical site: https://aiposture.org/
- Specification: [SPEC.md](SPEC.md)
- Pre-assessment PRD (archived): [archive/PRD.md](archive/PRD.md)
- Self-assessment: https://aiposture.org/assess/
- Assistant guide: https://aiposture.org/.well-known/assistant-guide.txt
- Framework profile: https://aiposture.org/.well-known/ai-posture-framework.json
- Estimate result schema: https://aiposture.org/assess/schema/estimate-result.schema.json
- Declaration schema: https://aiposture.org/schema/declaration/v1/ai-posture-declaration.schema.json
- Declaration viewer: https://aiposture.org/check/
- Privacy policy: https://aiposture.org/privacy/
- Terms of service: https://aiposture.org/terms/

## Who this is for

Governance, risk, and compliance leaders who need one defensible readiness score across people, infrastructure, and regulation — instead of three disconnected tools that never combine into a posture.

## What problem it solves

Organizations adopt AI across people, infrastructure, and regulation but have no single measure of combined readiness. AI Posture produces one governance score, bounded by the weakest vector, so the gap that actually limits you is visible.

## Canonical URL

https://aiposture.org/

## Three vectors

- People — [PAICE.work](https://paice.work/)
- Infrastructure — [Siteline](https://siteline.to/)
- Regulation — [EveryAILaw](https://everyailaw.com/)

## Repo layout

- `SPEC.md` — normative specification (YAML frontmatter + Markdown body)
- `archive/PRD.md` — archived pre-assessment product requirements (question bank, likelihood tables, rubric tables, runtime flow); historical, superseded at v1.0.0
- `CONTRIBUTING.md` - contribution boundaries and verification guidance
- `CHANGELOG.md` — spec and PRD change log
- `scripts/build-spec.js` — generates `docs/spec/index.html` from `SPEC.md`
- `docs/` — canonical site source (GitHub Pages root)
- `docs/.well-known/assistant-guide.txt` — GuideCheck Human-Verifiable Assistant Guide profile artifact
- `docs/.well-known/assistant-guide-manifest.json` — GuideCheck Level 4 sidecar manifest
- `docs/spec/` — generated spec page (do not edit directly; run `npm run build`)
- `docs/assess/` — client-side Bayesian adaptive self-assessment
- `docs/assess/schema/` - JSON Schema for local assessment artifacts
- `docs/.well-known/ai-posture-framework.json` - machine-readable framework profile
- `docs/papers/` — papers section: the whitepaper landing page, the published whitepaper PDF, and its audio overview
- `docs/research/` - non-normative design basis, validation backlog, stress tests, and positioning crosswalk
- `.github/ISSUE_TEMPLATE/` - structured intake for spec changes, vector proposals, validation findings, and terminology feedback
- `tests/` — regression, engine, and data-contract tests for the assessment flow
- `docs/privacy/`, `docs/terms/` — supporting legal pages

## Build

The spec page at `docs/spec/index.html` is generated from `SPEC.md`. After editing the spec, regenerate it:

```
npm run build
```

To run the assessment test suite:

```
npm test
```

To validate a declaration or EARL report:

```
node scripts/validate.js declaration path/to/ai-posture.json
node scripts/validate.js earl path/to/report.jsonld
```

The script (`scripts/build-spec.js`) reads the YAML frontmatter and Markdown sections from `SPEC.md` and writes a fully rendered HTML page. No dependencies beyond Node.js.

To update the spec:
1. Edit `SPEC.md` — bump `version`, `status`, `last_modified` in the frontmatter as needed
2. Run `npm run build`
3. Commit both `SPEC.md` and `docs/spec/index.html`

## Analytics and privacy

The site uses PostHog in cookie-less mode. No cross-session user stitching, no autocapture, no session recording. Event payloads record question identifiers and aggregate posture outcomes only, never answer content. Pre-assessment state persists in `sessionStorage` while the tab is open and is never transmitted during the flow.

The assessment runtime now treats tracking flags as part of the persisted draft state so reloads and reruns do not double-count or suppress completion events. Stored draft payloads are normalized on load, and malformed steps are dropped rather than trusted.

Adaptive completion is reflected in the visible progress indicator. Vectors explicitly confirmed as out of scope are labeled `N/A`, excluded from the aggregate posture calculation, and do not reuse level-0 `Ignoring` evidence text.

See the privacy policy for the full posture.

## Governance

Stewarded by PAICE.work PBC (US public benefit corporation). A transition to an independent steward (PAICE Foundation) is planned.

Contributions from outside the current steward's product line are welcome. The spec does not favor any particular reference implementation.

## Research notes

Non-normative positioning and validation notes live in `docs/research/`:

- [Research notes index](docs/research/README.md)
- [Design basis and open questions](docs/research/design-basis-open-questions.md)
- [Validation backlog](docs/research/validation-backlog.md)
- [Weakest-link and level-semantics stress tests](docs/research/weakest-link-stress-tests.md)
- [Adjacent-framework crosswalk](docs/research/adjacent-framework-crosswalk.md)
- [Wire format for verified AI Posture assessments](docs/research/wire-format-earl.md)

## Assistant guide

AI Posture adopts the GuideCheck Human-Verifiable Assistant Guide profile for assistant-facing repository maintenance instructions. The public artifact is served at https://aiposture.org/.well-known/assistant-guide.txt and mirrored at repository root as `assistant-guide.txt`.

The guide publishes a Level 4 sidecar manifest at https://aiposture.org/.well-known/assistant-guide-manifest.json. The repository hash anchor is `assistant-guide.sha256`.

## License

- Specification, question bank, likelihood tables, rubric: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- Code: [MIT](LICENSE)

A [PAICE Foundation](https://paice.foundation/) project.
