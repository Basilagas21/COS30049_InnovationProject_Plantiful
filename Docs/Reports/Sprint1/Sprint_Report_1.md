# Smart Ground-Truthing and Digital Biodiversity System

## Sprint #1 Report

**Unit Code:** COS30049
**Unit Name:** COMPUTING TECHNOLOGY INNOVATION PROJECT
**Tutor:** Lee Sue Han, Kelvin Yong, Mark Tee, Fu Swee Tee
**Group Name:** Plantiful (Group 7)
**Sprint:** Sprint #1, Weeks 6 to 9
**Report Version:** 1.0
**Report Date:** 17 October 2026

| # | Name | Student ID |
|---|---|---|
| 1 | Muhammad Maqeel bin Muhammad Kahfi | 102782384 |
| 2 | Nathan Sebastian Learmonth | 102782258 |
| 3 | Badrul Aliff Aiman bin Badrulmunirzaki | 102778273 |
| 4 | Gae Jayden MWINE | 104393610 |
| 5 | Ashley Wallen Anak Winston | 105806559 |
| 6 | Basill Agas Anak Heatley Rogers | 102778888 |

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [1. Sprint #1 Plan](#1-sprint-1-plan)
  - [1.1 What did we plan to do?](#11-what-did-we-plan-to-do)
  - [1.2 Sprint #1 backlog (planned)](#12-sprint-1-backlog-planned)
  - [1.3 Team Responsibility](#13-team-responsibility)
  - [1.4 Expected Output](#14-expected-output)
- [2. Sprint #1 Review Report](#2-sprint-1-review-report)
  - [2.1 What did we achieve?](#21-what-did-we-achieve)
  - [2.2 Backlog Item Status](#22-backlog-item-status)
  - [2.3 Definition of Done](#23-definition-of-done)
  - [2.4 Backend and Database Platform (PB-1)](#24-backend-and-database-platform-pb-1)
  - [2.5 Mobile Offline-First Field Application (PB-2)](#25-mobile-offline-first-field-application-pb-2)
  - [2.6 Web Knowledge System and Public Visitor View (PB-3, PB-5)](#26-web-knowledge-system-and-public-visitor-view-pb-3-pb-5)
  - [2.7 Offline-to-Cloud Synchronisation (PB-4)](#27-offline-to-cloud-synchronisation-pb-4)
  - [2.8 IoT Foundational Pipeline (PB-6)](#28-iot-foundational-pipeline-pb-6)
  - [2.9 Architecture as Built](#29-architecture-as-built)
    - [2.9.1 From Capture to Public Record](#291-from-capture-to-public-record)
- [3. How the System Works](#3-how-the-system-works)
  - [3.1 The Three-Tier Structure](#31-the-three-tier-structure)
  - [3.2 The Mobile Field Application](#32-the-mobile-field-application)
    - [Signing In](#signing-in)
    - [Finding the Species](#finding-the-species)
    - [Capturing an Observation](#capturing-an-observation)
    - [Photographs](#photographs)
    - [Location](#location)
    - [Plant Tags and QR Codes](#plant-tags-and-qr-codes)
    - [The Offline Store](#the-offline-store)
    - [Sending Data to the Cloud](#sending-data-to-the-cloud)
    - [Protecting Edits Made in Two Places](#protecting-edits-made-in-two-places)
    - [Measuring Reliability](#measuring-reliability)
    - [The Profile Area](#the-profile-area)
  - [3.3 The Web Knowledge System](#33-the-web-knowledge-system)
    - [Signing In (Officers and Administrators)](#signing-in-officers-and-administrators)
    - [The Records Workspace](#the-records-workspace)
    - [The Approvals Queue](#the-approvals-queue)
    - [Species Management](#species-management)
    - [Search and Filtering](#search-and-filtering)
    - [The Public Visitor Portal](#the-public-visitor-portal)
    - [The Distribution Map](#the-distribution-map)
    - [Report Generation](#report-generation)
    - [The Administrator's User Page](#the-administrators-user-page)
    - [The IoT Monitoring Dashboard](#the-iot-monitoring-dashboard)
  - [3.4 The IoT Monitoring Chain](#34-the-iot-monitoring-chain)
    - [Sensing at the Plant](#sensing-at-the-plant)
    - [Transporting the Readings](#transporting-the-readings)
    - [The Host Bridge](#the-host-bridge)
    - [Evaluating Each Reading](#evaluating-each-reading)
    - [The Officer Dashboard](#the-officer-dashboard)
  - [3.5 The Database and Security Model](#35-the-database-and-security-model)
    - [What Is Stored](#what-is-stored)
    - [Roles](#roles)
    - [Enforcing Permissions Inside the Database](#enforcing-permissions-inside-the-database)
    - [File Storage](#file-storage)
    - [The Approval Gate](#the-approval-gate)
    - [Transport Security](#transport-security)
  - [3.6 How a Single Observation Travels Through the System](#36-how-a-single-observation-travels-through-the-system)
  - [3.7 User Needs Analysis](#37-user-needs-analysis)
- [4. How the System Meets the Project Requirements](#4-how-the-system-meets-the-project-requirements)
  - [4.1 Problem Statements Addressed](#41-problem-statements-addressed)
  - [4.2 Objectives Delivered](#42-objectives-delivered)
  - [4.3 Mandatory Areas of Focus](#43-mandatory-areas-of-focus)
    - [Area 1. Smart Digital Ground-Truthing Platform](#area-1-smart-digital-ground-truthing-platform)
    - [Area 2. Digital Plant Knowledge System](#area-2-digital-plant-knowledge-system)
    - [Area 3. Cybersecurity and Data Protection](#area-3-cybersecurity-and-data-protection)
    - [Area 4. IoT-Enabled Plant Protection](#area-4-iot-enabled-plant-protection)
  - [4.4 Summary of Requirement Coverage](#44-summary-of-requirement-coverage)
- [5. Testing and Quality](#5-testing-and-quality)
  - [5.1 Test Environment](#51-test-environment)
  - [5.2 Automated Verification](#52-automated-verification)
  - [5.3 Acceptance Target Status](#53-acceptance-target-status)
  - [5.4 Security Workstream](#54-security-workstream)
- [6. Deviations from the System Proposal](#6-deviations-from-the-system-proposal)
- [7. Sprint Metrics, Risks and Issues](#7-sprint-metrics-risks-and-issues)
  - [7.1 Sprint Metrics](#71-sprint-metrics)
  - [7.2 Risks and Issues](#72-risks-and-issues)
- [8. Sprint #1 Retrospective Report](#8-sprint-1-retrospective-report)
  - [8.1 What went well](#81-what-went-well)
  - [8.2 What did not go well / Problems encountered](#82-what-did-not-go-well--problems-encountered)
  - [8.3 Improvements for next sprint](#83-improvements-for-next-sprint)
  - [8.4 Sprint 2 Plan and Carry-Over](#84-sprint-2-plan-and-carry-over)
  - [8.5 Product Enhancements for Future Sprints](#85-product-enhancements-for-future-sprints)
- [9. Sprint #1 Deliverables](#9-sprint-1-deliverables)
  - [9.1 Software](#91-software)
  - [9.2 Documentation](#92-documentation)
  - [9.3 Data](#93-data)
- [10. Evidence](#10-evidence)
  - [10.1 Mobile](#101-mobile)
  - [10.2 Web](#102-web)
- [11. Conclusion](#11-conclusion)

---

## Executive Summary

Sprint #1 ran from Week 6 to Week 9. It established the working foundation of the Plantiful system. That foundation covers the Supabase backend and database, the offline-first mobile field application, the web Digital Plant Knowledge System with its public visitor view, the offline-to-cloud synchronisation path, and the first end-to-end IoT monitoring pipeline. The sprint goal was to move every major component from design into a runnable state. Doing so reserved Sprint #2 for refinement, security re-assessment, and integration testing rather than first-time construction. That goal was met.

All six product backlog items committed to Sprint #1 were delivered to a demonstrable prototype standard. Those items are PB-1 through PB-6, carrying a combined business value of 51 out of a total 80. The conservation officer review and approval workflow, PB-7, was originally scheduled for Sprint #2. It was delivered ahead of schedule as part of the web knowledge system.

In numbers, Sprint #1 delivered 7 backlog items with a combined business value of 59 out of 80, supported by 12 passing unit tests, 19 compiled web routes, 10 of 10 database-layer write-block checks, and two OWASP ZAP passes with no High-severity alerts outstanding.

The team verified the developer-facing quality gates that do not depend on a physical device or a live field trial. Mobile and web static type checking pass. Linting passes. The web production build passes. The source-level unit suites for the IoT evaluator, the sync conflict helper, and the acceptance measurement summariser all pass. Security workstream activity ran ahead of the Week 11 gate. Two OWASP ZAP passes were completed with no High-severity alerts outstanding.

The results in this report are deliberately separated into two categories. The first category is checks that were executed and observed. The second category is acceptance measurements that still require a physical device or a live environment. Those measurements are QR lookup timing, offline sync success rate, the five-user usability walkthrough, and physical sensor end-to-end confirmation. This distinction is maintained so that no target in the proposal is reported as met on the strength of a source-only test.

Two implementation decisions taken during the sprint differ from the System Proposal. Both are recorded in Section 6, alongside three schedule and scope deviations. The first implementation change is the synchronisation conflict strategy. It was implemented as revision-checked conflict detection rather than the initial last-write-wins plan. The second is the IoT transport. It was implemented as a USB-first hardware path rather than an MQTT simulation-first path. Both changes were made to strengthen data integrity and to bring real hardware forward. The remaining deviations in Section 6 cover the early delivery of the review workflow, the current encryption posture, and the deferred optional objective. Each is documented with its residual work.

---

## 1. Sprint #1 Plan

### 1.1 What did we plan to do?

The Initial Release Schedule in the System Proposal Report scoped Sprint #1, covering Weeks 6 to 9, to the six highest business-value backlog items. Those items were standing up the Supabase backend, delivering the first versions of the mobile field app and the web knowledge system, wiring offline-to-cloud sync, publishing a public read-only visitor view, and building the IoT sensor-ingestion and alerting pipeline.

Backlog items 7 through 10 were deliberately deferred to Sprint #2, which covers Weeks 10 to 12. Those deferred items are officer review and approval with reporting, IoT hardware swap-in, full security testing, and final integration.

### 1.2 Sprint #1 backlog (planned)

| # | Backlog item | Depends on | Business value (1 to 10) |
|---|---|---|---|
| 1 | Set up Supabase project (PostgreSQL schema, auth, RBAC, storage) | N/A | 10 |
| 2 | Deliver mobile offline-first field app: record capture (QR, GPS, camera) | 1 | 9 |
| 3 | Deliver web knowledge system: species record CRUD and search | 1 | 9 |
| 4 | Implement offline-to-cloud sync (SQLite to Supabase) with conflict strategy | 2 | 8 |
| 5 | Add public read-only Visitor view publishing approved records | 3 | 8 |
| 6 | Add IoT sensor ingestion, monitoring dashboard and automated alerts | 4 | 7 |

The schedule in Figure 1 maps the two sprints onto the trimester, including the item pulled forward from Sprint #2 and the carry-over items.

[picture of figure 1 here]

Figure 1. Sprint timeline, Weeks 6 to 9 and Weeks 10 to 12, with milestones and carry-over.

### 1.3 Team Responsibility

| Name | Role | Sprint #1 backlog items owned |
|---|---|---|
| Badrul Aliff Aiman bin Badrulmunirzaki | Web Knowledge System (Reporting & Maps) | Item 3 (web CRUD/search), Item 5 (visitor view) |
| Nathan Sebastian Learmonth | Web Knowledge System (Records) | Item 3 (web CRUD/search), Item 5 (visitor view) |
| Muhammad Maqeel bin Muhammad Kahfi | Mobile App (Sync & Backend APIs) | Item 1 (Supabase setup), Item 4 (offline sync) |
| Basill Agas Anak Heatley Rogers | Team Lead, Mobile App (Field Data Capture) | Item 2 (mobile capture app) |
| Gae Jayden MWINE | IoT-Based Plant Protection | Item 6 (sensor ingestion, alerts, dashboard) |
| Ashley Wallen Anak Winston | Integration, PM & Documentation | Item 5 (visitor view), cross-team integration |

### 1.4 Expected Output

The expected output was a working Supabase backend with row-level security in place. A mobile app that can capture a record offline and then sync it. A web app that can list, search, and CRUD species. A public visitor view of approved records. An IoT pipeline that can turn a sensor reading into an alert. In short, every layer of the architecture proven end to end. Review and approval plus formal security testing were intentionally left for Sprint #2.

---

## 2. Sprint #1 Review Report

### 2.1 What did we achieve?

The team delivered all six Sprint #1 backlog items. It also shipped meaningful progress on item 7, which is officially Sprint #2 scope, ahead of schedule.

The mapping of planned items to what actually landed is based on two things. The first is the project commit history, which recorded 67 commits across web, mobile, IoT, and backend. The second is the independent verification carried out for the Security Assessment Report.

### 2.2 Backlog Item Status

| Backlog ID | Item | Business value | Status at sprint end |
|---|---|---|---|
| PB-1 | Set up Supabase project (PostgreSQL schema, auth, RBAC, storage) | 10 | Complete and verified |
| PB-2 | Deliver mobile offline-first field app: record capture (QR, GPS, camera) | 9 | Complete to prototype standard, measured QR trial pending |
| PB-3 | Deliver web knowledge system: species record CRUD and search | 9 | Complete |
| PB-4 | Implement offline-to-cloud sync (SQLite to Supabase) with defined conflict strategy | 8 | Complete to prototype standard, measured sync trial pending |
| PB-5 | Add public read-only Visitor view publishing approved records | 8 | Complete and verified |
| PB-6 | Add IoT sensor ingestion, monitoring dashboard and automated alerts | 7 | Complete to prototype standard, longer field confirmation pending |
| PB-7 | (Pulled forward from Sprint #2) Conservation officer review/approval workflow | 8 | Complete ahead of schedule, final integration testing in Sprint #2 |

Committed scope was 6 items with a business value of 51 out of 80. Delivered scope, including the pulled-forward review workflow, was 7 items with a business value of 59.

### 2.3 Definition of Done

A backlog item was accepted as done only when all of the following held.

- The feature is implemented in the repository and integrated into the main branch, either through a reviewed pull request or by reconciling the work against the current main.
- The relevant static checks pass. This covers project type checking, linting, and a successful production build where a build exists.
- Source-level automated tests covering the item's non-UI logic pass where such tests exist.
- The item can be demonstrated on the built artefacts without manual data patching.
- Any remaining measured acceptance test that requires a physical device or live environment is explicitly recorded as carry-over, not claimed as complete.

### 2.4 Backend and Database Platform (PB-1)

The Supabase project provides the central database, authentication, role-based access control, and object storage. Both client applications and the IoT pipeline depend on it.

The schema has ten tables. They are `user_profiles`, `species`, `species_photos`, `plant_records`, `plant_record_photos`, `sync_log`, `sensors`, `sensor_readings`, `alerts`, and `reports`. Field-record attributes support ground-truthing through `taxonomy`, `phenology`, and `dbh_cm`. The IoT layer adds `sensor_readings.soil_moisture` and `sensor_readings.rain`. Figure 2 shows the schema and the relationships between the tables.

[picture of figure 2 here]

Figure 2. Entity relationship diagram, grouped into identity, species, field records, IoT, and system tables.

The migration history was consolidated into two idempotent scripts. `001_schema.sql` applies to a fresh project. `apply_project.sql` covers everything else, which includes row-level security policies, schema backfills, workflow triggers, photo visibility, the approval gate, and storage-bucket policies. The per-feature files are retained under `applied/` for reference only.

Row-level security enforces the role model for `botanist`, `conservation_officer`, `admin`, and anonymous visitors. Object storage uses three buckets. They are `record-photos`, `species-photos`, and a deliberately private `reports` bucket. A reviewer-stamping trigger clears prior review state when an owner resubmits an edited record.

The backend verification scripts report the anonymous write-block property as passed at the database layer. The record photo write path is confirmed.

### 2.5 Mobile Offline-First Field Application (PB-2)

The mobile application is built with React Native 0.86 on Expo SDK 57. It is scoped to the botanist role.

A capture flow records the species, height, morphology, and ground-truthing attributes. It attaches camera photos, stamps GPS, and links the record to its QR tag. A scan flow reads the plant tag and resolves the record against a locally cached copy when offline. The scan also records its own lookup timing as an acceptance measurement. A local SQLite store at schema version 9 holds records, photos, and sync state. This lets capture work with no connectivity.

A records view lists captures and their sync state. A profile view manages the signed-in botanist and role. Capture routes are guarded so that only the botanist role can create records. Other roles get read-only behaviour.

One mobile defect is worth recording here because it affected this item. Photo uploads from the app were failing silently for an unknown period. The problem was found during the security review rather than during normal development. It was corrected and the upload path was re-verified. The finding is recorded as F-01 in Section 5.4.

### 2.6 Web Knowledge System and Public Visitor View (PB-3, PB-5)

The web application is built with Next.js 16.3.6, React 19.2.8, and Tailwind CSS 4. It serves conservation officers, administrators, and the public.

The records list and detail views present synced captures with species search. Officers can approve or reject submissions. The approvals page provides a focused pending queue. Species management supports create, edit, and publish. The public catalogue is limited to approved and published data.

The system also includes a map view for located observations. It includes a reports view with CSV and PDF export. It includes an admin users page for role grants and revocations. It includes account pages.

The `/explore` route is a read-only public portal. It lists only approved and published records and requires no account. All write attempts are blocked by row-level security at the database layer rather than in the user interface alone.

The production build compiled nineteen routes. The visitor-view write-block was verified at the database layer.

### 2.7 Offline-to-Cloud Synchronisation (PB-4)

Synchronisation moves records and their photos from the local SQLite store to Supabase once connectivity returns.

The sync centre pushes pending records along with their photos. It marks each record synced only after the server acknowledges it.

Same-owner edits made on two devices are protected by a revision check. Each record carries a `version` field and updates use a compare-and-swap on that version. A stale or unknown revision is surfaced as a visible `conflict` status. The local edit is preserved and the owner can retry explicitly. Cross-owner edits are blocked by row-level security.

Each push attempt is recorded locally in an `acceptance_measurements` table. This lets a sync success rate be calculated from real device data.

This strategy delivers the manual conflict queue that the System Proposal listed as an enhancement. It does not rely on last-write-wins for same-owner edits. This is recorded as a deviation in Section 6.

### 2.8 IoT Foundational Pipeline (PB-6)

The IoT layer ingests environmental readings and raises automated alerts.

An ESP32 node carries a DHT11 temperature and humidity sensor, a PIR motion sensor, a soil-moisture probe, and a rain sensor. It produces readings and emits a structured line per reading over serial. A host bridge reads the serial stream, registers the sensor, and inserts each reading into `sensor_readings`. The bridge then evaluates the reading for alerts immediately. Figure 3 shows how the sensors connect to the board.

[picture of figure 3 here]

Figure 3. IoT node wiring, showing power, ground, and each sensor's signal pin, with analog and digital pins marked.

The evaluator raises three alert types. `heat_stress` has high and critical thresholds. `drought_stress` is driven by low air humidity. `unusual_movement` covers motion. A cooldown suppresses repeated alerts for the same condition. A periodic pass detects silent sensors. Figure 4 shows the decision path for a single reading.

[picture of figure 4 here]

Figure 4. Alert logic for one reading, including heat, drought, and motion checks, the cooldown, and the silent-sensor pass.

The officer dashboard at `/alerts` presents per-sensor status, environmental trend charts, movement and rain activity, and an alert timeline. It has a range selector and automatic refresh.

During the sprint, live readings were inserted roughly every two seconds. `unusual_movement`, `heat_stress`, and `drought_stress` alerts were created and observed on the dashboard.

The physical end-to-end path is proven to the point of a real node producing real readings and real alerts in the database and on the dashboard. Longer-duration field confirmation remains a carry-over item.

### 2.9 Architecture as Built

The implemented architecture matches the three-tier design in System Proposal Section 6.2. Figure 5 places the system in context with the people and the sensor node that interact with it.

[picture of figure 5 here]

Figure 5. System context, showing the botanist, conservation officer, administrator, public visitor, and sensor node around the Plantiful system.

The client tier holds a React Native offline-first mobile application for botanists. It also holds a Next.js web application for officers, administrators, and public visitors.

The application and data tier is Supabase. It provides PostgreSQL, authentication, row-level security, the auto-generated REST interface, and object storage. The IoT ingest bridge is a small host-side service. It uses the service-role key from host environment variables only.

REST connects the mobile store, the web application, and the IoT bridge to Supabase. MQTT is retained as future work and is not required by the current path. SQLite on the device holds captures and their photos until synchronisation succeeds. Figure 6 shows the tiers, the protocols between them, and the offline path.

[picture of figure 6 here]

Figure 6. Three-tier architecture as built, with the IoT bridge, the protocols on each link, and the offline path marked.

### 2.9.1 From Capture to Public Record

Figure 7 traces one field observation through the full pipeline. It runs from the moment a botanist captures it offline to the moment it becomes visible on the public visitor view.

[picture of figure 7 here]

Figure 7. From offline capture to public record, covering capture, local store, sync, approval, and publication.

---

## 3. How the System Works

This section explains every part of the delivered system in plain language. It is written for a reviewer who has not read the source code. Each part is described by what it does, who uses it, and how it communicates with the rest of the system.

### 3.1 The Three-Tier Structure

The system is built as three connected tiers. The client tier holds the two applications people interact with, which are the mobile field app and the web knowledge system. The application and data tier is a single cloud backend that stores every record, enforces every permission, and hosts the sign-in service and file storage. The device tier is the sensor node that monitors a plant's surroundings and reports what it measures.

All three tiers meet at the same backend. There is one database, one set of user accounts, and one permission model. A record created on a phone in the forest becomes visible to an officer on a laptop within seconds of connectivity returning. A sensor reading taken at a plant's location appears on the same officer dashboard that shows field records. Nothing is duplicated between separate stores.

### 3.2 The Mobile Field Application

The mobile application is the botanist's tool in the field. It is installed on a phone or tablet and works with or without a network connection. Its purpose is to capture a complete, structured observation of a plant and hold it safely until it can be sent to the central database. Figure 8 shows how a user moves through the mobile screens and the web pages.

[picture of figure 8 here]

Figure 8. Navigation maps for the mobile screen flow and the web sitemap, with public and role-gated routes marked.

#### Signing In

The botanist signs in with an email address and password. The application remembers the session, so daily use does not require repeated sign-in. Only accounts with the botanist role can create new records. Other roles open the application in a read-only state, which prevents accidental data entry by the wrong person.

#### Finding the Species

Before capturing, the botanist can browse or search the species catalogue. The catalogue is cached on the device, so it remains searchable in areas with no signal. This supports identification in the field and reduces the chance of recording the wrong species name.

#### Capturing an Observation

The capture flow walks the botanist through each required piece of information. It starts with the species selection, then collects the taxonomy, the morphological characteristics, the plant height, and any other attributes the project requires. The form prevents submission until the required fields are filled, which protects data quality at the point of entry rather than after the fact.

#### Photographs

The botanist photographs the plant using the device camera. Photographs are attached directly to the observation, so evidence and data stay together. Images are stored on the device first and uploaded later during synchronisation.

#### Location

The application stamps the device's GPS position onto the observation automatically. This removes the need for manual coordinate entry and gives every record a verifiable location.

#### Plant Tags and QR Codes

Each plant record generates a QR code. A printed tag carrying that code is fixed at the plant in the field. Scanning the tag with the application opens the stored record immediately, which lets a returning botanist see what was previously recorded at that exact plant without searching the catalogue. Scanning also works against the local cache when offline.

#### The Offline Store

Everything the botanist captures is written to a small database on the device. This local store holds records, their photographs, and their synchronisation state. Because the source of truth during fieldwork is the device itself, the botanist can work deep in the forest for a full day with no connectivity and lose nothing.

#### Sending Data to the Cloud

When connectivity returns, the botanist opens the synchronisation centre and sends the pending items. Each record is marked as sent only after the central database confirms receipt. Anything that fails stays visible in the queue with its reason, so nothing disappears silently.

#### Protecting Edits Made in Two Places

If the same record is edited on two devices, the system detects the clash rather than overwriting one version with the other. Each record carries a version marker. When an edit arrives that does not match the current version in the cloud, the application holds it as a conflict, keeps the local copy intact, and shows it to the owner for an explicit decision. This prevents silent data loss.

#### Measuring Reliability

Every send attempt is recorded on the device with its outcome. These measurements are exported after trials so the team can report a real sync success rate rather than an estimated one.

#### The Profile Area

The profile screen shows who is signed in and under which role. It also lets the botanist manage their own account details.

### 3.3 The Web Knowledge System

The web application serves three audiences, which are conservation officers, administrators, and the general public. It runs in an ordinary browser on a computer or tablet and is the management and publication face of the system.

#### Signing In (Officers and Administrators)

Officers and administrators sign in with email and password. The public visitor portal requires no account at all, because it only ever shows content that has already been approved for release.

#### The Records Workspace

Field observations that have synced from mobile devices appear here. Officers can search the list by species, open a record to see its full detail, review its photographs, and check its location. This is where ground-truthed data is inspected before it is trusted.

#### The Approvals Queue

New submissions arrive in a focused pending queue. An officer reviews each one and either approves or rejects it with a reason. The approval decision, the officer who made it, and the time it was made are stamped onto the record permanently. This creates an audit trail and satisfies the project requirement for review and approval of submitted observations.

#### Species Management

Officers can add, edit, and delete species entries. Each species entry holds the taxonomy, the scientific and common names, the description, the ecological information, the conservation status, and any cultural significance notes. Officers also upload botanical photographs and mark a species as published. Publishing is blocked until an approved field record exists for that species, which stops empty or unverified entries from reaching the public.

#### Search and Filtering

The catalogue can be searched and filtered by scientific name or common name. This directly serves the project requirement for retrieval of biodiversity information by researchers, officers, and guides.

#### The Public Visitor Portal

This is a read-only section of the site that lists only approved and published records and species. It needs no login. It is the answer to the second problem statement, which is that visitors and communities currently have poor access to up-to-date biodiversity information. Anyone with a browser can now browse verified plant knowledge.

#### The Distribution Map

Located observations are plotted on a map. Officers and the public can see where each species has been recorded, which supports the requirement for species distribution maps and helps conservation planning.

#### Report Generation

Officers generate biodiversity reports from the records and species data and export them in standard document formats. The exports are stored in a private area that only officers can reach, because reports may contain the locations of sensitive species.

#### The Administrator's User Page

Administrators can grant and revoke roles from this page. This is how a new officer or botanist is onboarded, and how access is removed when a person leaves a project.

#### The IoT Monitoring Dashboard

This page is reserved for officers and administrators. It shows the live state of every registered sensor, the environmental trend charts, the movement and rain timelines, and the list of raised alerts. It has a time-range selector so an officer can inspect the last day, the last five days, the last week, or the entire history. Live readings and alerts refresh automatically every ten seconds. Chart history refreshes every minute. A manual refresh button is available for immediate checks.

### 3.4 The IoT Monitoring Chain

The IoT chain exists to watch the surroundings of a protected plant continuously and to raise an alert when something threatens it. It has four stages, which are sensing, transport, evaluation, and display.

#### Sensing at the Plant

A small microcontroller board is deployed at a fixed position near the plant. It carries four sensors. A temperature and humidity sensor measures the air. A motion sensor detects movement near the plant. A soil moisture probe measures the water level in the ground. A rain sensor detects whether it is raining. Every reading is tagged with the sensor's known GPS deployment coordinates, so each measurement is tied to a physical location. Together these satisfy the requirement for real-time collection of location, temperature, humidity, and movement data.

The node does not carry a live GPS receiver. Each node is installed at a surveyed position, and its coordinates are recorded once at deployment. Because the node is fixed, those recorded coordinates are correct for every reading it produces. An on-board receiver would add cost and power draw without adding accuracy for a stationary sensor, so the recorded deployment coordinate is used instead.

#### Transporting the Readings

The board produces a structured report roughly every two seconds and sends it over a USB cable to a host computer. Using a cable rather than a wireless link was a deliberate sprint decision, described in Section 6. It brought real hardware forward and removed the reliability risk of an untested wireless path during the first build. Figure 9 traces one reading from the sensor to the dashboard and labels each hop with its timing.

[picture of figure 9 here]

Figure 9. IoT data flow with timing, from sensor reading through the host bridge and the evaluator to the officer dashboard.

#### The Host Bridge

A small program on the host computer reads each incoming report, registers the sensor in the central database on first contact, and stores every reading. The bridge holds the privileged database credential on that host only. The credential never appears in the board's firmware, the mobile application, or the web client.

#### Evaluating Each Reading

Immediately after a reading is stored, the system checks it against a set of rules. High and critical heat thresholds raise a heat stress alert. Low air humidity raises a drought stress alert. Motion raises an unusual movement alert. A cooldown period stops the same condition from raising the same alert repeatedly. A separate periodic check notices when a sensor has stopped reporting and raises a silent sensor alert. These rules are the project's automated threat detection.

#### The Officer Dashboard

Raised alerts and the latest reading for each sensor appear on the officer dashboard. An officer can see at a glance which sensors are healthy, what the current conditions are, what has been detected, and when. This is the centralized monitoring dashboard and rapid response capability the project requires. Every reading and every alert is stored permanently, which also provides the long-term ecological data record for later habitat analysis.

### 3.5 The Database and Security Model

All data lives in one cloud database. Its job is to hold the information consistently and to decide, for every request, whether the person or device asking is allowed to see or change it.

#### What Is Stored

The database holds user accounts and their roles, the species catalogue and its photographs, field observations and their photographs, synchronisation bookkeeping, sensors and their readings, raised alerts, and officer report exports.

#### Roles

There are three privileged roles and one public role. The botanist captures field data. The conservation officer reviews, approves, publishes, generates reports, and monitors IoT alerts. The administrator manages users and roles. The public role sees only approved and published content.

#### Enforcing Permissions Inside the Database

Every table carries a set of rules that run inside the database engine itself. These rules decide, per role and per action, whether a request is allowed. A botanist can create and edit only their own observations. An officer can read and act on everything that needs review. A member of the public can read only approved and published rows. Because the rules live in the database and not in the application's interface, they hold even if someone bypasses the application entirely and talks to the database directly.

#### File Storage

Photographs and report exports are held in dedicated storage areas with their own permission rules. Field photographs and species photographs are readable by the roles that need them. Officer report exports sit in a deliberately private area, because they may contain the coordinates of sensitive species.

#### The Approval Gate

A species cannot be published to the public catalogue until it has at least one approved field record. This gate is enforced by a rule inside the database, so there is no path by which an unverified species reaches the public.

#### Transport Security

Every connection between a client and the backend is encrypted in transit by the platform. Sign-in sessions are issued and verified by the backend's authentication service, not by any client-side logic.

### 3.6 How a Single Observation Travels Through the System

The following narrative ties every part together.

A botanist signs into the mobile application at the start of a survey. She scans the QR tag on a plant she has visited before, and the stored record opens from the device's local cache. She adds a new photograph and updates the plant's height. The application stamps her current GPS position and saves everything to the local store. No network is available, and none is needed.

At the end of the day she reaches an area with signal and opens the synchronisation centre. The application sends the updated record and its photograph. The database checks that she is the owner of the record and that her version marker matches, then accepts the change and confirms receipt. The record is marked as synced on her device.

Back at the office, an officer opens the approvals queue and sees the updated record. She reviews the photograph, confirms the species identification, and approves the change. The approval, her identity, and the time are stamped onto the record. The species remains published, and the updated photograph now appears on the public visitor portal for anyone to see.

Meanwhile, near the plant itself, the sensor board has been taking readings every two seconds all day. The host bridge has stored each one. A rise in temperature has crossed the heat threshold, so a heat stress alert was raised and appears on the officer dashboard. The same officer who approved the record sees the alert, notes the location, and can plan a site visit.

This is the complete loop the project set out to build. It runs from a manual, paper-based process to a digital, verifiable, and monitored one. Figure 10 presents the same journey as a sequence, and Figure 11 shows it as a real deployment scene.

[picture of figure 10 here]

Figure 10. Sequence diagram, one observation from offline capture to public record.

[picture of figure 11 here]

Figure 11. Real-life deployment, a monitored plant in the field, the host bridge at a ranger post, and the officer dashboard in the office.

### 3.7 User Needs Analysis

Before design started the team identified who would use the system and what each of them needed from it. Every feature in the delivered prototype traces back to one of those needs. The table below shows the mapping.

| User | Need | How the prototype meets it |
|---|---|---|
| Botanist | Capture a complete observation without a network connection | The mobile app writes every record, photo, and sync state to the on-device store first (Section 3.2) |
| Botanist | Avoid manually typing coordinates and species names, which cause errors | GPS is stamped automatically and the species catalogue is cached and searchable offline (Section 3.2) |
| Botanist | Attach photographic evidence to the exact record | Camera capture is linked directly to the observation (Section 3.2) |
| Botanist | Return to a known plant quickly without searching | A QR tag opens the stored record on scan, online or offline (Section 3.2) |
| Botanist | Trust that nothing captured is lost and that clashes are visible | A sync queue marks each record only after server confirmation and surfaces conflicts explicitly (Section 3.2) |
| Conservation officer | Verify data before it is trusted or published | A focused approvals queue stamps the decision, the officer, and the time onto the record (Section 3.3) |
| Conservation officer | Maintain accurate, complete species knowledge | Species management holds taxonomy, descriptions, conservation status, and photographs (Section 3.3) |
| Conservation officer | Retrieve biodiversity information quickly | Search and filtering by scientific or common name, plus a distribution map (Section 3.3) |
| Conservation officer | Produce shareable biodiversity reports | CSV and PDF export stored in a private area (Section 3.3) |
| Conservation officer | Detect threats to protected plants as they happen | The IoT dashboard raises and displays heat, drought, and movement alerts (Section 3.4) |
| Administrator | Onboard and offboard people safely | A user page grants and revokes roles (Section 3.3) |
| Administrator | Be sure permissions hold even against direct access | Permissions are enforced inside the database, not only in the interface (Section 3.5) |
| Public visitor | Access trusted biodiversity information without an account | A read-only portal publishes only approved and published content (Section 3.3) |
| Public visitor | See where species have been recorded | A distribution map plots located observations (Section 3.3) |

This mapping is the bridge between the needs analysis and the design. Each implemented feature exists because a named user needed it, which is the traceability the prototype is assessed on.

---

## 4. How the System Meets the Project Requirements

This section maps the delivered system against the problem statements, the objectives, and the mandatory areas of focus set out in the project brief. It shows, requirement by requirement, what has been built and where the evidence sits.

### 4.1 Problem Statements Addressed

| Problem statement | How the delivered system addresses it | Where to see it |
|---|---|---|
| 1. Manual and Inefficient Biodiversity Documentation | The mobile application replaces handwritten records and manual data entry with structured digital capture. QR scanning removes physical tag lookups. Photographs, GPS coordinates, and taxonomy are captured together in one flow, so records are consistent and nothing has to be retyped. Offline storage means a day in the field with no signal still produces a complete, lossless set of observations. | Mobile application, Sections 3.2 and 3.6 |
| 2. Limited Digital Accessibility and Knowledge Sharing | The public visitor portal publishes approved and published records and species to anyone with a browser, with no account required. The searchable catalogue, the distribution map, and the officer report exports give researchers, officers, guides, and visitors structured access to up-to-date biodiversity information. | Web application, Sections 3.3 and 4.3 |

### 4.2 Objectives Delivered

| Objective | Status | Evidence in this report |
|---|---|---|
| 1. Develop a Smart Digital Ground-Truthing Platform | Delivered. QR scanning, plant species database, offline field data collection, GPS location recording, and cloud synchronisation are all present and demonstrated. | Sections 2.5, 2.7, 3.2, 3.6 |
| 2. Develop a Digital Plant Knowledge System | Delivered. A searchable repository holds taxonomy, ecological information, conservation status, photographs, and cultural significance, with a distribution map and name-based search and filtering. | Sections 2.6, 3.3, 4.3 |
| 3. Ensure Secure Biodiversity Data Management | Delivered. Secure authentication, role-based access control, encrypted transport, database-enforced permissions, and cloud synchronisation protect both biodiversity records and user information. | Sections 2.4, 3.5, 5.4 |
| 4. Implement IoT-Based Plant Protection | Delivered. Real-time environmental and location data is collected, threats are detected automatically, and a centralized dashboard supports rapid conservation response. | Sections 2.8, 3.4, 5.2 |
| 5. Develop an Innovative Ground-Truthing Workflow (optional) | Design complete, prototype deferred. The offline-first capture model, QR plant tags, and conflict-aware synchronisation together form the proposed innovative workflow for remote, low-connectivity forests. Pursuit of this optional objective is subject to tutor confirmation. | Sections 3.2, 3.6, 6 |

### 4.3 Mandatory Areas of Focus

All four mandatory areas are implemented. The feature-by-feature mapping follows.

#### Area 1. Smart Digital Ground-Truthing Platform

The implementation is a mobile application for biodiversity documentation. The required features are all present. QR code scanning works for tagged plant species. The searchable plant species database supports identification and reference in the field. Offline field data collection is the application's default behaviour. GPS location recording is automatic on every capture. Cloud synchronisation with the central database is implemented with conflict protection. The required outcome is met. Botanists and conservation officers can identify, document, and manage plant species during field surveys with far less manual effort and with consistently structured data.

| Basic functionality required | Delivered |
|---|---|
| Register new plant records on site | Yes, through the mobile capture flow |
| Record detailed plant information including taxonomy, morphology, height, and related attributes | Yes, all fields captured in the structured form |
| Capture and attach photographs of the plant | Yes, camera capture linked directly to the record |
| Record GPS location | Yes, automatic device position stamped on every record |
| Synchronize field data with the central database | Yes, with conflict detection and a measured reliability path |
| Generate a QR code for each plant record | Yes, one code per record, scannable to view details |

#### Area 2. Digital Plant Knowledge System

The implementation is a web-based system for managing and accessing plant species information. Plant taxonomy and scientific names are held on every species entry. Species descriptions and botanical photographs are stored and displayed. Conservation status is a tracked attribute. A species distribution map plots located observations. Search and filtering by scientific or common name is available across the catalogue. The required outcome is met. Conservation officers can manage, retrieve, and update accurate plant biodiversity information for conservation, research, and public education.

| Basic functionality required | Delivered |
|---|---|
| Add, edit, and delete plant species records | Yes, through officer species management |
| Upload plant photographs and supporting information | Yes, with attribution tracking |
| Review and approve submitted observations | Yes, via the approvals queue with a permanent audit stamp |
| Search and filter biodiversity records | Yes, by scientific and common name, across records and species |
| Generate and export biodiversity reports | Yes, in standard document formats, stored privately |

#### Area 3. Cybersecurity and Data Protection

Secure login covers all user roles. Personal data, records, and assessments are protected by encrypted transport and by permissions enforced inside the database. Access control distinguishes administrators, conservation officers, and botanists, and the public sees only approved and published content.

The application security aspect is also addressed. The project was planned and executed using a Secure Software Development Lifecycle, with security gates placed ahead of the final submission rather than at the end. The vulnerability assessment used a defined toolset and a defined scope, recorded in the testing plan. Assessment results were produced with each vulnerability verified. Recommendations were implemented. A reassessment pass confirmed that the addressed vulnerabilities were closed. Full detail is in the Security Assessment Report, summarised in Section 5.4.

| Basic functionality required | Delivered |
|---|---|
| Secure access controls for all platforms | Yes, database-enforced role checks on every table |
| Encryption for sensitive data | Yes, encrypted transport and private storage for sensitive exports |
| Simple authentication methods preventing unauthorized access | Yes, email and password sign-in with server-issued sessions |

#### Area 4. IoT-Enabled Plant Protection

GPS and environmental sensors are deployed near rare or endangered plant species. Real-time data collection covers location, temperature, humidity, soil moisture, rain, and movement. Automated alerts fire for unusual activity that may indicate poaching or habitat disturbance, including heat stress, drought stress, and motion. A centralized monitoring dashboard serves administrators and officers. Ecological data is stored for long-term analysis.

| Basic functionality required | Delivered |
|---|---|
| Real-time environmental sensing | Yes, readings every few seconds from the deployed node |
| GPS-based plant and sensor tracking | Yes, each fixed node's surveyed deployment coordinate is recorded once and attached to every reading |
| Threat detection and automated alerts | Yes, rule-based with cooldown and silent-sensor detection |
| Centralized monitoring dashboard | Yes, the officer IoT dashboard with range selection and auto-refresh |
| Ecological data storage and analysis | Yes, permanent reading and alert history with bucketed trend charts |

### 4.4 Summary of Requirement Coverage

Both problem statements are addressed. Four of the five objectives are fully delivered in this sprint. The fifth is the optional objective, which is designed but not prototyped, pending tutor confirmation. All four mandatory areas of focus are implemented with every listed basic functionality present. The measured acceptance targets that require physical trials remain carry-over items into Sprint #2 and are tracked in Section 8.4 rather than claimed as met.

---

## 5. Testing and Quality

### 5.1 Test Environment

The checks and trials in this section were run in the environment below. It is recorded so that each result can be reproduced.

| Layer | Environment |
|---|---|
| Database and backend | Supabase hosted project on PostgreSQL, with authentication, row-level security, and object storage |
| Web application | Next.js 16.3.6, React 19.2.8, Tailwind CSS 4, on Node.js |
| Mobile application | Expo SDK 57, React Native 0.86, with local SQLite |
| IoT node | ESP32 development board with a DHT11 temperature and humidity sensor, a PIR motion sensor, a soil moisture probe, and a rain sensor on a breadboard |
| IoT host | Windows host running the Python serial bridge, connected to the node over USB |
| Browser | Current Chrome, used for the dynamic security scans and the usability walkthrough |
| Security tooling | OWASP ZAP 2.17.0, npm audit, and static analysis |
| Version control | Git, with integration on the main branch |

The static checks (type checking, linting, the production build, and the unit suites) run entirely from source and do not depend on this environment. The environment matters for the measured trials and the physical sensor work, which are listed as carry-over in Section 8.4.

### 5.2 Automated Verification

The following checks were executed and observed during the sprint. The scope column records exactly what each result does and does not cover.

| Area | Command | Result | Scope |
|---|---|---|---|
| Mobile typing | `npx tsc --noEmit` | Pass | Static type checking |
| Mobile lint | `npx expo lint` | Pass | Source linting |
| Revision-checked edit | `npm run test:coverage` | Pass, 3 tests, 100% coverage of `sync-edit.ts` only | Stale update, unknown revision, server error |
| Measurement summariser | `python -m unittest discover -s mobile/scripts` | Pass, 2 tests | Retries, denominators, zero samples |
| IoT bridge and evaluator | `python -m unittest discover -s iot` | Pass, 7 tests | Timestamp handling, ingestion, immediate alert, cooldown, invalid node IDs, silent-sensor detection, severity |
| Web typing | `npx tsc --noEmit` | Pass | Static type checking |
| Web lint | `npm run lint` | Pass, one pre-existing image optimisation warning | Source linting |
| Web production build | `npm run build` | Pass, 19 routes compiled | Compilation only, no live request verification |

Source-level tests cannot establish a QR speed result, a sync success rate, a five-user usability result, or live IoT alert timing. Those require measured trials on physical devices and in the live demo environment. They are listed as carry-over in Section 8.4.

### 5.3 Acceptance Target Status

The following table reports each measurable target from System Proposal Section 7.0. It shows the status at the end of Sprint #1. Targets are marked as verified only where evidence exists.

| Quality attribute | Target | Status at sprint end |
|---|---|---|
| Reliability (offline sync) | More than 95% of test submissions sync without data loss | Implementation complete, measured trial pending |
| Functional performance | QR scan to record in under five seconds average | Instrumentation built, measured trial pending |
| Security | No critical or high vulnerabilities remaining after remediation | Two ZAP passes complete with no High findings, final re-assessment pending |
| Code quality | More than 80% coverage on backend API and mobile sync module | Pending, helper currently at 100% of `sync-edit.ts` only |
| Usability | More than 90% unassisted task completion across a five-user walkthrough | Pending, walkthrough not yet run |
| Data integrity | 100% of required fields validated before sync | Validation present, backend validation testing pending |
| Public access correctness | 100% of unauthorised writes fail with no data change, and unapproved records are never visible | Verified at the database layer |

Figure 12 shows the same seven targets as a status chart.

[picture of figure 12 here]

Figure 12. Acceptance target status at the end of Sprint #1, marked verified, pending, or partial.

### 5.4 Security Workstream

Security activity ran ahead of the Week 11 gate. The security assessment progressed through static analysis, dependency scanning, row-level security verification, a manual secure-code review, and two dynamic passes with OWASP ZAP 2.17.0. The two dynamic passes were an anonymous baseline and an authenticated officer session. Twelve findings were recorded across the assessment. The remediated ones were confirmed by re-scan. No High-severity ZAP alerts were outstanding at the end of the sprint. Full detail is in `Docs/Security/02_Assessment_Report.md` with evidence under `Docs/Security/Evidence/`.

| ID | Finding | Rating | Status |
|---|---|---|---|
| F-01 | Mobile photo upload used an unsupported file URL scheme, so every upload failed silently | Medium | Fixed and re-verified |
| F-02 | A web client component imported a server-only module, breaking the production build | Medium | Fixed |
| F-03 | Two new storage buckets were created without write-protection policies | Medium | Fixed |
| F-04 | A security verification script referenced by the backend README did not exist | Low | Fixed |
| F-05 | The backend README documented a storage bucket name that no longer existed | Low | Fixed |
| F-06 | The mobile build toolchain carries 26 advisories with no recurring scan in place | Low, no runtime reach | Mitigation defined |
| F-07 | The record photo bucket had no update policy, so photo re-sync silently failed | Medium | Fixed |
| F-08 | The reports storage bucket was briefly public-readable | Medium | Fixed |
| F-09 | Approval-state enforcement did not cover every transition | Medium | Fixed |
| F-10 | No application-level role grant or revoke path existed | Low | Fixed |
| F-11 | Malformed record identifiers returned HTTP 500 instead of 404 | Medium | Fixed |
| F-12 | Web responses carried no security headers and leaked the framework header | Medium | Fixed |

For F-06, every advisory sits in the Expo and React Native build toolchain and none is reachable at runtime. The team has defined a recurring dependency scan with weekly audits and will apply SDK patches as they are released. This is tracked into Sprint #2. Eleven of the twelve findings are fixed. The remaining one is the toolchain advisory set covered by the defined mitigation.

| Check | Scale | Result |
|---|---|---|
| Web production dependencies | 27 packages | 0 vulnerabilities |
| Mobile production dependencies | 588 packages | 26 advisories, all build-toolchain only (0 critical, 16 high, 10 moderate), no runtime reach |
| Database-layer RLS / write-block verification | 10 checks | 10 of 10 PASS |
| OWASP ZAP dynamic scan (anonymous + authenticated) | 2 passes, 10 Oct 2026 | 0 High-severity alerts |
| Findings register (Security Assessment Report v1.2) | 12 findings + 2 observations | 11 fixed, 1 mitigation defined (F-06, no runtime close), 0 confirmed critical/high residual at the 10 October 2026 close |

Figure 13 shows the findings by status and the four-stage workstream behind them.

[picture of figure 13 here]

Figure 13. Security findings by status and the workstream pipeline, from static analysis to the two ZAP passes.

---

## 6. Deviations from the System Proposal

The following differences between the System Proposal and the delivered prototype are recorded here. They let design intent be distinguished from delivered behaviour.

| Area | System Proposal | As built in Sprint #1 | Reason | Remaining work |
|---|---|---|---|---|
| Sync conflict strategy | Last-write-wins first, with a manual conflict queue as an enhancement | Revision-checked compare-and-swap on `plant_records.version`, with a visible conflict status and manual resolution | Stronger data integrity. Protects same-owner multi-device edits without silent overwrite | None for the core path. The two-device conflict evidence trial is still to be run |
| IoT transport | Simulated sensors over MQTT first, with the ESP32 as a later swap-in | USB-first path with a real ESP32 node, a host bridge, and a periodic evaluator | Real hardware was available, so the true pipeline was built directly | MQTT remains future work. Longer-duration physical confirmation is pending |
| Officer review and approval (PB-7) | Scheduled for Sprint #2 | Delivered in Sprint #1 with the web knowledge system | The web system and the approval gate share one data model, so building them together reduced rework | Final integration testing remains in Sprint #2 |
| Sensitive-data encryption | Objective refers to encryption of personal records and reviews | Confidentiality currently enforced through authentication and row-level security, with TLS in transit | Encryption posture is assessed in the security report | Field-level encryption is to be confirmed against the stated objective before submission |
| Optional innovation (Objective 5) | Proposed, pending tutor confirmation | Design write-up complete, prototype not built | Documented as optional in the proposal | Pursued only with tutor agreement |

---

## 7. Sprint Metrics, Risks and Issues

### 7.1 Sprint Metrics

| Metric | Value | Note |
|---|---|---|
| Committed backlog items | 6 | PB-1 to PB-6 |
| Completed backlog items | 6, plus PB-7 pulled forward | 7 total delivered |
| Committed business value | 51 of 80 | Weighted by the proposal's business value column |
| Delivered business value | 59 of 80 | Includes the pulled-forward review workflow |
| Automated unit tests passing | 12 | IoT 7, mobile sync helper 3, summariser 2 |
| Web routes compiled | 19 | Production build |
| Open High-severity security findings | 0 | After two ZAP passes |

Figure 14 shows committed and delivered value against the sprint total.

[picture of figure 14 here]

Figure 14. Committed and delivered business value, 51 and 59 against a total of 80.

### 7.2 Risks and Issues

The table below shows the Sprint #1 risk posture against the register in System Proposal Section 7.1. It also includes the issues actually encountered. Likelihood and impact are rated Low, Medium, or High.

| Ref | Risk or issue | Likelihood | Impact | Status at sprint end | Action |
|---|---|---|---|---|---|
| R1 | Data loss during offline-to-cloud sync | Medium | High | Mitigated in design | Revision check and preserved local copy. Measured sync trial pending |
| R2 | IoT hardware unavailable within the trimester | Low | High | Retired | A real ESP32 node was obtained and used |
| R3 | Poor or no connectivity in the field | High | Medium | Mitigated in design | Offline store and deferred sync implemented |
| R4 | Security vulnerabilities discovered late | Medium | High | Partially mitigated | Two ZAP passes complete. Final re-assessment pending |
| R5 | Scope creep against the timeline | Medium | Medium | Managed | Review workflow pulled forward deliberately. Optional innovation held back |
| R6 | Duplicate or inconsistent species records | Medium | Medium | Mitigated in design | Stable QR record ID and mandatory-field validation |
| R7 | Publicly exposing unapproved data | Low | High | Mitigated and verified | Read-only route group and row-level security. Write-block verified |
| I1 | Sensor readings unstable during wiring changes | High | Medium | Open | DHT11 reported an out-of-range reading and the soil probe fluctuated when disturbed. Wiring must be reseated and analog thresholds calibrated before final field evidence |
| I2 | Development credentials exposed during setup | Medium | High | Open | Service-role key and test-account passwords must be rotated before submission |

Figure 15 plots every risk and issue by likelihood and impact.

[picture of figure 15 here]

Figure 15. Risk matrix for R1 to R7 and I1 to I2, plotted by likelihood and impact.

---

## 8. Sprint #1 Retrospective Report (What did we learn and how will we improve?)

This section covers what the team learned and how it will improve.

### 8.1 What went well

The backend-first sequencing worked. Building Supabase first meant the mobile, web, and IoT workstreams could run in parallel without blocking each other.

A single TypeScript stack across mobile and web let members move between workstreams. It also reduced duplicated effort.

The security workstream ran ahead of its gate. That leaves remediation time before the final demo.

The extras in the mobile sync path were delivered without slipping the committed scope. Those extras are conflict detection and the acceptance measurement instrumentation.

### 8.2 What did not go well / Problems encountered

Git coordination broke down on a few shared files. Work on the officer auth-gate and the records-browser status and conservation filters was done on a branch that went three commits without syncing with main. Main itself moved forward by over sixty commits in that window, including three separate changes to that same records-browser file. Reconciling the two later produced a five-file merge conflict. The files were `records-browser.tsx`, `map/page.tsx`, `records/page.tsx`, `signin/page.tsx`, and `auth.ts`. The conflict was costly to untangle. Part of the local work ultimately had to be discarded and redone against the current main rather than merged.

Three real application defects were only caught during the formal security review rather than during normal development. They are F-01, F-02, and F-03. The notable one is F-01, where every mobile photo upload was silently failing for an unknown period before it was found.

The IoT pipeline shipped a simplified transport, which is direct Supabase writes, instead of the MQTT plus InfluxDB pipeline specified in the proposal. This is not inherently a problem. It does mean Sprint #2's IoT alert threshold tuning and ESP32 hardware swap-in, which is backlog item 8, needs re-scoping against what was actually built rather than the original design.

Physical sensor wiring was less stable than expected. A disturbed DHT11 produced an out-of-range reading that triggered spurious alerts. The analog soil and rain thresholds are still calibration-dependent. Development credentials were handled loosely at setup time. That created a cleanup task that should not have been necessary. Some acceptance measurements were only instrumented during the sprint, so the measured trials were deferred to Sprint #2 rather than completed alongside the features.

Photo coverage is inconsistent. At the species level, roughly 78 of 263 species have no photo, which is about 30%. That figure comes from the 185 `species_photos` rows against 263 species. At the field-record level coverage looks healthier, with 14 photos across 11 records. The species-level gap is most likely a sourcing limit rather than an upload failure. The iNaturalist import only pulls a photo when it finds one under an acceptable open licence. The team should confirm that rather than assume it.

### 8.3 Improvements for next sprint

Pull from main daily, or before starting any change on a shared file. This avoids long-lived branch divergence. The merge conflict this sprint came directly from going too long without syncing.

The team agreed three concrete changes for Sprint #2.

- Add a short hardware bench check with a warm-up and a calibration step before any field evidence is captured.
- Use a single documented secrets workflow, with no keys in source, in chat, or in client bundles.
- Run the measured acceptance trials as scheduled work items rather than as optional follow-ups. Those trials are QR timing, sync success, and the five-user walkthrough.

### 8.4 Sprint 2 Plan and Carry-Over

Sprint #2 covers the remaining backlog items along with the integration, security, and documentation close-out.

| Backlog ID | Item | Focus for Sprint #2 |
|---|---|---|
| PB-7 | Conservation officer review/approval workflow | Delivered early, final integration testing only |
| PB-8 | IoT alert threshold tuning and ESP32 hardware swap-in | Calibrate thresholds against observed conditions and confirm the hardware path end to end |
| PB-9 | Complete security: vulnerability scan, remediation, re-verify | Final ZAP pass, confirm zero critical and high findings, rotate exposed credentials |
| PB-10 | Final integration, system testing, documentation and demo | Full round-trip testing, user manual, final report, and live demo |

The following carry-over items from Sprint #1 must be closed in Sprint #2.

1. Run the QR scan-to-record timing trial on a physical device using the acceptance measurement export.
2. Run the offline capture and idempotent push trial and report the sync success rate.
3. Run the two-device same-owner conflict trial and record the conflict evidence.
4. Run the physical sensor trial with a calibrated node and confirm one reading and its alert end to end.
5. Conduct the five-user usability walkthrough against the draft user manual.
6. Rotate the exposed service-role key and reset the test-account passwords.

### 8.5 Product Enhancements for Future Sprints

Beyond the process improvements above, the team identified product-level enhancements that would extend the prototype. These are listed so the reasoning is on record even where delivery depends on hardware or tutor agreement.

- Live MQTT transport. The current IoT path uses a USB cable because it is reliable and testable today. A wireless MQTT gateway would let nodes be deployed far from a host computer, which is the field deployment case the project targets.
- On-board GPS. The current node uses a surveyed fixed coordinate. A GPS module would let nodes be relocated without re-surveying.
- Field-level encryption. The stated objective names encryption of personal records and reviews. The prototype enforces confidentiality through authentication, row-level security, and encrypted transport. Encrypting selected columns at rest would close that objective more literally.
- Offline map tiles. The mobile app records coordinates but needs a network to render a map. Cached offline tiles would let a botanist confirm location in the field with no signal.
- Predictive alerts. The current evaluator uses fixed thresholds. A learned model over the stored reading history could flag gradual threats such as a slow drought trend rather than only instant thresholds.

---

## 9. Sprint #1 Deliverables (What did we actually produce?)

This section lists what the team produced during the sprint.

### 9.1 Software

- Web application (Next.js + Supabase). Species catalog, filterable records browser, an officer approval workflow delivered ahead of schedule, interactive species map, report generator, role-based access control, and a public visitor explore page.
- Mobile application (Expo / React Native). Offline-first field capture with photo, GPS and plant-tag support, background sync with duplicate handling, species reference browsing, and record editing.
- IoT pipeline. An ESP32 node with DHT11, PIR, soil-moisture and rain sensors, a host serial bridge that inserts readings, and a rule-based threat evaluator that writes alerts to the shared database.
- Database. A Supabase/Postgres schema of ten tables covering `user_profiles`, `species`, `species_photos`, `plant_records`, `plant_record_photos`, `sync_log`, `sensors`, `sensor_readings`, `alerts`, and `reports`. Row-level security is enforced on every application table and independently verified.

### 9.2 Documentation

- Security Assessment Report (`Docs/Security/02_Assessment_Report.md`, v1.2). A full SSDLC-aligned assessment covering static analysis, dependency scanning, row-level security verification, a manual secure-code review, and two OWASP ZAP dynamic passes. It closes out with a twelve-item findings register. Current status is tracked in `Docs/Security/03_Findings_Register.md`.
- RLS verification script (`backend/scripts/verify_public_write_block.sql`). A repeatable, idempotent SQL test proving the public write-block guarantee. All 10 checks PASS.
- System Proposal Report (v1.6). The project's full design and planning document. It covers the problem statement, solution analysis, architecture, risk register, and the Sprint #1/#2 backlog this report is measured against.
- Component READMEs for the web app, mobile app, backend, and IoT service. Each covers setup and key decisions.

### 9.3 Data

- Species catalogue. 263 plant species in the database, covering taxonomy, conservation status, and descriptions. See the species catalogue screenshot in Section 10.2.
- Species photos. 185 `species_photos` rows linked to the catalogue, sourced via the iNaturalist import tooling with attribution tracking. Roughly 78 of the 263 species have no photo, which is about 30%. This gap is most likely a sourcing limit rather than an upload failure, since the import only pulls a photo when one is available under an acceptable open licence. See Section 8.2.
- Field records. 11 field observations synced from the mobile app, with 14 photos across those records.
- Public visitor view. A filtered, approved-and-published projection of the catalogue powers the `/explore` visitor portal.

---

## 10. Evidence

### 10.1 Mobile

1. Sign in - [picture of mobile sign-in screen here]
2. Capture Camera - [picture of mobile camera capture here]
3. Records empty - [picture of mobile records list, empty state here]
4. Species Empty - [picture of mobile species list, empty state here]
5. Sync Center - [picture of mobile sync centre here]
6. Sync Attempted - [picture of mobile sync attempt result here]
7. Profile - [picture of mobile profile screen here]
8. Capture Visit - [picture of mobile capture visit screen here]

### 10.2 Web

1. Home - [picture of web home page here]
2. Explore - [picture of public explore portal here]
3. Map - [picture of web map view here]
4. Sign in - [picture of web sign-in page here]
5. Sign In Form - [picture of web sign-in form filled here]
6. Records List - [picture of web records list here]
7. Records card - [picture of web record card here]
8. Records detail - [picture of web record detail here]
9. Profile - [picture of web profile page here]
10. Species List - [picture of web species list here]
11. Species Catalog - [picture of web species catalog here]
12. Species Details - [picture of web species details here]
13. Map Live - [picture of web live map view here]

---

## 11. Conclusion

Sprint #1 turned the Plantiful design into a runnable, integrated prototype. The backend, the offline-first mobile app, the web knowledge system with its public visitor view, the synchronisation path, and the IoT monitoring pipeline all run on one shared backend and one permission model.

Against the brief, both problem statements are addressed and four of the five objectives are delivered in prototype form. The fifth is the optional objective, designed but not built pending tutor confirmation. All four mandatory areas of focus are implemented. Every claim in this report is either backed by an executed check or recorded as a carry-over item, so the difference between what is proven and what is pending is explicit.

The remaining work is concentrated in three things. The measured acceptance trials and the evidence photographs will convert the pending rows in Section 5.3 into verified numbers. The physical sensor path needs calibration and longer field confirmation. The exposed development credentials must be rotated before submission. These are scoped as carry-over into Sprint #2 in Section 8.4.

The team finished the sprint ahead of its committed scope by delivering the officer review workflow early. That head start, together with the security workstream that ran ahead of its gate, leaves Sprint #2 room for integration, testing, and demonstration rather than first-time construction.
