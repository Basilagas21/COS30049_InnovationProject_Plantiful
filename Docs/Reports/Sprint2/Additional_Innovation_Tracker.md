# Sprint 2 Additional Innovation tracker

Status recorded on 4 November 2026. Update this file when deployment or new evidence changes the status. This is the sprint-facing index for AI Field Assist, not a replacement for the implementation guide or test results.

## Current position

The owner subsequently reported that the migration tables are visible in Supabase. This is owner-reported progress, not a completed deployed-policy or end-to-end test. Local configuration and the precise resume steps are recorded in the [handover note](Additional_Innovation_Handover.md).

AI Field Assist code is implemented and development checks pass. Deployment, real provider identification and participant evaluation are outstanding. Do not describe the optional innovation as fully delivered or its benefits as proven until those gates are completed.

## Work and issue register

All issues use the `(Additional_Innovation)` title prefix and are assigned to Basilagas21. Their linked discussions record the implementation update.

| Issue | Work | Recorded status | Next evidence or action |
|---|---|---|---|
| [#76](https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/issues/76) | Provider feasibility | Official documentation reviewed. Pl@ntNet and Kindwise adapters implemented | Confirm target species, configure accounts and run the comparison |
| [#77](https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/issues/77) | Offline evidence checklist | Implemented in capture, discovery, edit and record details | Capture physical-phone save, reopen and sync outcomes |
| [#78](https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/issues/78) | Reviewed guidance and species mapping | Guidance editor, revisions and alias mapping implemented | Supply source-backed, botanically reviewed guidance |
| [#79](https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/issues/79) | Identification history and human decisions | Migration and local access-policy checks prepared | Apply migration and verify deployed access and storage policies |
| [#80](https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/issues/80) | Authenticated identification API | Provider adapters, private evidence archive, deduplication and request limits implemented | Configure server credentials and run a live smoke test |
| [#81](https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/issues/81) | Mobile AI Field Assist | Suggestions, provisional decisions, unidentified state and cached history implemented | Configure backend URL and test on the phone |
| [#82](https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/issues/82) | Officer identification review | Evidence previews, corrections and decision history implemented | Verify the complete collector-to-officer flow and retain screenshots |
| [#83](https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/issues/83) | Accuracy, workflow and reliability evaluation | Benchmark runner, test protocol and empty participant template prepared | Run labelled provider trials and participant comparisons |
| [#84](https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/issues/84) | Delivery and report evidence | Guide, verification record and report section added | Integrate final results, captions, limitations and release status |

## Development verification snapshot

| Check | Result | What it establishes |
|---|---|---|
| Web typecheck | Passed | Type consistency |
| Web lint | Zero errors, three existing warnings | Static checks within the recorded scope |
| Web tests | 42 passed | Application and fixture-based API behaviour |
| Web production build | Passed | Production bundle generation |
| Mobile typecheck and lint | Passed | Type consistency and static checks |
| Mobile tests | 21 passed | Helper and regression behaviour |
| Android Metro export | Passed | Bundle and asset generation |
| Isolated database checks | 10 passed | Migration and access behaviour in the local fixture |

See the [verification record](../../Testing/Additional_Innovation/Verification.md) for failures, retests and reproduction details. These are not live provider accuracy results, physical-phone test results or participant outcomes.

## Activation and evaluation checklist

- [ ] Record the reviewed commit or release revision containing this implementation.
- [ ] Apply `backend/migrations/013_field_assist.sql` to the intended Supabase deployment.
- [ ] Verify deployed access policies and the private evidence archive.
- [ ] Configure server-only provider and Supabase service credentials.
- [ ] Set `AI_PROVIDER` and mobile `EXPO_PUBLIC_FIELD_ASSIST_URL`.
- [ ] Confirm the target catalogue through authorised access.
- [ ] Obtain independently confirmed plant photographs with provenance.
- [ ] Run a live provider smoke test and retain actual results.
- [ ] Compare providers and record the final provider decision.
- [ ] Verify offline capture, retry, changed-photo detection and decision history on a phone.
- [ ] Verify officer confirmation, correction and evidence requests.
- [ ] Run the participant comparison and retain anonymised outcomes.
- [ ] Measure load and cost before making scalability claims.
- [ ] Update the report and GitHub issues from retained evidence.

## Planned visual evidence

| ID | Capture | Explanation to place beside it |
|---|---|---|
| AI-IMG-01 | Capture form with evidence checklist | Missing evidence is visible and offline save remains possible |
| AI-IMG-02 | Upload-required state and actual candidate results | Connectivity boundary and unverified suggestion status |
| AI-IMG-03 | Collector provisional choice or unidentified decision | Human assessment remains separate from model output |
| AI-IMG-04 | Officer review with archived photographs and history | Original evidence and traceable review decisions |
| AI-IMG-05 | Changed-evidence or failed-request state | Stale suggestions and provider failures are handled explicitly |

No captures are recorded in this table yet. Label fixture demonstrations separately from live provider outcomes. Record app revision, device, date and test ID with each capture. Redact account details and credentials.

## Where to use this in the Sprint 2 report

| Report section | Material to include |
|---|---|
| 3.6 Optional Additional Innovation | Implemented workflow, contribution and current delivery boundary |
| 4 Architecture and integration | Authenticated request flow, evidence archive, data model and offline boundary |
| 5 Testing plan | Provider comparison, device checks and participant protocol |
| 6 Results | Recorded development checks first, then actual live and participant results when available |
| 7 Usability | Relevant captures, observed problems and measured task outcomes |
| 9 Deliverables and readiness | Migration, configuration, release revision and remaining acceptance gates |

## Supporting documents

- [Sprint 2 report](Sprint_Report_2.md#36-optional-additional-innovation-implementation)
- [AI Field Assist implementation and setup](../../Guides/AI_Field_Assist.md)
- [Evaluation protocol and templates](../../Testing/Additional_Innovation/README.md)
- [Development verification record](../../Testing/Additional_Innovation/Verification.md)
- [Main GitHub tracking issue #84](https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/issues/84)
