# Sprint 2 execution backlog

[Sprint 2 index](../../README.md#sprint-2) | [Dated baseline findings](01_Baseline_Audit.md)

## 1. Status and priority rules

Updated 29 October 2026. This is the local work tracker. The [GitHub Sprint 2 tracker](https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/issues/42) links all 19 work packages. Detailed source evidence for S2-01 to S2-15 is retained in the baseline audit.

Proposed means a candidate has not yet been committed. Planned means work is identified but has not started. In progress means active work. Blocked means a named dependency prevents progress. Verified requires an executed check and supporting result. Deferred means deliberately outside this sprint with a reason.

P0 covers security remediation, data integrity and acceptance blockers. P1 covers required verification and important improvements. P2 covers optional enhancements. Do not interpret severity as proof of an exploitable security defect.

Owners below are proposed from the existing team roles. Confirm them with the team. A checked-in implementation or closed GitHub issue is not sufficient on its own to establish verification.

## 2. Required and candidate work

| ID | Work package | Priority | Proposed owner | Status | Dependency or next action | Completion evidence |
|---|---|---|---|---|---|---|
| S2-01 | Dependency remediation | P0 | Web and mobile owners | In progress. Web tree closed on 27 October at 0 entries. Mobile SDK 58 upgrade reduced the mobile count from 12 to 4 toolchain entries | Record before/after audits for both apps. Decide whether the remaining mobile toolchain entries are accepted for this sprint. Run workflow regressions | Before/after audits, version changes, type/lint/build results and workflow regressions |
| S2-02 | Credential and account remediation, #41 | P0 | Authorised Supabase owner | Pending confirmation | Confirm whether replacement already occurred. Coordinate dependent services | Redacted completion record and service verification |
| S2-03 | Publication-on-insert investigation | P0 | Maqeel and web owner | Fixed 29 October 2026. Live trigger recreated as before insert or update of is_published in the Supabase SQL Editor inside one transaction, verified by trigger inspection. Repository reference copy already matched. The rejection-reason loop that closes the correction workflow is recorded under S2-10. | Isolated database fixture and deployed-schema comparison | Insert/update/re-review tests and any migration retest |
| S2-04 | Strict IoT payload validation | P1 | Gae | Planned, defect reproduced | Agree types, null handling, finite numbers and bounds | Invalid inputs cause zero inserts, valid payloads continue through evaluation |
| S2-05 | IoT interruption recovery | P1 | Gae | Proposed | Define retry, reconnect and bounded buffering or explicit loss policy | Outage/recovery tests and documented limitations |
| S2-06 | Alert escalation policy | P1 | Gae and officer workflow owner | Decision needed | Decide whether critical severity bypasses an earlier lower-severity cooldown | Boundary, duplicate and escalation tests |
| S2-07 | Firmware interval and calibration | P1 | Gae | Planned | Fix interval description. Measure calibration before replacing wet placeholders | Consistent interval output, raw dry/wet observations and calibration record |
| S2-08 | Physical wiring confirmation, #49 | P1 | Hardware holder | Partially confirmed. User confirmed rain D35 on 28 October | Confirm rail voltage, LED resistance, sensor models and assembly photo. Review D-02 draft in #58 | Signed-off pin table matching installed firmware and diagram |
| S2-09 | Alert acknowledgement workflow, #31 | P1 | Gae and web owner | Proposed | Confirm roles and expected resolution behaviour | Authorised action, denied-role test and visible result |
| S2-10 | Observation management scope, #16 | P1 | Nathan | Scope decided 29 October 2026 with the team lead: officer edit and delete of observations excluded, corrections flow through reject with reason then botanist resubmit. Reject-with-reason implemented and browser verified 29 October 2026 in the commits listed under S2-03. Issue 16 updated with the decision. | Inspect remaining routes and confirm required edit/delete scope | Implemented required operations or recorded scope decision, with regression checks |
| S2-11 | Species mutation feedback | P1 | Badrul | Implemented 29 October 2026 in commit c576a72. Web typecheck, lint and build pass. Regression tests still outstanding. | Reproduce missing-row and concurrent-delete cases | Accurate outcome instead of false success, with regression tests |
| S2-12 | Mobile location and permission behaviour | P1 | Basill | Implemented 29 October 2026 in commits 1048d97 and 79ce0b0. Denied permission now offers Open settings. Mobile tsc, expo lint and unit tests pass. Device trials still outstanding. | Verify actual capture interaction and failure messages | Granted/denied/unavailable trials and accurate report wording |
| S2-13 | Correct alert-flow diagram | P1 | Gae and documentation owner | Planned | Show independent rules, cooldown and periodic silence checks | Source-reviewed D-03 and multi-alert scenario |
| S2-14 | Security recommendations close-out | P1 | Ashley and component owners | Planned | Reclassify old Sprint 3 recommendations | Each item has a final status, rationale and owner |
| S2-15 | Acceptance measurements and usability, #39 and #40 | P1 | Basill, Maqeel and Ashley | Blocked on scheduling | Confirm devices, participants and trial dates | Raw results, denominator definitions, findings and retests |
| S2-16 | Whole-scope test coverage | P1 | Component owners | Planned | Define API/sync denominator before adding tests | Coverage report against the proposal target, exclusions and remaining gaps |
| S2-17 | Diagrams and evidence packaging, #55 | P1 | Ashley with component owners | In progress. D-02 image and online-editable draft generated for #58 | User review of physical wiring draft. Continue documents 03 and 04 | Readable figures, verified captions and accessible evidence index |
| S2-18 | Report, sign-off and rehearsal | P1 | Ashley and whole team | Planned | Arrange Sprint 2 slot and draft alongside engineering work | Completed report, actual meeting outcome and timed rehearsal |
| S2-19 | GitHub reconciliation | P1 | Team lead and issue owners | Planned | Compare #16, #21, #27 to #31 and #39 to #41 with final scope | Accurate issue text and linked completion evidence |

## 3. First implementation package

S2-04 is the first bounded code task because it has a local reproduction and testable outcomes. It does not displace the scheduling priority of security triage.

1. Specify required fields and permitted nulls according to actual firmware fault output.
2. Require Boolean types for movement and rain. Exclude Booleans from numeric fields.
3. Reject non-finite numeric values and percentages outside 0 to 100.
4. Define temperature bounds using the actual sensor contract rather than inventing ecological limits.
5. Reject invalid input before database insertion or alert evaluation.
6. Add tests for individual invalid fields, missing fields, null handling, valid boundaries and foreign node identity.
7. Run the full IoT suite and preserve the before/after result.
8. Update the contract and report change register after verification.

## 4. Optional enhancement pool

These are considerations, not promises. Promote an item only when a user need, owner, effort estimate, verification method and available time are recorded. Retain testing and submission time.

| Candidate | Potential benefit | Conditions for selection |
|---|---|---|
| Clearer sync progress and recovery guidance | Helps users understand pending, failed and conflicting records | Select based on walkthrough findings and test retries |
| Better monitoring status and stale-data messaging | Helps officers distinguish current data from an interrupted connection | Test loading, timeout, recovery and selected ranges |
| Configurable alert thresholds and trigger context | Explains why an alert occurred and supports tuning | Resolve #30 scope and storage/configuration implications |
| Photo coverage and catalogue polish | Makes populated workflows clearer | Count distinct species with photos and preserve attribution |
| Stronger CSP and public-field minimisation | Addresses historical security recommendations | Check framework guidance, compatibility and public functionality |
| Automated recurring dependency checks | Makes reassessment repeatable | Define execution schedule, ownership and triage process |
| MQTT transport | Supports a different deployment arrangement | Core integration stable, hardware/network available, payload and reconnect tests planned |
| On-board GPS | Supports relocating nodes | Hardware available and actual need established. Fixed nodes currently use deployment coordinates |
| Offline maps | Supports location review without connectivity | Storage, licensing and offline behaviour evaluated |
| Predictive alerts | Could identify gradual changes | Adequate labelled/history data and credible evaluation method |
| Assisted species identification | Supports optional Objective 5 | Tutor/team agreement, suitable data and measurable validation. See the design proposal |

## 5. Schedule and control points

| Date | Target | Exit condition |
|---|---|---|
| 27 October | Audit and documentation organisation | Baseline recorded and plans discoverable |
| 28 October | Scope, tests and security triage | Owners, trial environments, acceptance criteria and dependency choices agreed |
| 29 to 30 October | Essential implementation | Relevant checks pass for each completed change |
| 31 October | Integrated mobile/web and IoT trials | Traceable observed results and failures recorded |
| 1 November | Usability and release security checks | Participant records and scoped security outcomes available |
| 2 November | Fix and retest | Significant failures resolved or explicitly recorded as limitations |
| 3 November | Full report draft and target sign-off | Draft complete. Meeting date remains subject to tutor confirmation |
| 4 November | Feedback and rehearsal | Review actions addressed and core demo timed |
| 5 November | Submission-ready package | PDF visually checked and supporting evidence accessible |
| 6 November | Submission | Uploaded files and receipt verified |

After 2 November, prioritise essential fixes and delivery work. Record any scope change with its reason and effect on testing time.

## 6. Decision register

| Decision | Current state | Who confirms |
|---|---|---|
| Sprint 1 cutoff for change attribution | Pending | Team lead |
| Rain input and shield power | User confirmed D35 on 28 October 2026. Shield voltage remains unresolved | Hardware holder |
| Alert escalation and acknowledgement | Pending | IoT and officer workflow owners |
| Required observation edit/delete behaviour | Pending | Web owner and team lead |
| Physical devices and usability participants | Availability unconfirmed | Team |
| Sign-off date and presentation split | Unconfirmed | Sue Han and team |
| Submission time and required attachments | Unconfirmed | Team |

Record future decisions with date, decision-maker, rationale and affected S2 IDs. Do not replace the historical audit with an updated claim of success.
