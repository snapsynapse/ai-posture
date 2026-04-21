# AI Posture

The Aggregated Intelligence Posture framework. One governance score for human-AI collaboration across three vectors, bounded by the weakest.

Status: beta. The spec, landing page, pre-assessment, and supporting legal pages are live for public review. Terms may change before general availability.

- Canonical site: https://aiposture.org/
- Specification: [SPEC.md](SPEC.md)
- Pre-assessment PRD: [PRD.md](PRD.md)
- Self-assessment: https://aiposture.org/assess/
- Privacy policy: https://aiposture.org/privacy/
- Terms of service: https://aiposture.org/terms/

## Three vectors

- People — [PAICE.work](https://paice.work/)
- Infrastructure — [Siteline](https://siteline.to/)
- Regulation — [EveryAILaw](https://everyailaw.com/)

## Repo layout

- `SPEC.md` — normative specification (YAML frontmatter + Markdown body)
- `PRD.md` — pre-assessment product requirements (question bank, likelihood tables, rubric tables, runtime flow)
- `CHANGELOG.md` — spec and PRD change log
- `scripts/build-spec.js` — generates `docs/spec/index.html` from `SPEC.md`
- `docs/` — canonical site source (GitHub Pages root)
- `docs/spec/` — generated spec page (do not edit directly; run `npm run build`)
- `docs/assess/` — client-side Bayesian adaptive self-assessment
- `docs/privacy/`, `docs/terms/` — supporting legal pages (beta drafts)

## Build

The spec page at `docs/spec/index.html` is generated from `SPEC.md`. After editing the spec, regenerate it:

```
npm run build
```

The script (`scripts/build-spec.js`) reads the YAML frontmatter and Markdown sections from `SPEC.md` and writes a fully rendered HTML page. No dependencies beyond Node.js.

To update the spec:
1. Edit `SPEC.md` — bump `version`, `status`, `last_modified` in the frontmatter as needed
2. Run `npm run build`
3. Commit both `SPEC.md` and `docs/spec/index.html`

## Analytics and privacy

The site uses PostHog in cookie-less mode. No cross-session user stitching, no autocapture, no session recording. Event payloads record question identifiers and aggregate posture outcomes only, never answer content. Pre-assessment state persists in `sessionStorage` while the tab is open and is never transmitted during the flow. See the privacy policy for the full posture.

## Governance

Stewarded by PAICE.work PBC (US public benefit corporation). A transition to an independent steward (PAICE Foundation) is planned.

Contributions from outside the current steward's product line are welcome. The spec does not favor any particular reference implementation.

## License

- Specification, question bank, likelihood tables, rubric: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- Code: [MIT](LICENSE)

A [PAICE Foundation](https://paice.foundation/) project.
