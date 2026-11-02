# Plantiful Sprint 2 Management Plan

[Documentation index](../../README.md#sprint-2) | [Sprint 2 report](Sprint_Report_2.md) | [GitHub Sprint 2 tracker](https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/issues/42)

This is the single working plan for Sprint 2. It consolidates the dated baseline audit, the execution backlog, the testing and evidence plan, the diagrams and hardware plan, and the report and sign-off plan that were previously held in five separate files. The [Sprint 2 report](Sprint_Report_2.md) remains the separate submission document.

## Document control

| Field | Value |
|---|---|
| Version | 1.0, consolidated 2 November 2026 |
| Reporting period | 27 October to 6 November 2026 |
| Source baseline | Commit `64e69b4`, dated 27 October 2026 |
| Audit snapshot | 27 October 2026. Later work is recorded in the work package register |
| Submission deadline | 6 November 2026, submission time to be confirmed |
| Internal completion target | 5 November 2026 |
| Product assessment target | At least 36/40, equivalent to 90 percent |
| Status | Active management plan. Not a final report |
| Sign-off | Sprint 1 completed according to the team. Sprint 2 meeting pending |

## Contents

1. [Purpose and assessment basis](#1-purpose-and-assessment-basis)
2. [Baseline and provenance](#2-baseline-and-provenance)
3. [Work package register and schedule](#3-work-package-register-and-schedule)
4. [Testing and evidence plan](#4-testing-and-evidence-plan)
5. [Usability evaluation](#5-usability-evaluation)
6. [Diagrams and hardware](#6-diagrams-and-hardware)
7. [Report, sign-off and demonstration](#7-report-sign-off-and-demonstration)
8. [Submission readiness](#8-submission-readiness)

## 1. Purpose and assessment basis

Sprint 2 will complete and refine the prototype through integration, enhancements, testing, bug fixing and demonstration preparation. This follows Sue Han's guidance supplied by the team. The product rubric allocates ten marks each to Testing Plan, Test Results, Prototype and Software Usability. The target is an ambition, not a predicted grade.

The final presentation and Learning Summary Report are separate individual assessments. The reported demonstration slot is approximately 10 to 20 minutes including questions. The exact split is unconfirmed. No report page limit has been confirmed.

This plan records a cross-component source review, GitHub issue review and local checks. It is not a complete penetration test, device trial or physical hardware verification. Existing October evidence is historical until its applicability to the final release is checked.

The plan supports four purposes.

1. Preserve the dated baseline as a historical snapshot.
2. Track every Sprint 2 work package against a completion condition.
3. Define the evidence needed for each rubric criterion.
4. Control report finalisation, sign-off and submission.

## 2. Baseline and provenance

The working tree was clean at the start of the audit. The latest commit was `64e69b4`, dated 27 October, for document organisation and SQL updates. The preceding monitoring commits are dated 16 October. Their existence alone does not establish that they are Sprint 2 work.

Keep three artefacts distinct. The submitted `Basilagas21/Docs and templates/sprint1.pdf` is the historical submission. `Docs/Reports/Sprint1/Sprint_Report_1.md` is a revised document. The current repository is the implementation baseline. Confirm the team's Sprint 1 cutoff before attributing changes to Sprint 2.

The earlier chat estimate of 55/100 is not an awarded mark. PDF text extraction does not establish the absence or visual quality of embedded images. This plan uses the four product criteria rather than penalising the sprint report for proposal sections.

### 2.1 Implementation inventory

| Area | Source inspected | What is present | Verification still needed |
|---|---|---|---|
| Mobile capture | `mobile/src/app/capture/new.tsx`, `mobile/src/lib/location.ts`, `mobile/src/db.ts` | Camera handling, device location support, SQLite persistence and measurement storage | Device capture, permission denial, restart persistence, QR lookup and photo trials |
| Synchronisation | `mobile/src/app/(tabs)/sync.tsx`, `mobile/src/lib/sync-edit.ts` | Device-identity lookup, photo repair, revision-checked edits, conflict state and attempt measurements | Interrupted uploads, repeated sync, two-client conflicts and cross-owner denial |
| Web records | `web/src/app/records/actions.ts`, `web/src/app/records/[id]/page.tsx` | Record details and officer approval or rejection | Issue #16 also requests record editing and deletion. Do not equate species CRUD with observation CRUD |
| Species management | `web/src/app/species/actions.ts` | Officer-gated create, update and delete operations | Live mutation results, publication boundaries and missing-row handling |
| Backend | `backend/supabase/migrations/001_schema.sql`, `apply_project.sql`, `012_monitoring_history.sql` | Ten tables in the base schema, RLS, review and publication rules, history RPC migration | Final deployed-schema comparison and role-based verification |
| IoT | `iot/sketch_oct9a/sketch_oct9a.ino`, `bridge.py`, `evaluate.py`, `publisher.py` | Serial hardware path, separate synthetic publisher, immediate and periodic evaluation | Wiring confirmation, calibration, actual transport confirmation and physical trials |
| Monitoring | `web/src/app/api/telemetry/route.ts`, `web/src/components/monitoring-dashboard.tsx` | Officer and admin access, sensor and time filters, live data, history and alert status display | Browser interactions, failure and recovery states and alert acknowledgement requirement |
| Security evidence | `Docs/Security/Evidence/checks/`, `Docs/Security/Evidence/zap/` | Historical SQL and HTTP checks, ZAP JSON and HTML reports, before and after summary | Final-release dependency, role, storage and scan reassessment |

The base schema includes `plant_record_photos` as well as the other listed entities. Recount the final deployed schema when preparing the ERD rather than copying a historical table count.

### 2.2 Local checks executed on 27 October

The host is Windows. Reported runtimes are Node.js 24.19.0, npm 11.17.0 and Python 3.13.14. Declared application versions at the start of the checks were Next.js 16.3.6, Expo 57.0.24 and React Native 0.86.3. The mobile project was upgraded later on the same day, as recorded in 2.3. Exact device and browser versions remain to be recorded during trials.

Commands below use the repository root unless a working directory is specified.

| Check | Command | Observed result | Scope |
|---|---|---|---|
| Web types | `web/node_modules/.bin/tsc.cmd --noEmit --incremental false -p web/tsconfig.json` | Pass | Static typing |
| Mobile types | `mobile/node_modules/.bin/tsc.cmd --noEmit --incremental false -p mobile/tsconfig.json` | Pass | Static typing |
| Web lint | `npm run lint` in `web` | Zero errors, one existing image optimisation warning | Source lint |
| Mobile lint | `npm run lint` in `mobile` | Pass | Expo lint |
| Web production build | `npm run build` in `web` | Pass | Compilation and route generation, not live workflow verification |
| Mobile edit helper | `npm test` in `mobile` | 3 passed | Mocked revision-checked edit behaviour |
| Measurement summariser | `python -B -m unittest discover -s mobile/scripts -p 'test_*.py' -v` | 2 passed | Denominators and zero-sample behaviour |
| IoT suite | `python -B -m unittest discover -s iot -p 'test_*.py' -v` | 7 passed | Mocked serial ingestion and evaluation |
| Web dependency audit | `npm audit --omit=dev --json` in `web` | 3 affected package entries, 1 critical and 2 high | Registry advisory matching |
| Mobile dependency audit | `npm audit --omit=dev --json` in `mobile` | 12 affected package entries, 1 critical, 5 high and 6 moderate | Registry advisory matching |

The existing unit suites total 12 passing tests. This is not whole-system test coverage. The helper coverage cited in Sprint 1 does not establish the proposal's greater-than-80-percent backend API and mobile sync target.

Web lint identifies the QR data-URL image at `web/src/app/records/[id]/page.tsx:98`. The build reports an ignored lockfile outside the repository. The mobile tests report a module-type warning. These are not failed acceptance trials.

### 2.3 Expo SDK 58 upgrade on 27 October

The mobile project was upgraded from Expo SDK 57 to SDK 58 to match the Expo Go client installed on the test phone. The resulting versions were Expo 58.0.19, React Native 0.88.0, React 19.3.0, Expo Router 58.0.26 and TypeScript 6.0.3. The `expo.install.exclude` entry was removed so that dependency validation covers the core package.

The upgrade was verified with the following checks.

| Check | Observed result |
|---|---|
| `npx tsc --noEmit` | Pass, after narrowing the tab icon colour from `ColorValue` to a string |
| `npx expo lint` | Pass |
| `npx expo-doctor` | 20 of 20 checks passed |
| `npm test` | 3 passed |
| `npx expo export --platform android` | Bundle exported |
| `npm audit --omit=dev` | 4 entries, 1 critical and 3 high, all in the Expo toolchain |

The dependency count fell from 12 to 4 entries. The critical entry was the transitive `shell-quote` package. The automatic fix path proposed Expo 54, which is a breaking downgrade, so it was rejected. The device-level checks for camera, location, SQLite and sync still need a physical run on the upgraded build.

The web dependency findings were also addressed on 27 October. Next.js and `eslint-config-next` moved from 16.3.6 to 16.4.3. The non-breaking audit fix resolved `source-map-js`. The production audit then reported 0 entries. The web type check and production build passed, and lint reported 0 errors and the existing image warning. The build compiled all 19 routes.

| Web check after remediation | Observed result |
|---|---|
| `npx tsc --noEmit` | Pass |
| `npm run lint` | 0 errors, 1 image warning |
| `npm run build` | Pass, 19 routes |
| `npm audit --omit=dev` | 0 entries |

#### 2.3.1 Dependency synchronisation on 2 November

The installed mobile packages had drifted behind the declared SDK 58 patch versions. `npx expo install --fix` synchronised the tree to Expo 58.0.22, React Native 0.88.1, Expo Router 58.0.29 and React 19.3.0. TypeScript remains 6.0.3. `npm audit --omit=dev --json` then reported 0 production entries across 575 production dependencies. This result covers the recorded audit scope only. It does not establish that the application has no exploitable defect.

The project now uses a development build instead of the Expo Go client. The build decision and its verification are recorded in section 8.2.

### 2.4 Security baseline has changed

The fresh web audit listed `next`, `sharp` and `source-map-js`. npm suggested Next.js 16.4.3 as a remediation candidate. Compatibility and the matching ESLint configuration were reviewed before the update.

The mobile audit included a critical `shell-quote` entry and high entries involving Expo tooling, `node-forge`, `source-map-js` and `zod`. Its suggested automatic remediation included an Expo downgrade and an Expo Router major upgrade. A forced audit fix was not applied. The dependency paths and SDK compatibility were reviewed first.

An advisory match does not prove application-level exploitability. Equally, the previous statement that all mobile findings have no runtime reach cannot be reused without a fresh dependency-path analysis. The router-related entries received explicit review.

The historical ZAP summary describes spidering and passive scanning with anonymous and officer sessions. It records residual CSP weaknesses. This is not exhaustive active penetration testing and it is not proof that no injection vulnerability exists.

### 2.5 GitHub reconciliation

Issues were read through GitHub CLI on 27 October. Their statuses have not been changed by the audit. An open issue is not by itself proof that implementation is absent.

| Issue | Status at audit | Reconciliation completed or needed |
|---|---|---|
| #16 | Open | Observation edit and delete scope separated from species CRUD in #33. Scope decision recorded during Sprint 2 |
| #21 | Open | Last-write-wins description replaced with the implemented compare-and-swap policy and linked to #39 evidence |
| #23 | Open | Three-record offline, restart and reconnect trial retained with the publication workflow |
| #27 | Open | MQTT contract is not the implemented serial path. Transport decision and payload contract recorded |
| #28 | Open | Synthetic publisher exists but writes through REST rather than the stated MQTT broker |
| #29 | Open | Serial bridge exists. Validation strengthened and `stations` terminology reconciled with `sensors` |
| #30 | Open | Rules exist as Python constants. Config-driven rules and the persisted triggering value still need review |
| #31 | Open | Implementation permits officers and admins, not only admins. Status display exists and acknowledgement was reviewed |
| #32 | Open | Sprint separator, not a deliverable |
| #39 | Open | Two-client conflict, retry and cross-owner evidence still required |
| #40 | Open | QR and sync measurements and usability sessions still required |
| #41 | Open | Credential remediation requires completion evidence |
| #33 to #36 | Closed | Species CRUD, reports, map and photos have closed issues. Include them in regression scenarios rather than claiming new Sprint 2 delivery |

Use the repository URL `https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/issues/NUMBER` for individual issue references.

## 3. Work package register and schedule

Updated 2 November 2026. This is the authoritative local work tracker. The [GitHub Sprint 2 tracker](https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/issues/42) links all 19 work packages. Detailed source evidence for S2-01 to S2-15 was recorded in the baseline audit and is summarised here.

### 3.1 Status and priority rules

Proposed means a candidate has not yet been committed. Planned means work is identified but has not started. In progress means active work. Blocked means a named dependency prevents progress. Verified requires an executed check and supporting result. Deferred means deliberately outside this sprint with a reason. Fixed means the change is present on a recorded branch or in the working tree, but does not by itself mean the change is integrated into the release.

P0 covers security remediation, data integrity and acceptance blockers. P1 covers required verification and important improvements. P2 covers optional enhancements. Do not interpret severity as proof of an exploitable security defect.

Owners are proposed from the existing team roles. Confirm them with the team. A checked-in implementation or closed GitHub issue is not sufficient on its own to establish verification.

### 3.2 Register

| ID | Work package | Baseline finding or evidence | Priority | Proposed owner | Status | Next action | Completion evidence |
|---|---|---|---|---|---|---|---|
| S2-01 | Dependency remediation | Fresh audits reported critical and high package entries | P0 | Web and mobile owners | In progress. Web tree 0 entries on 27 October. Mobile synchronised to 58.0.22 with 0 production entries on 2 November | Record before and after audits for both apps, rerun workflow regressions and state the audit scope | Before and after audits, version changes, type, lint, build and workflow results |
| S2-02 | Credential and account remediation, #41 | GitHub #41 remains open | P0 | Authorised Supabase owner | Pending confirmation | Confirm whether replacement occurred. Coordinate dependent services and test-password reset | Redacted completion record and service verification |
| S2-03 | Publication-on-insert investigation | `apply_project.sql:342-345` attached the publication gate only to updates. Species creation accepted `is_published` and officer inserts did not enforce an approved observation | P0 | Maqeel and web owner | Fixed 29 October. Live trigger recreated for insert or update of `is_published`. Legacy botanist policies dropped and verified by live REST probes | Keep the 18-of-18 script result with the release evidence | Isolated fixture, insert and update tests, re-review tests and migration retest |
| S2-04 | Strict IoT payload validation | Locally reproduced with `FakeSupabase`. `humidity=150`, `soil_moisture=-10` and `movement=2` passed bridge validation and reached the fake insert. Movement generated an alert | P1 | Gae | Planned, defect reproduced | Agree types, null handling, finite numbers and bounds. Reject before insert or evaluation | Invalid inputs cause zero inserts. Valid payloads continue through evaluation |
| S2-05 | IoT interruption recovery | `bridge.py` exits on an uncaught Supabase failure in the ingestion loop and on serial loss | P1 | Gae | Proposed | Define retry, reconnect and bounded buffering or an explicit loss policy | Outage and recovery tests plus documented limitations |
| S2-06 | Alert escalation policy | Alert cooldown in `evaluate.py` keys on alert type, not severity | P1 | Gae and officer workflow owner | Decision needed | Decide whether critical severity bypasses an earlier lower-severity cooldown | Boundary, duplicate and escalation tests |
| S2-07 | Firmware interval and calibration | Firmware uses `REPORT_INTERVAL=2000` but prints a four-second startup message. Wet calibration values are labelled placeholders | P1 | Gae | Planned | Fix interval presentation. Measure calibration before replacing wet placeholders | Consistent interval output, raw dry and wet observations and a calibration record |
| S2-08 | Physical wiring confirmation, #49 | Supplied wiring listed both D33 and D35 for rain. Firmware uses GPIO 35. User confirmed D35 on 28 October | P1 | Hardware holder | Partially confirmed | Confirm rail voltage, LED resistance, sensor models and assembly photo. Review the D-02 draft in #58 | Signed-off pin table matching installed firmware and diagram |
| S2-09 | Alert acknowledgement workflow, #31 | Dashboard renders resolved and open status and filters, but the reviewed component provides no acknowledgement control requested by #31 | P1 | Gae and web owner | Proposed | Confirm roles and expected resolution behaviour | Authorised action, denied-role test and visible result |
| S2-10 | Observation management scope, #16 | #16 requires observation edit and delete. Reviewed record actions provided approval only, while species CRUD is separate | P1 | Nathan | Scope decided 29 October. Officer edit and delete of observations excluded. Corrections flow through reject with reason then botanist resubmit. Reject with reason implemented and browser verified. Database layer aligned 31 October | Inspect remaining routes and confirm the recorded scope | Implemented operations or recorded scope decision with regression checks |
| S2-11 | Species mutation feedback | Species update and delete returned success without checking affected rows | P1 | Badrul | Implemented 29 October. Missing-row, concurrent-delete, denied-role and happy paths verified through the live UI and deployed database on 30 October. Follow-up comment posted on #50 | Add automated web regressions when a web test runner exists | Accurate outcome instead of false success, with regression tests |
| S2-12 | Mobile location and permission behaviour | Mobile location capture is attached to a Capture GPS action in `capture/new.tsx:73-87,352` | P1 | Basill | Implemented 29 October, extended 1 November to the discover and record edit screens after a device trial found the recovery alert missing there. Trial on Pixel 9 Pro XL, Android 17, Expo Go 58.0.5 passed granted, denied, regrant and location-service-off cases | Verify wording in the report and retain the raw trial record for #51 | Granted, denied and unavailable trials with accurate report wording |
| S2-13 | Correct alert-flow diagram | Existing Mermaid alert diagram branches as if heat, drought and movement were mutually exclusive. Evaluator checks them independently | P1 | Gae and documentation owner | Planned | Show independent rules, cooldown and periodic silence checks | Source-reviewed D-03 and a multi-alert scenario |
| S2-14 | Security recommendations close-out | Existing security report schedules some recommendations for Sprint 3, while the current delivery is final Sprint 2 | P1 | Ashley and component owners | Planned | Reclassify each as a Sprint 2 commitment or an explicitly deferred post-project enhancement | Each item has a final status, rationale and owner |
| S2-15 | Acceptance measurements and usability, #39 and #40 | Acceptance measurements and participant results remain open | P1 | Basill, Maqeel and Ashley | Blocked on scheduling | Confirm devices, participants and trial dates | Raw results, denominator definitions, findings and retests |
| S2-16 | Whole-scope test coverage | Mobile suite at 4 tests. Node coverage reports `sync-edit.ts` at 100 percent statements, branches and functions. Wider mobile surface, `db.ts`, screens and all web code remain uncovered. Web has no test runner | P1 | Component owners | In progress 1 November | Define the API and sync denominator before adding tests | Coverage report against the proposal target, exclusions and remaining gaps |
| S2-17 | Diagrams and evidence packaging, #55 | Figure specifications and the D-02 draft exist | P1 | Ashley with component owners | In progress. D-02 image and online-editable draft generated for #58 | User review of the physical wiring draft. Continue sections 4 and 6 of this plan | Readable figures, verified captions and an accessible evidence index |
| S2-18 | Report, sign-off and rehearsal | Final report and meeting evidence remain outstanding | P1 | Ashley and whole team | Planned | Arrange the Sprint 2 slot and draft alongside engineering work | Completed report, actual meeting outcome and timed rehearsal |
| S2-19 | GitHub reconciliation | Issue statuses and evidence comments are incomplete | P1 | Team lead and issue owners | In progress 1 November. #16, #21, #44, #50 and #51 carry dated evidence comments. #21 gap closed | Compare #16, #21, #27 and #31, and #39 to #41, with final scope | Accurate issue text and linked completion evidence |

### 3.3 Priority notes

P0 items take precedence over optional enhancements. S2-03 is a source-level concern, not a claim that the live database was exploited. S2-04 establishes a bridge validation defect with a fake client. Database constraints may reject some payloads later, so this does not prove malformed data was stored in Supabase.

The first bounded code improvement should be S2-04 because it has a local reproduction and clear regression criteria. Security dependency triage and authorised credential work should proceed with higher scheduling priority.

### 3.4 First implementation package for S2-04

1. Specify required fields and permitted nulls according to actual firmware fault output.
2. Require Boolean types for movement and rain. Exclude Booleans from numeric fields.
3. Reject non-finite numeric values and percentages outside 0 to 100.
4. Define temperature bounds using the actual sensor contract rather than inventing ecological limits.
5. Reject invalid input before database insertion or alert evaluation.
6. Add tests for individual invalid fields, missing fields, null handling, valid boundaries and foreign node identity.
7. Run the full IoT suite and preserve the before and after result.
8. Update the contract and report change register after verification.

### 3.5 Ownership

Ownership follows the roles in the root README. It is proposed and needs team confirmation.

| Work package | Proposed lead | Acceptance evidence |
|---|---|---|
| Mobile capture, QR and usability | Basill | Device trials, task observations and refinement retests |
| Sync and backend integrity | Maqeel | Three-record trial, interrupted upload, stale revision and role tests |
| Web observations | Nathan | Record workflow tests and accurate user feedback |
| Web species, maps and reports | Badrul | CRUD, publication, export and map checks |
| IoT validation and physical trials | Gae | Negative payload tests, calibration, wiring and reading-to-alert trail |
| Integration, evidence and sign-off | Ashley with the team | Evidence index, rehearsal, meeting record and delivery checks |
| Security dependency and account work | Relevant component owners and authorised Supabase owner | Audits, dependency analysis, redacted remediation and retests |

### 3.6 Schedule and control points

| Date | Target | Exit condition |
|---|---|---|
| 27 October | Audit and documentation organisation | Baseline recorded and plans discoverable |
| 28 October | Scope, tests and security triage | Owners, trial environments, acceptance criteria and dependency choices agreed |
| 29 to 30 October | Essential implementation | Relevant checks pass for each completed change |
| 31 October | Integrated mobile and web and IoT trials | Traceable observed results and failures recorded |
| 1 November | Usability and release security checks | Participant records and scoped security outcomes available |
| 2 November | Fix and retest | Significant failures resolved or explicitly recorded as limitations |
| 3 November | Full report draft and target sign-off | Draft complete. Meeting date remains subject to tutor confirmation |
| 4 November | Feedback and rehearsal | Review actions addressed and core demo timed |
| 5 November | Submission-ready package | PDF visually checked and supporting evidence accessible |
| 6 November | Submission | Uploaded files and receipt verified |

After 2 November, prioritise essential fixes and delivery work. Record any scope change with its reason and effect on testing time.

Do not label the sign-off date as booked until Sue Han confirms it. Diagrams and report writing should progress alongside implementation.

### 3.7 Decision register

| Decision | Current state | Who confirms |
|---|---|---|
| Sprint 1 cutoff for change attribution | Pending | Team lead |
| Rain input and shield power | User confirmed D35 on 28 October. Shield voltage remains unresolved | Hardware holder |
| Alert escalation and acknowledgement | Pending | IoT and officer workflow owners |
| Required observation edit and delete behaviour | Decided 29 October. Officer content edit and delete excluded | Web owner and team lead |
| Physical devices and usability participants | Availability unconfirmed | Team |
| Sign-off date and presentation split | Unconfirmed | Sue Han and team |
| Submission time and required attachments | Unconfirmed | Team |

Record future decisions with date, decision-maker, rationale and affected S2 IDs. Do not replace the historical audit with an updated claim of success.

### 3.8 Optional enhancement pool

These are considerations, not promises. Promote an item only when a user need, owner, effort estimate, verification method and available time are recorded. Retain testing and submission time.

| Candidate | Potential benefit | Conditions for selection |
|---|---|---|
| Clearer sync progress and recovery guidance | Helps users understand pending, failed and conflicting records | Select based on walkthrough findings and test retries |
| Better monitoring status and stale-data messaging | Helps officers distinguish current data from an interrupted connection | Test loading, timeout, recovery and selected ranges |
| Configurable alert thresholds and trigger context | Explains why an alert occurred and supports tuning | Resolve #30 scope and storage and configuration implications |
| Photo coverage and catalogue polish | Makes populated workflows clearer | Count distinct species with photos and preserve attribution |
| Stronger CSP and public-field minimisation | Addresses historical security recommendations | Check framework guidance, compatibility and public functionality |
| Automated recurring dependency checks | Makes reassessment repeatable | Define execution schedule, ownership and triage process |
| MQTT transport | Supports a different deployment arrangement | Core integration stable, hardware and network available, payload and reconnect tests planned |
| On-board GPS | Supports relocating nodes | Hardware available and actual need established. Fixed nodes currently use deployment coordinates |
| Offline maps | Supports location review without connectivity | Storage, licensing and offline behaviour evaluated |
| Predictive alerts | Could identify gradual changes | Adequate labelled or history data and a credible evaluation method |
| Assisted species identification | Supports optional Objective 5 | Tutor and team agreement, suitable data and measurable validation. See the design proposal |

## 4. Testing and evidence plan

### 4.1 Definition of Done

A deliverable is verified when its acceptance criteria are satisfied on a recorded version, relevant regression checks pass, observed failures are resolved or explicitly accepted with a reason, and supporting evidence is indexed. Compilation alone does not establish device or user success.

| Quality attribute | Acceptance basis | Measurement or check |
|---|---|---|
| Offline reliability | Proposal target greater than 95 percent sync success with no observed data loss | Count all attempts, successes, failures, conflicts and retries. Also group by scenario |
| QR performance | Proposal target less than five seconds average scan-to-record | Distinguish the full user task from decoder-callback lookup timing |
| Code quality | Proposal target greater than 80 percent coverage on backend API and mobile sync | Define denominator and exclusions. Helper-only coverage is insufficient |
| Access control | Agreed role matrix and ownership restrictions | Allowed and denied operations, including direct backend requests |
| Data integrity | No unintended duplicate or silent overwrite in the tested scenarios | Record and photo IDs, revisions, retry and conflict observations |
| Usability | Relevant guidelines, clear navigation and successful tasks | Participant completion, assistance, errors, timings and retest findings |
| IoT correctness | Actual payload contract, calibration and alert policy | Valid and invalid readings, multiple rules, cooldown, silence and recovery |

Sample sizes, network conditions and additional timing targets must be agreed before trials. A result outside a target remains a failure or limitation until addressed, not a reason to change the target retrospectively.

### 4.2 Environment record

Complete one record per distinct environment. Use a test account identifier rather than a password.

| Field | Value to record |
|---|---|
| Test ID and date | Test identifier, date, time zone and tester |
| Version | Commit, mobile build and firmware version |
| Device | Phone model and OS, host OS and browser version |
| Backend | Test project identifier and migration version, with no credentials |
| Network | Connected, disconnected, restricted or deliberately interrupted |
| Account role | Anonymous, botanist A, botanist B, officer or administrator |
| IoT | Board, sensor models, pin map, power, calibration, transport and evaluator schedule |
| Preconditions | Cached catalogue, baseline revision, fixtures and permissions |
| Cleanup | Test records to remove, retained evidence and restoration checks |

The dated local software environment and existing check results are in section 2. Do not copy that environment into physical trials without checking the actual equipment.

### 4.3 Trial procedures

#### INT-01. Offline persistence and publication workflow

1. Prepare the catalogue and sign in as the test botanist.
2. Disconnect the device and capture at least three observations with photos.
3. Record local identifiers and confirm pending status.
4. Close and reopen the application. Check field values and photos.
5. Reconnect and synchronise. Record all attempts.
6. Match the remote observations and photographs to the local records.
7. Synchronise again and verify no unintended duplicates.
8. Complete the officer review and permitted publication steps. Check the anonymous view.

Pass requires persistence, correct transferred content and the expected visibility. A screenshot of the capture form alone does not establish completion.

#### INT-02 and INT-03. Retry and conflict behaviour

Interrupt an upload after record insertion or during photo transfer. Preserve the failure result. Retry and check row identity, photo contents and final state.

For conflicts, use two independent installations signed in as the same owner. Import the same baseline, edit offline on both, then sync A before B. Confirm B preserves its edit and shows a conflict. Resolve using the implemented workflow. Repeat with another server edit between review and retry. A different botanist must not gain write access.

#### INT-04 and SEC-01. Publication and permissions

Test pending, approved, rejected and resubmitted observations. Test species publication separately because its flag is not an observation field. Include a published-on-insert fixture and updates without an approved observation. Record public visibility before and after each operation.

Verify anonymous, owner, other botanist, officer and administrator outcomes. Compare deployed rules with repository SQL. Treat skipped fixtures as skipped checks rather than passes.

A different botanist must not alter another owner's observation or self-approve. Public reads remain restricted. Record the role matrix, denied and allowed results and fixture IDs.

#### PERF-01 and REL-01. Measured acceptance

For QR trials, record the device, cached or non-cached state and timing boundary. Use the existing measurement export for decoder-callback lookup. Measure the broader scan-to-record task separately if claiming the proposal's complete timing target.

Export `plantiful.db` using the available development-device tooling. Run `python mobile/scripts/summarize_acceptance.py PATH_TO_DB --raw PATH_TO_EVENTS.csv` from the repository root. Record each device and trial separately. Keep the raw data and note that the in-app display uses a limited recent sample.

Report sync successes divided by all recorded attempts, including retries and conflicts as specified by #40. Also report scenario groups so deliberately induced failures are interpretable. Do not claim a zero-sample result as passing.

QR measurement logging starts at the decoder callback. It excludes aiming and recognition time. The proposal describes scan-to-record time, so either measure the full task separately or clearly distinguish both metrics. Do not silently substitute the narrower measure.

Report the sync metric required by #40 with all attempts counted. Group normal reconnect, interruption and conflict scenarios so the reader can interpret the aggregate. Intentional conflict tests should remain visible rather than being removed to improve a percentage.

Plan sample sizes before running trials. Report counts alongside percentages. Twelve unit tests do not establish the full coverage target. Define the backend API and mobile sync coverage denominator, expand meaningful tests and record exclusions.

#### IOT-01 to IOT-03. Hardware, rules and malformed input

Confirm wiring and installed firmware first. Capture the assembled hardware, serial output, stored reading and dashboard state. Correlate by sensor and time and use returned identifiers where available. Label synthetic and physical tests separately.

Exercise normal conditions, suitable threshold or motion events, repeated events, silence and recovery. Define whether timing begins at the physical event, serial receipt or database insertion. Record independent rule behaviour when a reading meets multiple conditions.

Run negative payload cases before any live ingestion test. Check wrong types, non-finite values, percentage bounds, missing or null fields and unexpected sensor identity. Invalid input must not produce an insert or alert under the chosen contract.

Valid physical readings must reach storage and the dashboard with the expected values. Controlled threshold and motion tests, cooldown and missing-sensor behaviour must match the documented policy. Invalid payloads must be rejected without insertion, and outage and reconnect behaviour must match the chosen policy.

#### SEC-02 and SEC-03. Security reassessment

Preserve dependency audit JSON before and after deliberate compatible updates. Analyse package paths and affected functionality. Retest typechecking, lint, build and affected workflows.

Repeat scoped role, storage, header and route-error checks. Record ZAP version, target, release, anonymous and authenticated contexts, scan method and exclusions. A passive scan does not establish exhaustive injection coverage. Record remaining findings and remediation recommendations.

Dependencies are reassessed after deliberate updates. Keep before and after JSON, the lockfile version and residual dependency-path analysis.

#### WEB-01. Web regression

Check species create, edit and delete, search and filter, maps, photo display, report exports and monitoring filters. Verify role restrictions, missing records and connection failure feedback. Separate observation management requirements from species management.

### 4.4 Evidence and test registers

Use these registers during execution. No device, live integration or participant result should be entered until it has been observed.

#### Test execution record

| Test ID | Date, version and environment | Expected | Actual | Status | Evidence IDs | Defect or retest |
|---|---|---|---|---|---|---|

Use Pass, Fail, Blocked or Not run and retain initial failures when retesting.

#### Evidence register

| Evidence ID | Test or requirement | Date and version | Description | Relative file path | Redaction and limitations |
|---|---|---|---|---|---|

#### Usability observation record

| Participant | Task | Completion | Help or errors | Time | Comment | Proposed refinement | Retest |
|---|---|---|---|---|---|---|---|

#### Defect and change record

| Defect ID | Reproduction | Impact | S2 item | Fix and version | Retest | Status |
|---|---|---|---|---|---|---|

### 4.5 Evidence storage and submission

Keep raw session exports, scans and logs in the local-only `Docs/Security/Evidence/` folder, using the `sprint2/` subfolder when collection begins. Preserve historical originals. Store only selected reviewed and redacted submission copies with the Sprint 2 delivery package. Do not copy tokens, passwords or sensitive locations into tracked documentation.

The local screenshots directory was empty at review time. This does not establish whether images exist elsewhere or in the submitted PDF.

The security evidence is now part of the local-only security pack. It is gitignored. Preserve originals locally and place selected redacted copies in the actual submission package. A link to an ignored local file is not evidence accessible to the marker.

Use filenames containing the test ID, date and a short description. Link screenshots to the same record or sensor across the workflow. A screenshot illustrates an outcome, while the full log or export supports detailed verification.

The final package must contain accessible evidence files. Links to personal absolute paths or ignored folders alone are insufficient. Confirm referenced files exist in the exported submission package.

Use a register with evidence ID, test or requirement ID, description, date, tested version, path, observed outcome and limitation. Separate historical results from newly executed Sprint 2 results. Never include credentials or session tokens.

## 5. Usability evaluation

### 5.1 Method

Target approximately five participants as planned in Sprint 1. This count is not a rubric requirement. Record the actual number and whether participants are representative users or proxies. Prefer people who did not develop the interface they are testing.

Allow approximately 15 to 20 minutes per session. Explain that the application is being evaluated. Give task goals without directing every click. Ask participants to describe confusing points. Use anonymous participant IDs and appropriate test accounts.

| Task | Example goal | Observe |
|---|---|---|
| UX-T1 | Find a named species | Navigation, search and wrong turns |
| UX-T2 | Capture an observation with a photo | Form understanding, validation and completion |
| UX-T3 | Find the saved record and determine sync state | Status comprehension and recovery |
| UX-T4 | Review a pending observation as an officer | Role-specific navigation and decision feedback |
| UX-T5 | Find published information as a visitor | Public task completion and clarity |

Assign relevant tasks per participant. Record completion independently, completion with help or failure. Record assistance, errors, elapsed time and comments. If collecting an ease rating, define the scale in advance and use it consistently.

### 5.2 Review criteria

Review visibility of status, consistent controls, error prevention, recovery, readable text, contrast, touch targets, keyboard focus and loading, empty and error states. Name the guidelines used. A brief review does not establish full accessibility compliance.

Prioritise recurring problems, implement bounded refinements and retest affected tasks. Report whether retest participants were the same people because familiarity can influence results.

The planned UX-01 session remains open. Record the actual outcome rather than describing an intention as a result.

## 6. Diagrams and hardware

### 6.1 Figure specifications

The D-02 physical wiring review draft was generated on 28 October 2026. Its [image, editable source and online editing instructions](../../README.md#d-02-physical-build) are available for review. Other figures below remain planned. Existing Sprint 1 sources may be reused after review.

| ID | Figure | Required content | Placement |
|---|---|---|---|
| D-01 | Architecture and deployment | Mobile SQLite, browser and server, Supabase Auth, DB and Storage, ESP32, trusted bridge host, actual protocols, roles and privileged boundary | Architecture section |
| D-02 | Electrical wiring and assembly | Board and shield, sensors, actual GPIO, supply voltage, common ground, LED resistor and unused DO outputs. Companion annotated hardware photograph | IoT implementation |
| D-03 | IoT reading-to-alert flow | Serial payload, host timestamp, validation, storage, independent rule checks, cooldown, periodic silence check and dashboard refresh. Separate simulator branch | IoT integration |
| D-04 | Offline sync sequence | Local capture, persistence, reconnect, identity lookup, version check, photo upload and retry, conflict and review resolution | Integration |
| D-05 | Review and publication lifecycle | Observation pending, approved, rejected and resubmitted states, officer decisions, species publication and public visibility | Prototype workflow |
| D-06 | ERD | Actual tables, keys and cardinalities grouped by identity, catalogue, observations, IoT and reporting | Data design |
| D-07 | Role-based task flows | Botanist capture and sync, officer review and monitoring, administrator actions and public browsing, including recovery paths | Usability |

Optional additions are a focused before and after change diagram, an alert decision figure if D-03 becomes crowded, and charts based on actual test or usability results. Do not fill a chart with target values and label it as observed performance.

### 6.2 Source and export workflow

1. Read the implemented code and confirmed hardware configuration.
2. Draw an editable source using Mermaid for logical flows or a suitable schematic tool for physical wiring.
3. Review terminology, roles, states and protocols with the component owner.
4. Export a readable vector figure where practical. Test any raster image at final page size.
5. Add a numbered caption and explain what the figure establishes.
6. Check the figure again against the tested release before submission.

Store editable files under `diagrams/source/` and exports under `diagrams/exported/` inside this Sprint 2 folder. Use stable names such as `D-01_system_architecture`. Keep source and export versions together.

Existing references are [Sprint 1 figure sources](../Sprint1/diagrams/FIGURES.md) and [shared assets](../../README.md#shared-assets). Existing figure numbering belongs to Sprint 1. Assign final Sprint 2 caption numbers when the report order is stable.

### 6.3 Physical wiring supplied by the team

This is a design record supplied in conversation. It is not a measured electrical verification. Board coordinates assume standard a-to-e and f-to-j connected row groups.

#### Shield to breadboards

| Shield pin | Destination | Purpose |
|---|---|---|
| D04 S | Board 1, 4a | DHT11 data |
| D04 V | Positive rail | Sensor power, voltage unconfirmed |
| D04 G | Negative rail | Ground |
| D27 S | Board 1, 27b | PIR signal |
| D27 V | Positive rail | Sensor power |
| D27 G | Negative rail | Ground |
| D26 S | Board 1, 26a | LED signal |
| D26 G | Board 1, 25j | LED return |
| D34 S | Board 2, 24g | Soil AO |
| D35 S | Board 2, 30g | Rain AO. User confirmed D35 on 28 October 2026 |

Soil and rain use the D34 and D35 shield S pins only. Their V and G header pins remain empty. Module power comes from the rails. The D35 confirmation supersedes the conflicting D33 entry in the earlier shield table. Physical assembly evidence remains pending.

#### Board 1 components

| Component pin | Destination |
|---|---|
| DHT11 positive, OUT, negative | Positive rail, 4b, negative rail |
| PIR VCC, OUT, GND | Positive rail, 27a, negative rail |
| Resistor first and second leg | 26b and 25b |
| LED anode and cathode | 25e and 25f |

The LED circuit runs from D26 S through row 26, the resistor, row 25 a-to-e, the LED, row 25 f-to-j, and D26 G. The LED crosses the centre gap. Record the resistor value.

#### Board 2 modules and rail links

| Module pin | Component coordinate | Wire |
|---|---|---|
| Soil VCC | 21f | 21g to positive rail |
| Soil GND | 22f | 22g to negative rail |
| Soil DO | 23f | Unused |
| Soil AO | 24f | 24g to D34 S |
| Rain VCC | 27f | 27g to positive rail |
| Rain GND | 28f | 28g to negative rail |
| Rain DO | 29f | Unused |
| Rain AO | 30f | 30g to D35 S, confirmed by the user on 28 October 2026 |

Board 1 positive rail links to board 2 positive rail. Board 1 negative rail links to board 2 negative rail. Confirm continuity across any split rails.

### 6.4 Open hardware and calibration details

| Item | Repository evidence | Required confirmation |
|---|---|---|
| Rain input | Firmware GPIO 35 and user-confirmed D35 wiring on 28 October 2026 | Companion assembly photo and installed firmware version |
| Supply | Wiring description says V | Shield model, jumper setting and actual rail voltage |
| LED resistance | Resistor present in supplied map | Resistance value |
| PIR and module models | Generic components described | Exact parts and supply and output specifications |
| Transport | Reviewed sketch emits serial DATA lines | Whether the running node uses this firmware or another version |
| Soil calibration | Dry 4095, wet 1650 | Wet constant marked placeholder. Retain measured dry and wet raw samples |
| Rain calibration | Dry 4095, wet 2200 | Wet constant marked placeholder. Retain measured conditions and samples |
| Reporting interval | Configured 2000 ms, printed four seconds | Correct presentation and measure actual timing |

Check analogue output compatibility with ESP32 input limits. ADC attenuation configuration is not protection against an excessive input voltage. Calibration percentages are normalised indicators unless validated against a physical reference, not certified soil water-content measurements.

A wiring table is design input, not proof that the assembled circuit passed a trial. Keep calibration raw values and conditions with the physical evidence. The firmware contains no Wi-Fi transport implementation in the reviewed sketch. Confirm whether any newer firmware is running on the device before describing a hotspot as a node connection.

### 6.5 Figure quality checklist

- Use consistent names across code, tables and captions.
- Label arrows with actual data or protocols and show their direction.
- Show fixed deployment coordinates rather than an on-board GPS receiver unless hardware changes.
- Distinguish host internet connectivity from ESP32 transport.
- Show that heat, humidity and movement checks can all produce findings from one reading.
- Distinguish observation approval from species publication.
- Identify implemented and proposed components explicitly.
- Use readable fonts and sufficient contrast at final page size.
- Include legends where colour or line style carries meaning.
- Introduce each figure in the text and explain its purpose and limitations.

## 7. Report, sign-off and demonstration

### 7.1 Assessment mapping

The product target is 36/40. No specific mark is guaranteed. The report should make evidence easy to locate for each criterion.

| Criterion | Required content | Supporting material |
|---|---|---|
| Testing Plan, 10 marks | Definition of Done, quality attributes, strategy including security, hardware and software environments | Section 4, accepted test cases and exact execution conditions |
| Test Results, 10 marks | Quantitative and qualitative analysis, outcome reasoning, recommendations and security findings | Raw measurements, failures and retests, participant findings and current audits |
| Prototype, 10 marks | User needs mapped to design, problem understanding and development-specific requirements | Requirement matrix, integrated scenarios and D-01 to D-06 |
| Software Usability, 10 marks | Relevant guidelines, clear navigation, smooth tasks, learnability and efficiency | D-07, guideline review, sessions and verified refinements |

Background and planning from the proposal can be referenced. Do not duplicate the full proposal to inflate the sprint report. Keep enough context for the prototype and its users to be understandable.

### 7.2 Report outline

The submission document is [Sprint_Report_2.md](Sprint_Report_2.md). It should contain the following sections.

| Section | Writing instructions |
|---|---|
| Document control | Title, reporting period, version, date, team roles and status |
| Executive summary | Final verified outcomes, important changes and limitations. Write last |
| 1. Sprint objectives and plan | Tutor direction, baseline, selected backlog, carry-over, owners and actual schedule |
| 2. User needs and final prototype | Persona needs, corresponding features, design rationale and requirement coverage |
| 3. Implementation and enhancements | Significant before and after changes, reasons, affected components and verification |
| 4. Architecture and integration | Final architecture, data model, IoT hardware, sync sequence and review and publication lifecycle |
| 5. Testing plan and environment | Definition of Done, quality attributes, test levels, security scope, devices and acceptance targets |
| 6. Results and analysis | Measured outcomes, samples, rates, timings, qualitative findings, failures, causes and retests |
| 7. Usability and refinement | Guidelines, participant and task method, observed problems, changes and retest limitations |
| 8. Security results | Current dependencies, role and storage checks, scan scope, remediation and residual recommendations |
| 9. Final deliverables and readiness | Requirement status, deployment and handover, known limitations and rehearsal |
| 10. Sign-off and retrospective | Actual meeting outcome, feedback, actions, lessons and conclusion |
| References and appendices | Tools and guidelines cited, evidence index, detailed trials and full wiring table |

### 7.3 Writing and traceability rules

For each major change, write the baseline, observed problem, change, rationale, verification, result and remaining limitation. Attribute Sprint 2 work using the confirmed Sprint 1 cutoff rather than commit dates alone.

Use precise results. Replace claims such as reliable, seamless, fully secure or intuitive with observed behaviour and its conditions. Explain unsuccessful results rather than hiding them.

The main text should contain essential reasoning, figures and results. Place long logs and supplementary images in appendices. Use numbered headings, tables, figures, readable captions and verified cross-references. Avoid em dashes, sentence semicolons and colon-led sentences. Use short, plain professional language.

Use `[picture of ... here]` while drafting. Replace every placeholder in the final version. A diagram caption should explain the implemented behaviour. A test screenshot caption should identify the test and observed outcome.

#### Requirement coverage template

| Requirement | User need | Implementation | Test IDs | Figure and evidence IDs | Final status and limitation |
|---|---|---|---|---|---|

#### Change summary template

| S2 ID | Sprint 1 limitation | Sprint 2 change | Verification | Outcome | Remaining work |
|---|---|---|---|---|---|

Do not populate either table with unverified completion claims. Keep the current dependency results distinct from historical security findings. Do not infer species photo coverage from photo-row counts alone.

For each significant change, explain the baseline, observed problem, correction, rationale, verification, result and remaining limitation. Use `[picture of ... here]` during drafting only. Replace every placeholder before submission.

Do not inherit the old claims of automatic location on every capture, background sync, measured physical calibration, complete coverage or zero dependency findings without current evidence. Derive missing-photo counts from distinct species with photos rather than subtracting photo rows from species rows.

### 7.4 Sign-off preparation

Sprint 1 sign-off is already complete according to the team. Arrange the usual Sprint 2 meeting before submission and leave time for feedback where the timetable permits. The proposed 3 November date is not booked.

Prepare a short review pack containing the scope and change summary, demonstration sequence, requirement status, test results, important defects and known limitations.

#### Suggested invitation

> Dear Sue Han,
>
> We would like to arrange our Sprint 2 sign-off meeting before the 6 November submission. We plan to demonstrate the final integrated prototype and review our enhancements, testing results, resolved defects and remaining limitations.
>
> Would [proposed date and time] be suitable? We would also appreciate confirmation of the presentation and Q&A time allocation.
>
> Best regards,
> Basil, on behalf of Group 7

#### Meeting record template

| Field | Entry |
|---|---|
| Date and attendees | To be recorded |
| Release demonstrated | To be recorded |
| Deliverables reviewed | To be recorded |
| Feedback and decisions | To be recorded |
| Sign-off outcome | Pending |
| Follow-up actions, owners and dates | To be recorded |

Conditional sign-off must remain labelled conditional until the agreed actions are resolved. Retain actual feedback and confirmation rather than assuming approval.

### 7.5 Demonstration and Q&A

Prepare an 8 to 10 minute core sequence and adapt it after the session duration is confirmed.

| Segment | Approximate time | Content |
|---|---|---|
| Problem and users | 1 minute | Why offline documentation and monitored plant protection matter |
| Sprint 2 improvements | 1 minute | A few significant verified changes |
| Mobile to web workflow | 3 minutes | Capture, persistence, sync, review and public visibility |
| IoT workflow | 2 minutes | Physical setup, reading, alert and dashboard |
| Results and limitations | 1 to 3 minutes | Acceptance, security, usability and remaining work |

Use prepared fixtures where needed to fit the slot and disclose them. Label backup recordings as recordings. Rehearse authentication, network transitions, hardware connection, display sharing and recovery steps.

Prepare answers about conflict handling, duplicate prevention, role restrictions, publication, calibration, threshold choices, security residuals, usability changes and individual contributions. Each team member should understand their own evidence and the interfaces with other components.

### 7.6 Individual assessment preparation

The final presentation and Learning Summary Report each carry ten individual marks according to the supplied rubric. Keep an individual contribution record with dated tasks, decisions, problems, relevant commits or tests, learning and future improvements. Do not assign another person's work to yourself.

## 8. Submission readiness

### 8.1 Quality checks

- Review criterion coverage on 3 November and again on 5 November.
- Match reported counts and final statuses to the evidence.
- Verify every relative file link and cross-reference.
- Ensure diagrams match the demonstrated release and are readable at page size.
- Rebuild the table of contents and resolve Word bookmark errors.
- Inspect the exported PDF visually for clipped tables, split captions and missing fonts or images.
- Remove placeholders, draft instructions and unsupported completion statements.
- Include selected redacted evidence, setup instructions and any required attachments.
- Record the actual sign-off outcome and any unresolved limitation.
- Check the uploaded files and retain the submission receipt on 6 November.

The internal completion date is 5 November. Exact submission time, final presentation split and any separate Learning Summary Report format remain to be confirmed.

### 8.2 Mobile run workflow

The primary team workflow uses Expo Go. Each teammate installs Expo Go from the app store, runs `npm ci` in `mobile`, then runs `npm start`. The start script passes `--go` so Metro targets Expo Go explicitly. The shared lockfile and exact package pins keep the dependency tree identical across machines. `npm run doctor` checks the installed packages against the Expo SDK.

The pasted version warning came from stale `node_modules`, not from Expo Go. The declared Expo packages were at SDK 58 patch versions while the installed tree remained on earlier patches. `npx expo install --fix` synchronised the tree. Expo Doctor now reports 20 of 20 checks passed, and the mobile production audit reports 0 entries across 575 production dependencies within the recorded scope.

A development build is retained as an optional fallback. Expo Go supports a fixed SDK version per client release, so a future store update can stop an older project from opening. The development build compiles the native modules into an application installed on the phone. Metro then serves JavaScript and assets to that application and the Expo Go version is not involved. A native rebuild is needed only when a native library, the Expo SDK or the application configuration changes.

Prepared configuration is recorded in `mobile/eas.json` and `mobile/package.json`. The setup uses the `development` profile and the `expo-dev-client` package. `npm run build:dev:android` starts a cloud build. `npm run start:dev` connects to the installed development build. The build evidence must record the build identifier, install result and first successful connection.

### 8.3 Readiness summary

The initial local baseline passed compilation, lint apart from one warning, and the twelve existing unit tests. It does not yet establish a 90 percent submission. The highest-value gaps are current security remediation, backend publication edge cases, telemetry validation, integrated device trials, usability evidence and accurate final diagrams.

Before submission, confirm core workflows, significant defect retests, current security statuses, requirement to evidence links, final diagram accuracy, actual sign-off outcome and a timed demo rehearsal. Inspect the exported PDF for readable figures, consistent numbering, working references and unresolved placeholders.

The audit did not change application code, rotate credentials, apply migrations, mutate live data, close GitHub issues, commit or push. Report and plan files are working artefacts until the team reviews them. Dependency synchronisation on 2 November changed mobile package versions and the lockfile. It requires review and regression checks before release.
