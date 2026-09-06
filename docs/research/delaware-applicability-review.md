# Delaware applicability review for aiposture.org

Reviewed: 2026-09-05
Scope: informational specification site and browser-based pre-assessment, not the entire PAICE.work PBC portfolio

## Finding

No Delaware-specific ongoing AI-governance duty applicable to the described project was identified in this bounded review. This supports the owner's observation for these activities; it does not establish that every Delaware-based company has no AI obligations, or that this project's Regulation vector is N/A across its full operating footprint.

The earlier draft statement that the project acknowledges AI-specific exposure in the United States was unsupported and has been withdrawn. The owner subsequently approved Regulation 1 with an acknowledgment of ongoing review; that is not a finding that a specific Delaware duty binds the project. N/A requires a defensible scope judgment under SPEC.md; missing corpus entries alone cannot supply it.

## Repository evidence

Read-only review of EveryAILaw at commit `b8b67bf340f21194f6abc28d40f8011277a07f6f` covered:

- `data/jurisdictions-registry.json`: Delaware (`us-de`) is watch-list, not a reviewed tracked-instrument jurisdiction.
- `data/instruments/`: no instrument with `jurisdiction: us-de` was found. The US profile and federal-instrument metadata were also screened for role boundaries; this was not a comprehensive federal-law review.
- `data/watch-list.md`: the Delaware block records HB 191 as enacted on 2026-04-23, while retaining an earlier contradictory sentence saying no binding AI-specific legislation was enacted. The dated entry and official bill record supersede that sentence.
- `data/exclusions.md`: Delaware deepfake law, AI Commission legislation, and the Delaware Personal Data Privacy Act are excluded under the reference's inclusion rules. Excluded means outside this corpus's coverage, not legally irrelevant.
- `wiki/index.md`, `wiki/regulation-landscape.md`, and `wiki/comparisons/disclosure-requirements.md`: cross-jurisdiction context. No Delaware-specific wiki or raw-text match was found by searching for Delaware and HB 191; official sources were consulted next.

EveryAILaw tracks ongoing compliance duties and deliberately excludes several prohibition, government-only, narrow-content, and exemplar-covered patterns. Its absence results cannot prove universal non-applicability. Existing unrelated work in that repository was preserved; no EveryAILaw files were changed.

## Official-source checks

| Source | Observed | Relevance to this project |
|---|---|---|
| [Delaware HB 191](https://legis.delaware.gov/BillDetail/142752) | Signed and effective April 23, 2026; addresses nonhuman entities using specified medical professional licenses and titles | The described governance site and pre-assessment do not provide those medical services or claim those titles. No applicable duty was identified from this law. |
| [Delaware privacy statute, section 12D-103](https://delcode.delaware.gov/title6/c012d/index.html#12D-103) | Coverage depends on business/resident targeting and consumer-data thresholds, not incorporation alone | EveryAILaw excludes this pattern, but that does not remove possible privacy duties. Relevant volumes and statutory exemptions were not assessed here. |
| [HS 1 for HB 453](https://legis.delaware.gov/BillDetail/143615) | Official record shows out of committee June 18, 2026; no enacted chapter is shown | The surveillance-pricing proposal is not counted as a current duty. The described project does not set individualized consumer prices. |

These are targeted checks, not an exhaustive search of every federal, state, or foreign rule. General privacy, consumer-protection, copyright, contract, and employment duties are not adjudicated by this declaration review.

## Owner-confirmed footprint and screening method

On September 5, 2026, the owner confirmed a Delaware base, global accessibility, and no geographically targeted markets. The owner prefers to retain Regulation in the assessment rather than assert N/A. This is enough to begin a bounded screening; it is not a determination that all jurisdictions apply.

Start with Delaware and the US federal baseline. Screen both provider and deployer roles against the project's actual activities, then expand by a concrete jurisdiction connection. The [provider search](https://everyailaw.com/applicability.html?role=provider&jurisdiction=us) and [deployer search](https://everyailaw.com/applicability.html?role=deployer&jurisdiction=us) are discovery evidence, not determinations. The US filter includes modeled subnational jurisdictions. Preserve the result date and distinguish current binding duties from future, pending, and voluntary material.

Do not use lack of geographic targeting as the only exclusion test. For example, [Texas Business and Commerce Code section 551.002](https://tcss.legis.texas.gov/resources/bc/htm/bc.551.htm) includes a product or service used by Texas residents as a territorial connection. That is a candidate trigger to check, not a finding that every provision applies to aiposture.org. The actual activity, actor definition, provision, and timing must also match.

For each potentially relevant instrument, record the activity and territorial trigger, evidence, current/future status, and one of: applicable, not applicable with reasons, future, or unresolved. An unresolved row does not establish an exemption. This session’s checks are a bounded contribution to the owner’s ongoing regulatory review. The applicability record should be refreshed as evidence and laws change, rather than treated as permanently complete.

The owner approved Regulation 1 as an acknowledgment of ongoing regulatory review, starting with the named scope and expanding when relevant connections arise. The current rubric's affirmative exposure wording should not be read as proof of an identified binding duty. The approved wording is in the [owner review record](self-declaration-readiness.md); no normative change is made here.

Creating EveryAILaw demonstrates work on regulatory discovery. It does not by itself establish an obligation register or a mapped assessment for this separate project, and is not used to raise its Regulation level.

## Owner clarification on ongoing review

The owner states that PAICE.work PBC created EveryAILaw within the PAICE Legal Graph to answer applicability questions for itself and others, and reviews legislative developments frequently. The declaration now reflects that ongoing practice. This records the owner’s description without inventing a fixed cadence, exhaustive coverage, or an independently verified monitoring history.
