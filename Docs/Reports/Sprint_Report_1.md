# Plantiful Sprint Report 1

**Smart Ground-Truthing and Digital Biodiversity System**

**Sprint Report (Sprint #1)**

**Unit Code:** COS30049
**Unit Name:** COMPUTING TECHNOLOGY INNOVATION PROJECT
**Tutor:** Lee Sue Han, Kelvin Yong, Mark Tee, Fu Swee Tee
**Group Name:** Plantiful (Group 7)

| # | Name | Student ID |
|---|---|---|
| 1 | Muhammad Maqeel bin Muhammad Kahfi | 102782384 |
| 2 | Nathan Sebastian Learmonth | 102782258 |
| 3 | Badrul Aliff Aiman bin Badrulmunirzaki | 102778273 |
| 4 | Gae Jayden MWINE | 104393610 |
| 5 | Ashley Wallen Anak Winston | 105806559 |
| 6 | Basill Agas Anak Heatley Rogers | 102778888 |

---

### Document Control

| Version | Date | Author | Status | Notes |
|---|---|---|---|---|
| 1.0 | 16 October 2026 | Group 7 | Issued | Initial Sprint #1 report. Records the sprint goal, the six committed product backlog items, the verification evidence collected to date, the deviations from the System Proposal, and the carry-over into Sprint #2. |

---

### Executive Summary

Sprint #1 (Weeks 6 to 9) established the working foundation of the Plantiful system: the Supabase backend and database, the offline-first mobile field application, the web Digital Plant Knowledge System with its public visitor view, the offline-to-cloud synchronisation path, and the first end-to-end IoT monitoring pipeline. The sprint goal was to move every major component from design into a runnable state so that Sprint #2 could be reserved for refinement, security re-assessment, and integration testing rather than first-time construction. That goal was met.

All six product backlog items committed to Sprint #1 (PB-1 to PB-6, business value 51 of a total 80) were delivered to a demonstrable prototype standard. The conservation officer review and approval workflow (PB-7), originally scheduled for Sprint #2, was delivered ahead of schedule as part of the web knowledge system. The team verified the developer-facing quality gates that do not depend on a physical device or a live field trial: mobile and web static type checking, linting, and the web production build all pass, and the source-level unit suites for the IoT evaluator, the sync conflict helper, and the acceptance measurement summariser pass. Security workstream activity ran ahead of the Week 11 gate, with two OWASP ZAP passes completed and no High-severity alerts outstanding.

The results in this report are deliberately separated into two categories: checks that were executed and observed, and acceptance measurements that still require a physical device or a live environment (QR lookup timing, offline sync success rate, the five-user usability walkthrough, and physical sensor end-to-end confirmation). This distinction is maintained so that no target in the proposal is reported as met on the strength of a source-only test.

Two implementation decisions taken during the sprint differ from the System Proposal and are recorded explicitly in Section 5: the synchronisation conflict strategy was implemented as revision-checked conflict detection rather than the initial last-write-wins plan, and the IoT transport was implemented as a USB-first hardware path rather than an MQTT simulation-first path. Both changes were made to strengthen data integrity and to bring real hardware forward, and both are documented with their residual work.

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [1. Sprint Overview](#1-sprint-overview)
  - [1.1 Sprint Goal](#11-sprint-goal)
  - [1.2 Duration and Cadence](#12-duration-and-cadence)
  - [1.3 Sprint Backlog and Completion](#13-sprint-backlog-and-completion)
  - [1.4 Definition of Done](#14-definition-of-done)
- [2. Deliverables Completed](#2-deliverables-completed)
  - [2.1 Backend and Database Platform (PB-1)](#21-backend-and-database-platform-pb-1)
  - [2.2 Mobile Offline-First Field Application (PB-2)](#22-mobile-offline-first-field-application-pb-2)
  - [2.3 Web Knowledge System and Public Visitor View (PB-3, PB-5)](#23-web-knowledge-system-and-public-visitor-view-pb-3-pb-5)
  - [2.4 Offline-to-Cloud Synchronisation (PB-4)](#24-offline-to-cloud-synchronisation-pb-4)
  - [2.5 IoT Foundational Pipeline (PB-6)](#25-iot-foundational-pipeline-pb-6)
- [3. Architecture as Built](#3-architecture-as-built)
- [4. Testing and Quality](#4-testing-and-quality)
  - [4.1 Automated Verification](#41-automated-verification)
  - [4.2 Acceptance Target Status](#42-acceptance-target-status)
  - [4.3 Security Workstream](#43-security-workstream)
- [5. Deviations from the System Proposal](#5-deviations-from-the-system-proposal)
- [6. Sprint Metrics](#6-sprint-metrics)
- [7. Team Contributions](#7-team-contributions)
- [8. Risks and Issues](#8-risks-and-issues)
- [9. Sprint Retrospective](#9-sprint-retrospective)
- [10. Sprint 2 Plan and Carry-Over](#10-sprint-2-plan-and-carry-over)
- [11. Approval](#11-approval)
- [Appendix A: Evidence Index](#appendix-a-evidence-index)

---

## 1. Sprint Overview

### 1.1 Sprint Goal

Deliver a runnable end-to-end foundation across all four mandatory areas of the system, so that a botanist can capture a plant record offline on mobile, sync it to the central database, review and approve it on the web, publish it to the public visitor view, and see corresponding IoT sensor readings and alerts on the officer dashboard.

### 1.2 Duration and Cadence

The project is delivered as two sprints, as defined in System Proposal Section 5.3. Sprint #1 ran across Weeks 6 to 9 and followed a Scrum cadence with a shared board, daily asynchronous stand-ups through the team's messaging channel, and a sprint review and retrospective at the end of the sprint. The team agreed a Definition of Done (Section 1.4) and re-baselined the risk register at the sprint boundary.

**[Image: Sprint board with the Week 6 to Week 9 columns and item states]**

### 1.3 Sprint Backlog and Completion

The following product backlog items from System Proposal Section 5.3.1 were committed to Sprint #1.

| Backlog ID | Item | Business Value | Status at sprint end |
|---|---|---|---|
| PB-1 | Set up Supabase project (PostgreSQL schema, auth, RBAC, storage) | 10 | Complete |
| PB-2 | Deliver mobile offline-first field app: record capture (QR, GPS, camera) | 9 | Complete |
| PB-3 | Deliver web knowledge system: species record CRUD and search | 9 | Complete |
| PB-4 | Implement offline-to-cloud sync (SQLite to Supabase) with defined conflict strategy | 8 | Complete |
| PB-5 | Add public read-only Visitor view publishing approved records | 8 | Complete |
| PB-6 | Add IoT sensor ingestion, monitoring dashboard and automated alerts | 7 | Complete |
| PB-7 | (Pulled forward from Sprint #2) Conservation officer review/approval workflow | 8 | Complete ahead of schedule |

Committed scope: 6 items, business value 51 of 80. Delivered scope including the pulled-forward review workflow: 7 items, business value 59.

### 1.4 Definition of Done

A backlog item was accepted as done only when all of the following held:

- The feature is implemented in the repository and merged into `main` through a reviewed pull request.
- The relevant static checks pass (project type checking and linting, and a successful production build where a build exists).
- Source-level automated tests covering the item's non-UI logic pass where such tests exist.
- The item can be demonstrated on the built artefacts without manual data patching.
- Any remaining measured acceptance test that requires a physical device or live environment is explicitly recorded as carry-over, not claimed as complete.

---

## 2. Deliverables Completed

### 2.1 Backend and Database Platform (PB-1)

The Supabase project provides the central database, authentication, role-based access control, and object storage that both client applications and the IoT pipeline depend on.

- **Schema.** Ten tables underpin the system: `user_profiles`, `species`, `species_photos`, `plant_records`, `plant_record_photos`, `sync_log`, `sensors`, `sensor_readings`, `alerts`, and `reports`. Field-record attributes support ground-truthing (`taxonomy`, `phenology`, `dbh_cm`) and the IoT layer adds `sensor_readings.soil_moisture` and `sensor_readings.rain`.
- **Migrations.** The migration history was consolidated into two idempotent scripts, `001_schema.sql` for a fresh project and `apply_project.sql` for everything else (row-level security policies, schema backfills, workflow triggers, photo visibility, the approval gate, and storage-bucket policies). The per-feature files are retained under `applied/` for reference only.
- **Security at the data layer.** Row-level security enforces the role model for `botanist`, `conservation_officer`, `admin`, and anonymous visitors. Object storage uses three buckets (`record-photos`, `species-photos`, and a deliberately private `reports` bucket). A reviewer-stamping trigger clears prior review state when an owner resubmits an edited record.
- **Verification.** The backend verification scripts report the anonymous write-block property as passed at the database layer, and the record photo write path as confirmed.

**[Image: Supabase table editor showing the ten tables]**

**[Image: SQL Editor session applying `apply_project.sql`]**

### 2.2 Mobile Offline-First Field Application (PB-2)

The mobile application is built with React Native 0.86 on Expo SDK 57 and is scoped to the botanist role.

- **Capture.** A capture flow records the species, height, morphology, and ground-truthing attributes, attaches camera photos, stamps GPS, and links the record to its QR tag.
- **QR scanning.** A scan flow reads the plant tag, resolves the record against a locally cached copy when offline, and records its own lookup timing as an acceptance measurement.
- **Offline store.** A local SQLite store (schema version 9) holds records, photos, and sync state so that capture works with no connectivity.
- **Records and profile.** A records view lists captures and their sync state, and a profile view manages the signed-in botanist and role.
- **Role guard.** Capture routes are guarded so that only the botanist role can create records, with read-only behaviour for other roles.

**[Image: Mobile capture screen with photo, GPS, and attributes]**

**[Image: Mobile QR scan screen resolving a cached record offline]**

### 2.3 Web Knowledge System and Public Visitor View (PB-3, PB-5)

The web application is built with Next.js 16.3.6, React 19.2.8, and Tailwind CSS 4, and serves conservation officers, administrators, and the public.

- **Records and search.** The records list and detail views present synced captures with species search, and officers can approve or reject submissions. The approvals page provides a focused pending queue.
- **Species catalogue.** Species management supports create, edit, and publish, with the public catalogue limited to approved and published data.
- **Supporting views.** The system includes a map view for located observations, a reports view with CSV and PDF export, an admin users page for role grants and revocations, and account pages.
- **Public visitor view.** The `/explore` route is a read-only public portal that lists only approved and published records, with no account required. All write attempts are blocked by row-level security at the database layer rather than in the user interface alone.

The production build compiled nineteen routes, and the visitor-view write-block was verified at the database layer.

**[Image: Web records list with species search and status]**

**[Image: Web record detail with approve and reject controls]**

**[Image: Public `/explore` portal listing approved species]**

### 2.4 Offline-to-Cloud Synchronisation (PB-4)

Synchronisation moves records and their photos from the local SQLite store to Supabase once connectivity returns.

- **Push path.** The sync centre pushes pending records with their photos and marks each record synced only after the server acknowledges it.
- **Conflict strategy.** Same-owner edits made on two devices are protected by a revision check. Each record carries a `version` field, and updates use a compare-and-swap on that version. A stale or unknown revision is surfaced as a visible `conflict` status, the local edit is preserved, and the owner can retry explicitly. Cross-owner edits are blocked by row-level security.
- **Measurement.** Each push attempt is recorded locally in an `acceptance_measurements` table so that a sync success rate can be calculated from real device data.

This strategy delivers the manual conflict queue that the System Proposal listed as an enhancement, and it does not rely on last-write-wins for same-owner edits. This is recorded as a deviation in Section 5.

**[Image: Mobile sync centre showing synced, failed, and conflicting attempts]**

**[Image: Conflict resolution prompt preserving the local edit]**

### 2.5 IoT Foundational Pipeline (PB-6)

The IoT layer ingests environmental readings and raises automated alerts.

- **Hardware node.** An ESP32 node with a DHT11 temperature and humidity sensor, a PIR motion sensor, a soil-moisture probe, and a rain sensor produces readings and emits a structured line per reading over serial.
- **Ingestion.** A host bridge reads the serial stream, registers the sensor, inserts each reading into `sensor_readings`, and evaluates the reading for alerts immediately.
- **Alert rules.** The evaluator raises `heat_stress` (high and critical thresholds), `drought_stress` (driven by low air humidity), and `unusual_movement` alerts, with a cooldown to suppress repeated alerts for the same condition, and a periodic pass to detect silent sensors.
- **Dashboard.** The officer dashboard at `/alerts` presents per-sensor status, environmental trend charts, movement and rain activity, and an alert timeline with a range selector and automatic refresh.
- **Verification.** During the sprint, live readings were inserted roughly every two seconds and `unusual_movement`, `heat_stress`, and `drought_stress` alerts were created and observed on the dashboard.

The physical end-to-end path is proven to the point of a real node producing real readings and real alerts in the database and on the dashboard. Longer-duration field confirmation remains a carry-over item.

**[Image: ESP32 node wired with DHT11, PIR, soil, and rain sensors]**

**[Image: Bridge terminal inserting readings every two seconds]**

**[Image: Officer `/alerts` dashboard with status cards, charts, and alert timeline]**

---

## 3. Architecture as Built

The implemented architecture matches the three-tier design in System Proposal Section 6.2.

- **Client tier.** A React Native offline-first mobile application for botanists and a Next.js web application for officers, administrators, and public visitors.
- **Application and data tier.** Supabase provides PostgreSQL, authentication, row-level security, the auto-generated REST interface, and object storage. The IoT ingest bridge is a small host-side service that uses the service-role key from host environment variables only.
- **Transport.** REST connects the mobile store, the web application, and the IoT bridge to Supabase. MQTT is retained as future work and is not required by the current path.
- **Offline store.** SQLite on the device holds captures and their photos until synchronisation succeeds.

**[Image: System architecture diagram (as built)]**

---

## 4. Testing and Quality

### 4.1 Automated Verification

The following checks were executed and observed during the sprint. The scope column records exactly what each result does and does not cover.

| Area | Command | Result | Scope |
|---|---|---|---|
| Mobile typing | `npx tsc --noEmit` | Pass | Static type checking |
| Mobile lint | `npx expo lint` | Pass | Source linting |
| Revision-checked edit | `npm run test:coverage` | Pass, 3 tests; 100 percent coverage of `sync-edit.ts` only | Stale update, unknown revision, server error |
| Measurement summariser | `python -m unittest discover -s mobile/scripts` | Pass, 2 tests | Retries, denominators, zero samples |
| IoT bridge and evaluator | `python -m unittest discover -s iot` | Pass, 7 tests | Timestamp handling, ingestion, immediate alert, cooldown, invalid node IDs, silent-sensor detection, severity |
| Web typing | `npx tsc --noEmit` | Pass | Static type checking |
| Web lint | `npm run lint` | Pass, one pre-existing image optimisation warning | Source linting |
| Web production build | `npm run build` | Pass, 19 routes compiled | Compilation only, no live request verification |

Source-level tests cannot establish a QR speed result, a sync success rate, a five-user usability result, or live IoT alert timing. Those require measured trials on physical devices and the live demo environment and are listed as carry-over in Section 10.

**[Image: Terminal capture of the test suites passing]**

### 4.2 Acceptance Target Status

The following table reports each measurable target from System Proposal Section 7.0 against its status at the end of Sprint #1. Targets are marked as verified only where evidence exists.

| Quality attribute | Target | Status at sprint end |
|---|---|---|
| Reliability (offline sync) | More than 95 percent of test submissions sync without data loss | Implementation complete; measured trial pending |
| Functional performance | QR scan to record in under five seconds average | Instrumentation built; measured trial pending |
| Security | No critical or high vulnerabilities remaining after remediation | Two ZAP passes complete with no High findings; final re-assessment pending |
| Code quality | More than 80 percent coverage on backend API and mobile sync module | Pending; helper currently at 100 percent of `sync-edit.ts` only |
| Usability | More than 90 percent unassisted task completion across a five-user walkthrough | Pending; walkthrough not yet run |
| Data integrity | 100 percent of required fields validated before sync | Validation present; backend validation testing pending |
| Public access correctness | 100 percent of unauthorised writes fail with no data change; unapproved records never visible | Verified at the database layer |

### 4.3 Security Workstream

Security activity ran ahead of the Week 11 gate. The security assessment progressed through static analysis, dependency scanning, row-level security verification, a manual secure-code review, and two dynamic passes with OWASP ZAP 2.17.0 (an anonymous baseline and an authenticated officer session). Twelve findings were recorded across the assessment, and the remediated ones were confirmed by re-scan. No High-severity ZAP alerts were outstanding at the end of the sprint. The full detail is in `Docs/Reports/Security_Assessment_Report.md` with evidence under `Docs/Reports/evidence/`.

One security action remains open and is tracked as an issue: the service-role key and test-account passwords exposed during development must be rotated before submission.

**[Image: OWASP ZAP authenticated scan summary]**

**[Image: Security response headers before and after remediation]**

---

## 5. Deviations from the System Proposal

The following differences between the System Proposal and the delivered prototype are recorded here so that design intent can be distinguished from delivered behaviour.

| Area | System Proposal | As built in Sprint #1 | Reason | Remaining work |
|---|---|---|---|---|
| Sync conflict strategy | Last-write-wins first, with a manual conflict queue as an enhancement | Revision-checked compare-and-swap on `plant_records.version`, with a visible conflict status and manual resolution | Stronger data integrity; protects same-owner multi-device edits without silent overwrite | None for the core path; the two-device conflict evidence trial is still to be run |
| IoT transport | Simulated sensors over MQTT first, with the ESP32 as a later swap-in | USB-first path with a real ESP32 node, a host bridge, and a periodic evaluator | Real hardware was available, so the true pipeline was built directly | MQTT remains future work; longer-duration physical confirmation is pending |
| Officer review and approval (PB-7) | Scheduled for Sprint #2 | Delivered in Sprint #1 with the web knowledge system | The web system and the approval gate share one data model, so building them together reduced rework | Final integration testing remains in Sprint #2 |
| Sensitive-data encryption | Objective refers to encryption of personal records and reviews | Confidentiality currently enforced through authentication and row-level security, with TLS in transit | Encryption posture is assessed in the security report | Field-level encryption is to be confirmed against the stated objective before submission |
| Optional innovation (Objective 5) | Proposed, pending tutor confirmation | Design write-up complete; prototype not built | Documented as optional in the proposal | Pursued only with tutor agreement |

---

## 6. Sprint Metrics

| Metric | Value | Note |
|---|---|---|
| Committed backlog items | 6 | PB-1 to PB-6 |
| Completed backlog items | 6, plus PB-7 pulled forward | 7 total delivered |
| Committed business value | 51 of 80 | Weighted by the proposal's business value column |
| Delivered business value | 59 of 80 | Includes the pulled-forward review workflow |
| Automated unit tests passing | 12 | IoT 7, mobile sync helper 3, summariser 2 |
| Web routes compiled | 19 | Production build |
| Open High-severity security findings | 0 | After two ZAP passes |

**[Image: Sprint 1 burndown chart (planned versus completed)]**

**[Image: Sprint 1 velocity chart for comparison with Sprint 2]**

---

## 7. Team Contributions

The team operates as a cross-functional group of six, sharing one TypeScript across the mobile and web applications. Each member's Sprint #1 contribution and its evidence are recorded below. Populate the workstream and evidence fields with the specific pull requests, commits, and artefact links before submission.

| # | Team member | Primary Sprint #1 workstream | Contribution summary | Evidence |
|---|---|---|---|---|
| 1 | Muhammad Maqeel bin Muhammad Kahfi | [workstream] | [summary] | [Insert: pull request links, commit range, screenshot] |
| 2 | Nathan Sebastian Learmonth | [workstream] | [summary] | [Insert: pull request links, commit range, screenshot] |
| 3 | Badrul Aliff Aiman bin Badrulmunirzaki | [workstream] | [summary] | [Insert: pull request links, commit range, screenshot] |
| 4 | Gae Jayden MWINE | [workstream] | [summary] | [Insert: pull request links, commit range, screenshot] |
| 5 | Ashley Wallen Anak Winston | [workstream] | [summary] | [Insert: pull request links, commit range, screenshot] |
| 6 | Basill Agas Anak Heatley Rogers | [workstream] | [summary] | [Insert: pull request links, commit range, screenshot] |

The workstreams delivered in Sprint #1, for assignment against the members above, were: backend and database platform; mobile capture and QR; mobile offline store and synchronisation; web knowledge system and approval workflow; public visitor view and reporting; IoT hardware, ingest bridge, and dashboard; and testing, security, and documentation.

**[Image: GitHub contributors view for the sprint window]**

**[Image: GitHub pull requests merged during Sprint #1]**

---

## 8. Risks and Issues

The Sprint #1 risk posture against the register in System Proposal Section 7.1, with the issues actually encountered.

| Ref | Risk or issue | Status at sprint end | Action |
|---|---|---|---|
| R1 | Data loss during offline-to-cloud sync | Mitigated in design | Revision check and preserved local copy; measured sync trial pending |
| R2 | IoT hardware unavailable within the trimester | Retired | A real ESP32 node was obtained and used |
| R3 | Poor or no connectivity in the field | Mitigated in design | Offline store and deferred sync implemented |
| R4 | Security vulnerabilities discovered late | Partially mitigated | Two ZAP passes complete; final re-assessment pending |
| R5 | Scope creep against the timeline | Managed | Review workflow pulled forward deliberately; optional innovation held back |
| R6 | Duplicate or inconsistent species records | Mitigated in design | Stable QR record ID and mandatory-field validation |
| R7 | Publicly exposing unapproved data | Mitigated and verified | Read-only route group and row-level security; write-block verified |
| I1 | Sensor readings unstable during wiring changes | Open | DHT11 reported an out-of-range reading and the soil probe fluctuated when disturbed; wiring must be reseated and analog thresholds calibrated before final field evidence |
| I2 | Development credentials exposed during setup | Open | Service-role key and test-account passwords must be rotated before submission |

---

## 9. Sprint Retrospective

**What went well.**

- The backend-first sequencing worked. Building Supabase first meant the mobile, web, and IoT workstreams could run in parallel without blocking each other.
- A single TypeScript stack across mobile and web let members move between workstreams and reduced duplicated effort.
- The security workstream ran ahead of its gate, which leaves remediation time before the final demo.
- The extras in the mobile sync path, namely conflict detection and the acceptance measurement instrumentation, were delivered without slipping the committed scope.

**What did not go well.**

- Physical sensor wiring was less stable than expected, and a disturbed DHT11 produced an out-of-range reading that triggered spurious alerts. Analog soil and rain thresholds are still calibration-dependent.
- Development credentials were handled loosely at setup time, which created a cleanup task that should not have been necessary.
- Some acceptance measurements were only instrumented during the sprint, so the measured trials were deferred to Sprint #2 rather than completed alongside the features.

**Improvements for Sprint #2.**

- Add a short hardware bench check with a warm-up and a calibration step before any field evidence is captured.
- Use a single documented secrets workflow, with no keys in source, in chat, or in client bundles.
- Run the measured acceptance trials (QR timing, sync success, five-user walkthrough) as scheduled work items rather than as optional follow-ups.

---

## 10. Sprint 2 Plan and Carry-Over

Sprint #2 (Weeks 10 to 12) covers the remaining backlog items and the integration, security, and documentation close-out.

| Backlog ID | Item | Focus for Sprint #2 |
|---|---|---|
| PB-7 | Conservation officer review/approval workflow | Delivered early; final integration testing only |
| PB-8 | IoT alert threshold tuning and ESP32 hardware swap-in | Calibrate thresholds against observed conditions and confirm the hardware path end to end |
| PB-9 | Complete security: vulnerability scan, remediation, re-verify | Final ZAP pass, confirm zero critical and high findings, rotate exposed credentials |
| PB-10 | Final integration, system testing, documentation and demo | Full round-trip testing, user manual, final report, and live demo |

Carry-over items from Sprint #1 that must be closed in Sprint #2:

1. Run the QR scan-to-record timing trial on a physical device using the acceptance measurement export.
2. Run the offline capture and idempotent push trial and report the sync success rate.
3. Run the two-device same-owner conflict trial and record the conflict evidence.
4. Run the physical sensor trial with a calibrated node and confirm one reading and its alert end to end.
5. Conduct the five-user usability walkthrough against the draft user manual.
6. Rotate the exposed service-role key and reset the test-account passwords.

---

## 11. Approval

| Role | Name | Signature | Date |
|---|---|---|---|
| Team lead | [name] | [signature] | [date] |
| Project sponsor (tutor) | [name] | [signature] | [date] |

---

## Appendix A: Evidence Index

Evidence referenced in this report is stored in the locations below.

| Evidence | Location |
|---|---|
| Prototype verification record | `Docs/Prototype_Verification.md` |
| Deployment and maintenance runbook | `Docs/Prototype_Deployment_and_Maintenance.md` |
| Security assessment report | `Docs/Reports/Security_Assessment_Report.md` |
| Security verification outputs | `Docs/Reports/evidence/checks/` |
| OWASP ZAP scan reports | `Docs/Reports/evidence/zap/` |
| Application screenshots | `Docs/Reports/evidence/screenshots/` |
| IoT design and hardware notes | `iot/README.md` |
| Web application notes | `web/README.md` |
| Mobile, web, backend, and IoT setup | Repository `README.md` and component READMEs |

Screenshot and contribution placeholders to be replaced before submission are marked in the body of this report with square brackets, for example `[Image: web records list]`.
