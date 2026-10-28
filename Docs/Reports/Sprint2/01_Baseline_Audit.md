# Plantiful Sprint 2 Baseline Audit and Initial Delivery Plan

[Sprint 2 documentation](../../README.md#sprint-2)

This is the dated 27 October audit snapshot. Track subsequent work in [the execution backlog](02_Execution_Backlog.md). The testing, diagram and report plans in this folder expand the original delivery recommendations without marking them as completed.

## Document control

| Field | Value |
|---|---|
| Version | 0.1 |
| Review date | 27 October 2026 |
| Source baseline | `64e69b4` |
| Submission deadline | 6 November 2026, submission time to be confirmed |
| Internal completion target | 5 November 2026 |
| Product assessment target | At least 36/40, equivalent to 90% |
| Status | Initial repository audit and proposed delivery plan |
| Sign-off | Sprint 1 completed according to the team. Sprint 2 meeting pending |

## 1. Purpose and assessment basis

Sprint 2 will complete and refine the prototype through integration, enhancements, testing, bug fixing, and demonstration preparation. This follows Sue Han's guidance supplied by the team. The product rubric allocates ten marks each to Testing Plan, Test Results, Prototype, and Software Usability. The target is an ambition, not a predicted grade.

The final presentation and Learning Summary Report are separate individual assessments. The reported demonstration slot is approximately 10 to 20 minutes including questions. The exact split is unconfirmed. No report page limit has been confirmed.

This document records an initial cross-component source review, GitHub issue review, and local checks. It is not a complete penetration test, device trial, or physical hardware verification. Existing October evidence is historical until its applicability to the final release is checked.

## 2. Baseline and provenance

The working tree was clean at the start of this audit. The latest commit was `64e69b4`, dated 27 October, for document organisation and SQL updates. The preceding monitoring commits are dated 16 October. Their existence alone does not establish that they are Sprint 2 work.

Keep three artefacts distinct. The submitted `Basilagas21/Docs and templates/sprint1.pdf` is the historical submission. `Docs/Reports/Sprint1/Sprint_Report_1.md` is a revised document. The current repository is the implementation baseline. Confirm the team's Sprint 1 cutoff before attributing changes to Sprint 2.

The earlier chat estimate of 55/100 is not an awarded mark. PDF text extraction does not establish the absence or visual quality of embedded images. This plan uses the four product criteria rather than penalising the sprint report for proposal sections.

### 2.1 Implementation inventory

| Area | Source inspected | What is present | Verification still needed |
|---|---|---|---|
| Mobile capture | `mobile/src/app/capture/new.tsx`, `mobile/src/lib/location.ts`, `mobile/src/db.ts` | Camera handling, device location support, SQLite persistence and measurement storage | Device capture, permission denial, restart persistence, QR lookup and photo trials |
| Synchronisation | `mobile/src/app/(tabs)/sync.tsx`, `mobile/src/lib/sync-edit.ts` | Device-identity lookup, photo repair, revision-checked edits, conflict state and attempt measurements | Interrupted uploads, repeated sync, two-client conflicts and cross-owner denial |
| Web records | `web/src/app/records/actions.ts`, `web/src/app/records/[id]/page.tsx` | Record details and officer approval/rejection | Issue #16 also requests record editing and deletion. Do not equate species CRUD with observation CRUD |
| Species management | `web/src/app/species/actions.ts` | Officer-gated create, update and delete operations | Live mutation results, publication boundaries and missing-row handling |
| Backend | `backend/supabase/migrations/001_schema.sql`, `apply_project.sql`, `012_monitoring_history.sql` | Ten tables in the base schema, RLS, review/publication rules and history RPC migration | Final deployed-schema comparison and role-based verification |
| IoT | `iot/sketch_oct9a/sketch_oct9a.ino`, `bridge.py`, `evaluate.py`, `publisher.py` | Serial hardware path, separate synthetic publisher, immediate and periodic evaluation | Wiring confirmation, calibration, actual transport confirmation and physical trials |
| Monitoring | `web/src/app/api/telemetry/route.ts`, `web/src/components/monitoring-dashboard.tsx` | Officer/admin access, sensor and time filters, live data, history and alert status display | Browser interactions, failure/recovery states and alert acknowledgement requirement |
| Security evidence | `Docs/Security/Evidence/checks/`, `Docs/Security/Evidence/zap/` | Historical SQL/HTTP checks, ZAP JSON and HTML reports, before/after summary | Final-release dependency, role, storage and scan reassessment |

The base schema includes `plant_record_photos` as well as the other listed entities. Recount the final deployed schema when preparing the ERD rather than copying a historical table count.

### 2.2 Local checks executed on 27 October

The host is Windows. Reported runtimes are Node.js 24.19.0, npm 11.17.0, and Python 3.13.14. Declared application versions at the start of the checks were Next.js 16.3.6, Expo 57.0.24, and React Native 0.86.3. The mobile project was upgraded later on the same day, as recorded in 2.2.1. Exact device and browser versions remain to be recorded during trials.

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

The existing unit suites total 12 passing tests. This is not whole-system test coverage. The helper coverage cited in Sprint 1 does not establish the proposal's greater-than-80% backend API and mobile sync target.

Web lint identifies the QR data-URL image at `web/src/app/records/[id]/page.tsx:98`. The build reports an ignored lockfile outside the repository. The mobile tests report a module-type warning. These are not failed acceptance trials.

### 2.2.1 Expo SDK 58 upgrade on 27 October

The mobile project was upgraded from Expo SDK 57 to SDK 58 to match the Expo Go client installed on the test phone. The resulting versions are Expo 58.0.19, React Native 0.88.0, React 19.3.0, Expo Router 58.0.26 and TypeScript 6.0.3. The `expo.install.exclude` entry was removed so that dependency validation covers the core package.

The upgrade was verified with the following checks.

| Check | Observed result |
|---|---|
| `npx tsc --noEmit` | Pass, after narrowing the tab icon colour from `ColorValue` to a string |
| `npx expo lint` | Pass |
| `npx expo-doctor` | 20 of 20 checks passed |
| `npm test` | 3 passed |
| `npx expo export --platform android` | Bundle exported |
| `npm audit --omit=dev` | 4 entries, 1 critical and 3 high, all in the Expo toolchain |

The dependency count fell from 12 to 4 entries. The critical entry is the transitive `shell-quote` package. The automatic fix path proposes Expo 54, which is a breaking downgrade, so it was rejected. The device-level checks for camera, location, SQLite and sync still need a physical run on the upgraded build.

The web dependency findings were also addressed on 27 October. Next.js and `eslint-config-next` moved from 16.3.6 to 16.4.3. The non-breaking audit fix resolved `source-map-js`. The production audit then reported 0 entries. The web type check and production build passed, and lint reported 0 errors and the existing image warning. The build compiled all 19 routes.

| Web check after remediation | Observed result |
|---|---|
| `npx tsc --noEmit` | Pass |
| `npm run lint` | 0 errors, 1 image warning |
| `npm run build` | Pass, 19 routes |
| `npm audit --omit=dev` | 0 entries |

### 2.3 Security baseline has changed

The fresh web audit lists `next`, `sharp`, and `source-map-js`. npm suggests Next.js 16.4.3 as a remediation candidate. Compatibility and the matching ESLint configuration must be reviewed before an update.

The mobile audit includes a critical `shell-quote` entry and high entries involving Expo tooling, `node-forge`, `source-map-js`, and `zod`. Its suggested automatic remediation includes an Expo downgrade and an Expo Router major upgrade. Do not apply a forced audit fix. Review the dependency paths and SDK compatibility first.

An advisory match does not prove application-level exploitability. Equally, the previous statement that all mobile findings have no runtime reach cannot be reused without a fresh dependency-path analysis. The current router-related entries need explicit review.

The historical ZAP summary describes spidering and passive scanning with anonymous and officer sessions. It records residual CSP weaknesses. Do not describe this as exhaustive active penetration testing or as proof that no injection vulnerability exists.

## 3. Findings and improvement opportunities

| ID | Priority | Evidence and status | Proposed action and completion condition |
|---|---|---|---|
| S2-01 | P0 | Fresh dependency audits report critical/high package entries | Review reachability and compatible patches, update deliberately, repeat audit and regression checks, document residuals |
| S2-02 | P0 | GitHub #41 remains open | Confirm credential replacement and test-password reset with the authorised project owner. Retain redacted evidence and verify dependent services |
| S2-03 | P0 investigation | `apply_project.sql:342-345` attaches the publication gate only to updates. Species creation accepts `is_published` and officer inserts do not enforce an approved observation | Reproduce published-on-insert behaviour in an isolated database fixture. If the gate is bypassed, cover inserts and updates and add meaningful database regression cases |
| S2-04 | P1 | Locally reproduced with `FakeSupabase`: `humidity=150`, `soil_moisture=-10`, and `movement=2` pass bridge validation and reach the fake insert. Movement generates an alert | Define field-specific Boolean/numeric rules, finite-number and percentage bounds, and missing-value policy. Reject invalid payloads before any insert and add negative tests |
| S2-05 | P1 | `bridge.py` exits on an uncaught Supabase failure in the ingestion loop and serial loss | Define retry/reconnect behaviour and any buffering policy. Test outage and recovery. Explicitly report any unavoidable telemetry loss |
| S2-06 | P1 decision | Alert cooldown in `evaluate.py` keys on alert type, not severity | Decide whether critical escalation should bypass a prior high-severity cooldown. Test the agreed policy before changing it |
| S2-07 | P1 | Firmware uses `REPORT_INTERVAL=2000` but prints a four-second startup message. Wet calibration values are labelled placeholders | Correct interval presentation and replace calibration placeholders only after actual measurements. Record calibration conditions |
| S2-08 | P1 | Supplied wiring lists both D33 and D35 for rain. Firmware uses GPIO 35 | Confirm actual rain wire, rail voltage, resistor value, sensor models and photograph. Reconcile hardware, firmware and drawing |
| S2-09 | P1 | Dashboard renders resolved/open status and filters but reviewed component provides no acknowledgement control requested by #31 | Confirm expected operator workflow. If retained, implement authorised resolution with feedback and permission tests |
| S2-10 | P1 | #16 requires observation edit/delete. Reviewed record action file provides approval only, while species CRUD is separate | Trace all record-management routes, confirm scope, then implement missing required actions or document an agreed change |
| S2-11 | P1 | Species update/delete return success when there is no error without checking affected rows | Reproduce nonexistent or concurrently deleted IDs. Return accurate missing-row feedback and verify with tests |
| S2-12 | P1 | Mobile location capture is attached to a Capture GPS action in `capture/new.tsx:73-87,352` | Describe device-assisted location accurately. Test denied permission and unavailable fixes. Do not claim every capture automatically includes coordinates |
| S2-13 | P1 | Existing Mermaid alert diagram branches as if heat, drought and movement were mutually exclusive. Evaluator checks them independently | Redraw independent rule checks and test a reading that triggers multiple alerts |
| S2-14 | P1 | Existing security report schedules some recommendations for Sprint 3, while the current delivery is final Sprint 2 | Reclassify each as Sprint 2 commitment or explicitly deferred post-project enhancement |
| S2-15 | P1 | Acceptance measurements and participant results remain open in #39 and #40 | Run the specified physical and participant trials. Keep attempts, failures and raw observations |

P0 items take precedence over optional enhancements. S2-03 is a source-level concern, not a claim that the live database was exploited. S2-04 establishes a bridge validation defect with a fake client. Database constraints may reject some payloads later, so this does not prove malformed data was stored in Supabase.

The first bounded code improvement should be S2-04 because it has a local reproduction and clear regression criteria. Security dependency triage and authorised credential work should proceed with higher scheduling priority.

## 4. GitHub reconciliation

Issues were read through GitHub CLI on 27 October. Their statuses have not been changed by this audit. An open issue is not by itself proof that implementation is absent.

| Issue | Current status | Reconciliation needed |
|---|---|---|
| #16 | Open | Distinguish observation editing/deletion from completed species CRUD in #33 |
| #21 | Open | Replace the last-write-wins description with the implemented compare-and-swap policy after team confirmation. Link #39 evidence |
| #23 | Open | Retain the explicit three-record offline/restart/reconnect trial and publication workflow |
| #27 | Open | MQTT contract is not the implemented serial path. Record the transport decision and current payload contract |
| #28 | Open | A synthetic publisher exists but writes through REST rather than the stated MQTT broker |
| #29 | Open | A serial bridge exists. Strengthen validation and reconcile `stations` terminology with actual `sensors` |
| #30 | Open | Rules exist as Python constants. Config-driven rules and persisted triggering value requested in the issue need review |
| #31 | Open | Implementation permits officers and admins, not only admins. Status display exists but acknowledgement needs review |
| #32 | Open | Sprint separator, not a deliverable |
| #39 | Open | Two-client conflict, retry and cross-owner evidence still required |
| #40 | Open | QR/sync measurements and usability sessions still required |
| #41 | Open | Credential remediation requires completion evidence |
| #33 to #36 | Closed | Species CRUD, reports, map and photos have closed issues. Include them in regression scenarios rather than claiming new Sprint 2 delivery |

Use the repository URL `https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/issues/NUMBER` for individual issue references.

## 5. Proposed ownership and schedule

Ownership below follows the roles in the root README. It is proposed and needs team confirmation.

| Work package | Proposed lead | Acceptance evidence |
|---|---|---|
| Mobile capture, QR and usability | Basill | Device trials, task observations and refinement retests |
| Sync and backend integrity | Maqeel | Three-record trial, interrupted upload, stale revision and role tests |
| Web observations | Nathan | Record workflow tests and accurate user feedback |
| Web species, maps and reports | Badrul | CRUD, publication, export and map checks |
| IoT validation and physical trials | Gae | Negative payload tests, calibration, wiring and reading-to-alert trail |
| Integration, evidence and sign-off | Ashley with the team | Evidence index, rehearsal, meeting record and delivery checks |
| Security dependency and account work | Relevant component owners and authorised Supabase owner | Audits, dependency analysis, redacted remediation and retests |

| Date | Planned outcome |
|---|---|
| 27 October | Initial audit completed. Confirm ownership, hardware details and sign-off availability |
| 28 October | Finalise acceptance cases and evidence register. Triage dependencies and publication gate. Draft diagrams |
| 29 to 30 October | Implement essential fixes and bounded enhancements. Run component regressions |
| 31 October | Execute mobile-to-web and physical IoT integration trials |
| 1 November | Conduct usability sessions and final-release security checks |
| 2 November | Fix significant failures and retest. Restrict further work to essential fixes and delivery |
| 3 November | Complete report draft. Target sign-off review subject to Sue Han's availability |
| 4 November | Address review actions and rehearse the presentation/demo |
| 5 November | Final release and exported PDF checks |
| 6 November | Submit and verify receipt |

Do not label the sign-off date as booked until Sue Han confirms it. Diagrams and report writing should progress alongside implementation.

## 6. Acceptance and evidence collection

All trials below remain planned unless an execution record is attached. Use an isolated fixture or clearly identified test records for mutations. Record date, tester, commit, environment, procedure, expected result, actual result, evidence ID and defect reference.

| Test ID | Trial and pass condition | Evidence required |
|---|---|---|
| INT-01 | Capture at least three observations with photos offline, restart, reconnect and sync. Each intended record and photo is present without unintended duplicates after another sync | Local and remote IDs, before/after screens, attempt export and photo verification |
| INT-02 | Interrupt upload after record creation or during photo upload. Retry completes without losing the local observation | Failure/retry log, final row/photo checks and user feedback |
| INT-03 | Two same-owner installations edit one baseline. A syncs first, B conflicts and retains its edit. Repeat after a further intervening server edit | Revisions, conflict screens, resolution steps and raw attempts |
| SEC-01 | Different botanist cannot alter another owner's observation or self-approve. Public reads remain restricted | Role matrix, denied and allowed results, fixture IDs |
| INT-04 | Officer review and species publication produce the expected public visibility. Include insert-published and re-review edge cases | Approval/publication states and anonymous query results |
| PERF-01 | Cached offline lookup meets the proposal's less-than-five-second average using an agreed timing definition | Device/build, sample count, raw durations and summary |
| REL-01 | More than 95% sync success under the agreed trial conditions, with no observed data loss | All attempt outcomes including retries/conflicts and denominator definition |
| IOT-01 | Valid physical readings reach storage and dashboard with the expected values | Wiring photo, serial output, sensor/time correlation and dashboard |
| IOT-02 | Controlled threshold/motion tests, cooldown and missing-sensor behaviour match the documented policy | Physical versus synthetic labels, alert IDs and measured timing boundaries |
| IOT-03 | Invalid payloads are rejected without insertion. Outage/reconnect behaviour matches the chosen policy | Automated negative tests and recovery logs |
| SEC-02 | Final role/storage/HTTP and ZAP checks are executed against the identified release | Raw output, scan configuration, exclusions, findings and retests |
| SEC-03 | Dependencies are reassessed after deliberate updates | Before/after JSON, lockfile version and residual dependency-path analysis |
| WEB-01 | Species, maps and exports function for the correct roles and data | Populated screenshots, exported files and permission results |
| UX-01 | Approximately five proxy or representative participants attempt a fixed task set | Anonymous task outcomes, assistance, timings, comments and refinements |

QR measurement logging starts at the decoder callback. It excludes aiming and recognition time. The proposal describes scan-to-record time, so either measure the full task separately or clearly distinguish both metrics. Do not silently substitute the narrower measure.

Report the sync metric required by #40 with all attempts counted. Group normal reconnect, interruption and conflict scenarios so the reader can interpret the aggregate. Intentional conflict tests should remain visible rather than being removed to improve a percentage.

Plan sample sizes before running trials. Report counts alongside percentages. Twelve unit tests do not establish the full coverage target. Define the backend/API and mobile-sync coverage denominator, expand meaningful tests and record exclusions.

### 6.1 Existing evidence and packaging

`Docs/Security/Evidence/checks/` contains six historical text outputs. `Docs/Security/Evidence/zap/` contains JSON, HTML and a scan summary. The local screenshots directory is empty at review time. This does not establish whether images exist elsewhere or in the submitted PDF.

The security evidence is now part of the local-only security pack. It is gitignored. Preserve originals locally and place selected redacted copies in the actual submission package. A link to an ignored local file is not evidence accessible to the marker.

Use a register with evidence ID, test/requirement ID, description, date, tested version, path, observed outcome and limitation. Separate historical results from newly executed Sprint 2 results. Never include credentials or session tokens.

## 7. Diagram and hardware plan

| Figure ID | Figure | Source and correction needed |
|---|---|---|
| D-01 | Final architecture and deployment boundaries | Root README, clients and telemetry route. Show the actual device/host/cloud links and privileged host boundary |
| D-02 | IoT wiring and assembly | Firmware plus supplied breadboard mapping. Rain D33/D35, supply voltage and LED resistance remain unconfirmed |
| D-03 | IoT data flow and evaluation | Bridge, evaluator and history RPC. Show independent alert rules, periodic silence evaluation, fixed coordinates and separate simulator |
| D-04 | Offline sync sequence | Sync screen, edit helper and database. Include local persistence, photo retry, version check and conflict resolution |
| D-05 | Review and publication lifecycle | Record approval action, species actions and SQL. Approval belongs to observations and publication flag belongs to species |
| D-06 | Final ERD | Base schema and applied changes, checked against the deployed database |
| D-07 | Role-based task flow | Current mobile and web navigation. Include user feedback and recovery paths |

Use readable vector diagrams where practical and retain editable sources. Place each figure near its explanation. Existing `Docs/Reports/Sprint1/diagrams/FIGURES.md` contains reusable draft material, but its timeline is explicitly indicative and its alert branching needs correction.

### 7.1 Supplied breadboard mapping

| Connection | Team-supplied mapping | Status |
|---|---|---|
| DHT11 | D04 S to board 1 row 4a, OUT at 4b | Consistent with firmware GPIO 4 |
| PIR | D27 S to board 1 row 27b, OUT at 27a | Consistent with firmware GPIO 27 |
| LED | D26 S to 26a/26b, resistor to 25b/25e, LED across 25e/25f, ground through 25j to D26 G | GPIO 26 matches. Resistor value pending |
| Soil | AO at board 2 row 24f/24g to D34 S | Consistent with firmware GPIO 34 |
| Rain | AO at board 2 row 30f/30g to D33 S in one table and D35 S in another | Physical pin unresolved. Firmware GPIO 35 |
| Power | Board 1 positive/negative rails linked to board 2 rails. Sensor modules powered from rails. Soil/rain DO unused | Shield rail voltage and any split-rail links require physical confirmation |

A wiring table is design input, not proof that the assembled circuit passed a trial. Keep calibration raw values and conditions with the physical evidence. The firmware contains no Wi-Fi transport implementation in the reviewed sketch. Confirm whether any newer firmware is running on the device before describing a hotspot as a node connection.

## 8. Report structure and writing plan

| Section | Content | Main rubric contribution |
|---|---|---|
| Executive summary | Verified outcomes, significant improvements and remaining limitations. Write last | All four criteria |
| 1. Sprint objectives and baseline | Tutor direction, carry-over, scope, responsibilities and actual changes | Context for delivery |
| 2. User needs and final prototype | Persona needs mapped to features and evidence. Explain actual changes from Sprint 1 | Prototype |
| 3. Architecture and integration | D-01 to D-07 as appropriate, interfaces, hardware and complete workflows | Prototype and usability |
| 4. Quality and testing plan | DoD, quality attributes, test strategy, environments and acceptance criteria | Testing Plan |
| 5. Test results and analysis | Counts, timings, rates, qualitative findings, failures, reasoning and retests | Test Results |
| 6. Usability and refinement | Guidelines used, task observations, before/after improvements and retest limitations | Software Usability |
| 7. Security assessment | Current dependency findings, role/storage checks, scan scope, remediation and recommendations | Testing Plan and Test Results |
| 8. Deliverables and demo readiness | Requirement coverage, release/setup details, limitations and rehearsal | Prototype |
| 9. Sign-off and retrospective | Actual meeting outcome, feedback, actions and lessons | Delivery record |
| Appendices | Detailed trials, evidence index, wiring coordinates and supporting outputs | Traceability |

For each significant change, explain the baseline, observed problem, correction, rationale, verification, result and remaining limitation. Use `[picture of ... here]` during drafting only. Replace every placeholder before submission.

Do not inherit the old claims of automatic location on every capture, background sync, measured physical calibration, complete coverage, or zero dependency findings without current evidence. Derive missing-photo counts from distinct species with photos rather than subtracting photo rows from species rows.

## 9. Readiness and next action

The initial local baseline passes compilation, lint apart from one warning, and the twelve existing unit tests. It does not yet establish a 90% submission. The highest-value gaps are current security remediation, backend publication edge cases, telemetry validation, integrated device trials, usability evidence and accurate final diagrams.

The next bounded implementation task is strict IoT payload validation with negative regression tests. In parallel, the component owners should plan compatible dependency remediation and confirm the physical test arrangements. Complete one change and its verification before moving into another subsystem.

Before submission, confirm core workflows, significant defect retests, current security statuses, requirement-to-evidence links, final diagram accuracy, actual sign-off outcome and a timed demo rehearsal. Inspect the exported PDF for readable figures, consistent numbering, working references and unresolved placeholders.

The audit did not change application code, rotate credentials, apply migrations, mutate live data, close GitHub issues, commit or push. Report and plan files are working artefacts until the team reviews them.
