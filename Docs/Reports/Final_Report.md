# Plantiful Final Report

**Project title:** Plantiful, Biodiversity Record Management and Field Monitoring System  
**Team:** Group 7  
**Unit:** COS30049 Computing Technology Innovation Project  
**Client and industry partners:** Sarawak Forestry Corporation and NeuonAI  
**Report status:** Master draft for Word export and final verification  
**Submission date:** **[ACTION REQUIRED: Basill, insert official submission date]**

> **Before submission:** This is the single master report. Do not merge the Sprint 1 and Sprint 2 PDFs into the final submission. Export this file to Word, insert the official cover sheet, generate the table of contents and list of figures, insert the signed contribution form, then export the final PDF.

---

## 1. Cover Page

**[ACTION REQUIRED: Basill, replace this section with the official unit cover sheet in Word]**

The official cover sheet must include the unit code, unit name, project title, team name, tutor name, submission date, student names and student IDs. Confirm the exact wording against the current unit template before export.

**Project title:** Plantiful, Biodiversity Record Management and Field Monitoring System  
**Team:** Group 7  
**Client:** Sarawak Forestry Corporation  
**Industry partner:** NeuonAI  
**Tutor:** **[ACTION REQUIRED: insert tutor name]**  
**Submission date:** **[ACTION REQUIRED: insert date]**

---

## 2. Table of Contents

**[ACTION REQUIRED: Basill, generate the automatic table of contents in Word after the final headings are fixed]**

**List of Figures**

**[ACTION REQUIRED: Basill, generate the automatic list of figures in Word]**

**List of Tables**

**[ACTION REQUIRED: Basill, generate the automatic list of tables in Word]**

---

## 3. Acknowledgement

The team thanks Sarawak Forestry Corporation for describing the field recording problem and the operational context that shaped the project. The team also thanks NeuonAI for guidance on the ground-truthing workflow and data standards. Thanks go to the unit tutor and coordinators for feedback on scope, sprint reviews, documentation and security expectations.

The team recognises the participants who reviewed the interface and the people who supported device and network testing. Their feedback helped turn a broad concept into a system with clearer workflows, better error states and more honest evidence boundaries.

**[ACTION REQUIRED: Basill, add any named individuals or organisations only after permission has been confirmed]**

---

## 4. Abstract

Plantiful is a prototype biodiversity record management and field monitoring system for conservation work. The project addresses a practical problem. Field observations, approval decisions, species knowledge and environmental readings are often separated across paper forms, spreadsheets, messaging applications and isolated devices. This separation slows review, weakens traceability and makes it difficult to publish trusted public information.

The system combines an offline-first React Native mobile application, a Next.js web application, a Supabase backend, a public visitor portal and a lightweight IoT monitoring path. The mobile application supports camera capture, GPS coordinates, QR identifiers and local records that can synchronise when connectivity returns. The web application supports species knowledge, officer review, reporting, maps, administration and a public read-only view. Supabase provides authentication, PostgreSQL storage, row-level security and file storage. The IoT path carries sensor readings for temperature, humidity, soil moisture, rain and motion into a monitoring view. An AI Field Assist feature provides a reviewed drafting aid rather than an automated identification authority.

The project followed an iterative two-sprint delivery approach with explicit security, integration and documentation gates. The prototype passed lint, type checking, unit and component tests, production build checks and a range of database policy checks. The recorded test position includes 56 web tests, 30 mobile tests and 36 IoT tests. The security assessment raised 12 findings, fixed 11 and recorded a mitigation for the remaining one. The system is not a finished production service. The final live migration, final ZAP re-scan, credential rotation, physical device confirmation and independent usability study remain release actions. The report states those boundaries explicitly so that the delivered prototype can be judged on verified evidence rather than intention.

---

## 5. Project Proposal

### 5.1 Background and Context

Biodiversity recording in a field setting depends on accurate observation, reliable identification and timely review. A botanist may record a plant with a photograph, a location and a description, but the record has to reach a conservation officer before it can be approved and used. The officer may need to compare the record with existing species knowledge, check the location and decide whether the evidence is sufficient. A visitor may later need a trusted public view of approved information. Environmental sensors may also need to show conditions that affect the same area.

When those steps are handled through paper forms, spreadsheets and separate messaging threads, the data chain becomes fragile. Records can be delayed, duplicated or lost. Approval reasons may not be captured. Public information may be published from an unverified source. Sensor readings may show a change but not connect to the record or decision process. The project therefore treated integration as the central problem, not just digitisation.

### 5.2 Problem Statement

The client needs a field-ready system that reduces manual transcription and delay while preserving evidence, traceability and access control. The system must support users with different responsibilities, including field contributors, conservation officers, administrators and anonymous visitors. It must continue to work when connectivity is weak. It must protect observation data and publish only information that has been approved for public view.

### 5.3 Project Objectives

| Objective | Target outcome | Final position |
|---|---|---|
| O1. Build an offline-first mobile field capture application | Capture photo, GPS, QR identifier and observation details, then synchronise when connected | Prototype delivered. Device and network testing remain partly outstanding |
| O2. Build a web knowledge and review system | Manage species, review observations, search records, view maps and reports | Prototype delivered, including officer review and public visitor view |
| O3. Create a shared secure backend | Supabase authentication, PostgreSQL schema, role-based access and file storage | Implemented and policy-checked. Final live migration state needs confirmation |
| O4. Add IoT environmental monitoring | Sensor ingestion, monitoring view and alert support | Prototype delivered with simulated and physical sensor path. Calibration remains outstanding |
| O5. Integrate the full system and verify quality | End-to-end workflow, tests, security assessment and documentation | Integrated prototype delivered. Final release checks remain open |

### 5.4 Scope and Boundaries

The project delivered a working prototype for the core field recording, review, public information and monitoring workflows. The scope included the mobile application, web application, database, authentication, storage, public visitor view, officer review, administration, IoT bridge and security evidence.

The project did not deliver a production service with a signed mobile release, full compliance certification, active penetration testing, a completed independent usability study or a fully calibrated field sensor deployment. Those boundaries are recorded in the testing and conclusion sections. The system should not be described as fully penetration tested, certified compliant or free of risk.

### 5.5 Stakeholders

| Stakeholder | Interest in the project | Relevant requirement |
|---|---|---|
| Sarawak Forestry Corporation | Faster and more accurate biodiversity records | Field capture, review, reporting and public information |
| NeuonAI | Validation and potential commercialisation | Reliable data standards and a coherent system workflow |
| Botanists and field contributors | Low-friction capture in the field | Offline support, camera, GPS, QR and clear sync states |
| Conservation officers | Review quality and traceability | Approval workflow, evidence visibility, rejection reasons |
| Administrators | Controlled access and data management | Role management, staff allowlist, species and record administration |
| Public visitors | Trusted information | Read-only access to approved and published records |
| Academic sponsor and tutor | Alignment with unit outcomes | Evidence, security, testing, documentation and reflection |

### 5.6 Solution Overview

Plantiful uses a hybrid three-tier architecture. The client tier contains the React Native mobile application and the Next.js web application. The application tier contains the Supabase-backed backend services and a lightweight IoT ingestion path. The data tier contains PostgreSQL, file storage, the on-device SQLite store and the MQTT transport for sensor data.

The design was chosen because it matches the team size and the time available. A full microservice split would add deployment and service-to-service security work that a student team could not complete well in 13 weeks. A single request-response monolith would not fit continuous sensor telemetry. The hybrid approach keeps the main application coherent while allowing the IoT path to remain event-driven.

### 5.7 Innovation Claim

The innovation is not the individual use of a camera, a QR code, a map or a sensor. The innovation is the integration of those elements into one evidence-aware workflow. A field record can be captured offline, synchronised, reviewed by an officer, linked to species knowledge and then published to a visitor view. A sensor reading can be monitored alongside that record. The system also includes an AI drafting aid with human review and a staff allowlist that prevents unapproved staff role assignment. The claim is therefore about workflow integration and evidence discipline, not about technical novelty in isolation.

### 5.8 Constraints and Assumptions

The project had a 13-week schedule, a student team and limited access to production infrastructure. The mobile application was developed through Expo and tested mainly with available Android devices. The IoT work used available sensors and required calibration. Network conditions in the field could not be fully reproduced. Some security checks depended on a live Supabase project and were recorded at a point in time.

The project assumed that email and password authentication was acceptable for the prototype, that a managed Supabase service was appropriate for the scale of the trial, and that public visibility could be controlled through approval and publication flags. Those assumptions are documented because they affect the security and data protection position.

---

## 6. Project Management Plan

### 6.1 Team Structure and Responsibilities

The repository reports record five named active contributors. The official contribution form must be checked because the unit form may list six members. **[TEAM CONFIRM: reconcile the sixth member and the member numbers before submission]**

| Team member | Student ID | Primary responsibilities |
|---|---:|---|
| Basill Agas Anak Heatley Rogers | 102778888 | Team lead, mobile application, field data capture, integration, security evidence and repository coordination |
| Nathan Sebastian Learmonth | 102775816 | Web knowledge system, records workflow, documentation and review support |
| Gae Jayden MWINE | 102783566 | IoT sensor pipeline, alert logic, monitoring dashboard and physical build |
| Muhammad Maqeel bin Muhammad Kahfi | 102777652 | Backend APIs, database schema, synchronisation and row-level security support |
| Badrul Aliff Aiman bin Badrulmunirzaki | 102782630 | Web reporting, maps, security assessment, ZAP procedure and public access checks |
| Sixth member | **[TEAM CONFIRM]** | **[TEAM CONFIRM: add only if the official form requires a sixth member]** |

### 6.2 Development Approach

The project used an iterative and incremental approach organised into two sprints. Sprint 1 focused on the shared backend, mobile field capture, web knowledge system, public visitor view, synchronisation and foundational IoT pipeline. Sprint 2 focused on officer review, IoT refinement, integration, security assessment, usability refinement and final documentation.

The team used Scrum ideas for backlog planning, sprint review and retrospective, but retained explicit gates for security, client feedback and release evidence. This hybrid approach was more suitable than a strict waterfall or a strict Scrum process. Waterfall would have frozen requirements before the field workflow was understood. Strict Scrum would have understated the evidence and sign-off work required by the unit.

### 6.3 Schedule and Milestones

| Phase | Weeks | Main output |
|---|---|---|
| Proposal and requirements | 1 to 4 | Proposal, scope and client context |
| System design | 5 to 6 | Architecture, data model and wireframes |
| Sprint 1 | 6 to 9 | Mobile capture, web knowledge system, shared backend, public view, IoT foundation |
| Sprint 2 | 10 to 12 | Officer review, IoT refinement, integration, security and usability work |
| Final release and demonstration | 13 | Final report, user manual, evidence pack and demo |

Key checkpoints were the proposal deadline, the security gate and the final demonstration. The security gate carried the highest schedule risk because late findings would leave little time for remediation and retesting.

### 6.4 Tools and Collaboration

| Purpose | Tool |
|---|---|
| Source control and review | Git and GitHub |
| Task tracking | GitHub Projects |
| Team communication | WhatsApp and scheduled team meetings |
| Document collaboration | Google Drive and repository Markdown |
| Web development | Next.js, React, TypeScript and Tailwind CSS |
| Mobile development | React Native, Expo, TypeScript and SQLite |
| Backend and data | Supabase, PostgreSQL, row-level security and storage |
| IoT | ESP32, DHT11, soil moisture sensor, rain sensor, PIR sensor, MQTT and Mosquitto |
| Security testing | OWASP ZAP, dependency audits, static checks and manual ASVS and MASVS review |
| Diagram and report work | Draw.io and Markdown to Word or PDF |

### 6.5 Risk Management

| Risk | Impact | Mitigation | Final position |
|---|---|---|---|
| Scope creep across mobile, web and IoT | Delayed integration | Two-sprint scope and backlog re-prioritisation | Managed, but some targets remain unmeasured |
| Weak field connectivity | Data loss and user frustration | Offline SQLite store and explicit sync states | Implemented. Field network testing remains limited |
| Integration drift between clients | Inconsistent behaviour | Shared TypeScript types and API contracts | Reduced. Some live schema checks remain open |
| Exposed development credential | Unauthorised privileged access | Server-only key use and secret review | Exposure identified. Rotation remains a release action |
| Late security findings | Insufficient remediation time | Security workstream and assessment before final week | 11 of 12 findings fixed, one mitigation recorded |
| Device and sensor availability | Incomplete physical testing | Simulated path plus available hardware | Partial. Calibration and longer field trials outstanding |
| Evidence gaps | Weaker assessment position | Evidence index and explicit limitations | Improved, but some artefacts still need collection |
| Team availability | Uneven progress | Task ownership and review | Managed through sprint planning and PR review |

### 6.6 Quality Assurance

Quality was checked through code review, strict TypeScript, ESLint, unit and component tests, API tests, database policy checks, production builds, dependency audits, manual device checks and security review. The team treated a task as complete only when the behaviour and its evidence were both available. In practice this standard was not always met, especially near the end of the project. The final report therefore distinguishes implemented work, tested work and deployed work.

### 6.7 Communication and Decision Log

The team used WhatsApp for day-to-day coordination and scheduled meetings for planning and review. Formal minutes were not consistently retained. The final evidence pack should therefore include a reconstructed decision log with dates, decisions, owners and supporting screenshots. Any reconstructed log must be labelled as reconstructed. **[ACTION REQUIRED: Basill, insert WhatsApp screenshots or export in Appendix G and redact phone numbers]**

### 6.8 Change Control and Configuration Management

Changes were managed through feature branches, pull requests and review before merge. Database changes were kept as ordered SQL migrations. Environment files were kept out of source control, with example files used for setup. The backend directory is currently ignored by `.gitignore` line 71, which means local migration and seed files do not appear in `git status`. This must be explained in the evidence pack and corrected if the official submission requires those files to be tracked.

### 6.9 Contribution and Evidence Tracking

Contribution evidence comes from git history, pull requests, issue ownership, sprint reports and the project board. Those sources do not prove equal effort. The contribution form should therefore combine them with team confirmation. Every inferred entry must be marked `[TEAM CONFIRM]` until the member agrees.

---

## 7. Development

### 7.1 Architecture Overview

Plantiful uses a three-tier hybrid architecture.

| Tier | Components | Responsibility |
|---|---|---|
| Client | React Native mobile app and Next.js web app | Field capture, review, administration, reporting and public browsing |
| Application | Supabase-backed backend and IoT ingestion bridge | Authentication, data access, business rules, sync handling and sensor ingestion |
| Data | PostgreSQL, file storage, SQLite and MQTT | Central records, photos, offline buffer and sensor transport |

The mobile and web clients share a backend but not a codebase. They share TypeScript conventions, role concepts and data expectations. Supabase provides the central identity and data boundary. The IoT bridge is a separate privileged path because sensor data arrives continuously and does not fit a user-request model.

**[INSERT FIGURE: system architecture diagram from `Docs/Assets/System_Architecture.png` or the Sprint 2 report]**

### 7.2 Technology Stack

| Layer | Technology | Reason |
|---|---|---|
| Mobile | React Native and Expo | One TypeScript codebase for Android field use and rapid iteration |
| Mobile storage | SQLite | Local records and queue support for offline work |
| Web | Next.js App Router and React | Server components, route handlers, protected routes and public pages |
| Styling | Tailwind CSS | Consistent utility-based interface work |
| Backend | Supabase | Managed PostgreSQL, authentication, storage and row-level security |
| Database | PostgreSQL | Relational model for species, observations, approvals and sensor data |
| IoT transport | MQTT and Mosquitto | Lightweight event-driven telemetry |
| IoT device | ESP32 and sensors | Field-readable temperature, humidity, soil, rain and motion data |
| AI support | Groq API through a server route | Drafting support with server-side key handling |
| Testing | Vitest, Testing Library, Jest and live gated checks | Unit, component, API and integration coverage |
| Security | OWASP ZAP, npm audit, ESLint, TypeScript and SQL policy checks | Static, dependency and runtime verification |

### 7.3 Data Model and Roles

The core entities are users, species, observations, photos, approvals, staff allowlist entries, sensor readings and alerts. Observations carry taxonomy details, location, status, reviewer identity, review time and publication state. Photos attach to observations and are stored in Supabase storage. The staff allowlist controls who may hold a managed role. Sensor readings are linked to devices and alert rules.

| Role | Main permissions |
|---|---|
| Anonymous visitor | Read approved and published species and observations only |
| Botanist | Create and manage own observations, upload photos and synchronise records |
| Conservation officer | Review, approve, reject and annotate observations |
| Admin | Manage species, users, allowlist, records and system settings |

The database uses row-level security as the main access boundary. The client does not decide authorisation by hiding buttons. The policy checks the authenticated identity and the requested row.

### 7.4 Mobile Application

The mobile application supports field capture through the camera, GPS and QR scanning. A botanist can create an observation, attach a photo, record a location and save the record locally. The app keeps a local SQLite store and a sync queue. Records move through states such as saved locally, pending sync, synced, conflict and failed. The user interface exposes those states instead of pretending that every save reaches the server.

The QR path uses a stable record identifier so that a physical tag can resolve to a digital record. GPS access includes a recovery route when permission is denied. The camera interface includes a torch control and a scanner guide. The app also supports theme preference and role-aware navigation.

The mobile app was tested with available Android devices and Expo. A signed Android release and distribution archive were not completed. The report must not imply that the app is available as a production store release.

**[INSERT IMAGE: mobile capture screen]**  
**[INSERT IMAGE: offline sync state or conflict state]**  
**[INSERT IMAGE: QR scan or GPS permission recovery]**

### 7.5 Web Application

The web application is built with Next.js App Router. It provides authenticated dashboards, species management, observation review, reporting, maps, user administration, staff allowlist management and a public visitor view. Server-side checks protect admin routes. Supabase SSR cookies carry the authenticated session.

The public visitor view exposes only approved and published records. The officer workflow supports review, approval, rejection and rejection reasons. Reporting and map views summarise records by status and location. The admin area includes a staff allowlist so that managed staff roles are assigned only to approved email addresses.

The latest local production build completed and included the `/admin/staff` route. Earlier recorded builds generated fewer static pages. The final report should use the latest verified build output and record the exact route count at export time.

**[INSERT IMAGE: public visitor species view]**  
**[INSERT IMAGE: officer review screen]**  
**[INSERT IMAGE: admin staff allowlist screen]**  
**[INSERT IMAGE: report or map view]**

### 7.6 Backend and Database

Supabase provides authentication, PostgreSQL, storage and row-level security. The schema covers users, species, observations, photos, approvals, staff allowlist, sensor readings and alerts. Storage policies restrict photo writes by role and ownership. The reports bucket is private. Public or signed URLs are used for photos according to the publishing rule.

Database changes are stored as ordered migrations from `001` to `015`. The `apply_project.sql` bundle covers migrations `002` to `011`. The staff allowlist migration adds a table, normalises email addresses to lower case, limits access to admins and updates the signup trigger so that only allowlisted emails receive a managed staff role. A non-allowlisted signup falls back to the botanist role. The migration is written but still needs to be applied to the live Supabase project and verified with real accounts.

**[ACTION REQUIRED: Basill, apply `backend/supabase/migrations/015_staff_allowlist.sql` to the live project and record the result]**

### 7.7 Staff Allowlist and Account Control

The original account flow allowed self-registration. That is risky for a conservation system because a public signup could request a managed role. The staff allowlist adds an administrative gate. An admin can add an email address, set a role and remove an entry. The signup trigger checks the allowlist and assigns the approved staff role when a match exists. A non-allowlisted signup falls back to the botanist role and cannot receive an officer or admin role. Existing accounts can be synchronised through a trigger when their allowlist role changes.

The allowlist interface is available at `/admin/staff` and is linked from the admin account menu, the admin settings page and the users page. Server actions handle save, role change and removal. The UI reports success and error states and refreshes the route after a change.

The implementation is complete in the repository. Live verification is pending because the migration has not been applied to the target database. The report should not claim that live signup is blocked until that check is recorded.

### 7.8 Synchronisation and Offline Behaviour

The synchronisation path is a core part of the field workflow. The mobile app stores records locally, queues uploads and retries when connectivity returns. The sync process distinguishes success from conflict and failure. A conflict is not silently overwritten. The user is shown a state that explains what happened.

The system uses a stable record identifier so that a local record can be reconciled with the central record. Photos are uploaded to storage and linked to the observation. The sync design was tested at the logic and component level. A full field trial with real network loss and multiple devices remains outstanding.

**[INSERT IMAGE: sync status breakdown]**  
**[INSERT TABLE: sync scenarios and results if available]**

### 7.9 IoT Monitoring

The IoT path uses an ESP32 with a DHT11 temperature and humidity sensor, a soil moisture sensor, a rain sensor and a PIR motion sensor. Readings are published through MQTT and ingested by a bridge that writes into Supabase. The web application displays the readings and supports alert states.

The physical build was assembled and photographed. The sensor path can run in simulation and with the available hardware. Soil moisture calibration remains incomplete and the recorded value should not be treated as a validated field measurement until it is calibrated. The bridge uses a privileged server-side key, so host access and request validation are part of the security boundary.

**[INSERT IMAGE: physical IoT assembly from `Docs/Testing/Evidence/sprint2-iot/01-actual-assembly.jpeg`]**  
**[INSERT IMAGE: IoT dashboard or sensor history]**  
**[INSERT IMAGE: alert state]**

### 7.10 AI Field Assist

AI Field Assist provides drafting support through a server route. The API key is held on the server, not in the client. The feature includes access checks, evidence context and quota handling. It is designed as an aid that a user reviews, not as an automated species authority.

Live verification is incomplete. The web environment is missing `GROQ_API_KEY`, the mobile environment still contains a stale Field Assist URL, and the service has not been confirmed end to end on a physical device. The report should describe the feature as implemented in code and partially verified, not as a fully validated field capability.

### 7.11 Security Implementation

Security work covered authentication, authorisation, storage, headers, secrets, dependency management and release evidence. Supabase Auth handles email and password sign-in. Web sessions use cookies through `@supabase/ssr`. Mobile sessions use AsyncStorage with auto-refresh. Role lookup comes from the user profile, not from client-supplied identity.

Row-level security is the main data boundary. The service role is used only on trusted server or host components. Public views are limited to approved and published records. Malformed identifiers return 404. Security headers are configured. Password reset now uses a callback route that handles both code exchange and token hash verification, validates internal redirect paths and then allows the user to set a new password.

The security assessment raised 12 findings. Eleven were fixed and one has a defined mitigation. Historical ZAP passive scans found no High alert after remediation. Live RLS checks recorded 19 passes and 6 data-dependent skips. Web and mobile dependency audits were clean on 6 November 2026. A 16 November mobile audit found one moderate transitive advisory through Expo CLI. These results are point-in-time checks, not a permanent guarantee.

The exposed service-role credential remains unresolved until it is revoked, dependent environments are updated and the old credential is shown to fail. The report must not include the secret value.

### 7.12 UI, Accessibility and Usability

The interface was refined around field use. Key changes included bottom clearance for the Android gesture area, a stable torch control, clearer sign-in spacing, a GPS permission recovery route and a sync status breakdown. The web design uses a forest-green and warm-white visual language with photographic cards and translucent panels. Officer review cards place the observation photo beside the record details on wider screens and above them on phones.

Accessibility considerations include labels, focus states, target sizes, contrast and not relying on colour alone. The project did not complete a full WCAG audit. The final report should describe the checks that were performed and avoid claiming full compliance.

An independent usability study with five representative participants was planned but not completed. The report should record the protocol, the planned tasks and the missing results rather than presenting invented completion rates.

**[INSERT IMAGE: before and after device screens with captions]**  
**[INSERT TABLE: usability tasks and results if completed]**

### 7.13 Deployment and Configuration

The web application uses environment variables for the Supabase URL, publishable key and server-only secrets. The mobile application uses Expo public variables for the Supabase URL and publishable key. The IoT bridge uses a server-side service role. Example environment files should be provided without live values.

The repository README now documents the migration order from `012` to `015`, the seed accounts, the verification loop and the common issue caused by a missing `015` migration. The final submission should include a short setup appendix that matches the actual repository state.

### 7.14 Challenges and Resolutions

| Challenge | Resolution | Remaining boundary |
|---|---|---|
| Offline records could appear saved when they were only local | Added explicit sync states and conflict handling | Full field network trial outstanding |
| Public routes could expose unapproved data | Added publication and approval rules with RLS | Final live policy recheck outstanding |
| Managed roles could be self-assigned at signup | Added staff allowlist and trigger enforcement | Live migration not yet applied |
| Password recovery did not support both Supabase callback styles | Added code and token hash handling in the callback route | Production email delivery check outstanding |
| Service-role key exposure | Restricted key use to server and trusted host code | Rotation and revocation record still required |
| Device layout conflicts with Android gesture area | Added bottom clearance and stable control positions | Final supported-device matrix still required |
| AI feature could be mistaken for identification authority | Framed as a drafting aid with review and fallback | Live service verification outstanding |
| Evidence was scattered across tools | Added evidence index and explicit limitations | Some screenshots and logs still need collection |

---

## 8. System Testing

### 8.1 Test Strategy

Testing combined static checks, unit tests, component tests, API tests, live gated checks, database policy checks, production builds, dependency audits, manual device checks and security review. The purpose was not to maximise a test count. The purpose was to protect the workflows that could cause data loss, unauthorised access or misleading public information.

The project distinguishes four evidence levels.

| Level | Meaning | Example |
|---|---|---|
| Implemented | Code exists and is reviewable | Staff allowlist route and server actions |
| Locally verified | Check ran in the repository environment | Lint, type check, unit tests, build |
| Live verified | Check ran against the hosted service | RLS policy checks, ZAP scan |
| Field verified | Check ran with real users or devices in context | Device trial, usability study, sensor calibration |

A claim must name the level it has reached. A local build does not prove the hosted deployment. A historical live check does not prove the final migration state. A simulated sensor reading does not prove a calibrated field measurement.

### 8.2 Test Environments and Evidence Boundaries

| Environment | Scope | Limitation |
|---|---|---|
| Local web | Type check, lint, unit, component and API tests, production build | Does not prove hosted runtime or live database state |
| Local mobile | Type check, lint, helper and regression tests, Expo Doctor | Does not prove a signed release or all physical devices |
| Local IoT | Unit tests and simulated sensor path | Does not prove calibrated field accuracy |
| Live Supabase | RLS, storage policy and anonymous mutation checks | Point-in-time result, not repeated after every migration |
| Hosted web | ZAP passive scan and header checks | Passive scan, not active penetration testing |
| Physical device | Manual Android checks and screenshots | Limited device matrix and no full field trial |

### 8.3 Automated and Build Results

| Check | Recorded result | Evidence boundary |
|---|---|---|
| Web type check | Passed | Repository state at the recorded commit |
| Web lint | Passed with no reported errors or warnings | Repository state, not hosted runtime |
| Web tests | 56 tests collected. 46 passed and 10 gated live checks skipped in the default offline run | Live checks require environment access |
| Mobile tests | 30 passed | Helper and regression scope |
| IoT tests | 36 passed | Unit and simulated scope |
| Web production build | Passed. Latest local build included `/admin/staff` | Build success is not deployment proof |
| Expo Doctor | 19 of 20 checks passed, with version mismatches recorded | Does not prove release readiness |
| Web dependency audit | 0 advisories on 6 November 2026 | Point-in-time result |
| Mobile dependency audit | 1 moderate transitive advisory on 16 November 2026 | Transitive through Expo CLI, no High or Critical entry |

**[INSERT LINK: CI or test log if available]**  
**[INSERT IMAGE: build output or test summary]**

### 8.4 Database and Security Testing

| Check | Recorded result | Limitation |
|---|---|---|
| Live RLS and storage policy check | 19 PASS and 6 data-dependent SKIP. Both script verdicts returned PASS | Tested the schema at that time, not the final migration state |
| Anonymous mutation probes | Five checks passed with zero residue | Does not cover every role and every storage path |
| Historical ZAP passive scan | No High alert after remediation | Passive only. Final re-scan not run |
| Security headers | Expected headers observed on the tested build | Does not prove the final deployment |
| Source and bundle review | No tracked environment file and no client-side service-role variable | Not a native binary inspection |
| Secure code review | 12 findings, 11 fixed, 1 mitigation recorded | Residual risk remains for the mitigated item |
| Password reset callback | Code and token hash paths handled, internal redirect validated | Live email delivery and token expiry need confirmation |

The security position is partly verified and partly outstanding. It is accurate to describe the core access controls as implemented and the historical application findings as remediated. It is not accurate to describe the system as fully penetration tested or certified compliant.

### 8.5 Mobile and IoT Testing

Mobile testing covered capture flow, local save, sync state handling, QR scanning, GPS permission recovery, navigation and role-aware screens. It did not cover a signed release, a wide device matrix or a long-duration field trial. The Android gesture-area issue was recorded and adjusted.

IoT testing covered sensor reads, MQTT publication, bridge ingestion, dashboard display and alert states. The physical assembly was photographed. Soil moisture calibration remains incomplete, and the bridge was not tested under a hostile host environment.

### 8.6 Usability and Acceptance Testing

The planned usability protocol used five participants and role-relevant tasks. The tasks covered finding a species, saving an offline observation, finding a saved record and explaining its status, reviewing a submission, and finding a published species without signing in. The protocol used Nielsen's heuristics and relevant WCAG 2.2 checks as references.

The sessions were not completed, so the final report must not claim a 90 percent task completion rate or any other participant result. The table below is a framework for the evidence that still needs to be collected.

| Participant | Role and assigned tasks | Unassisted / assigned | Assisted | Failed | Time and observation | Refinement and retest |
|---|---|---|---|---|---|---|
| P1 to P5 | **[ACTION REQUIRED: insert after sessions]** | **[ACTION REQUIRED]** | **[ACTION REQUIRED]** | **[ACTION REQUIRED]** | **[ACTION REQUIRED]** | **[ACTION REQUIRED]** |

**[INSERT LINK: usability session video or notes if completed]**

### 8.7 Requirements Traceability

| Requirement | Implementation | Test evidence | Final status |
|---|---|---|---|
| Offline field capture | Mobile SQLite store, camera, GPS and QR | Mobile tests and manual device checks | Partially verified |
| Shared secure backend | Supabase auth, PostgreSQL, RLS and storage | RLS checks and code review | Implemented, final live state pending |
| Officer review workflow | Web review actions and status fields | Web tests and manual review | Implemented |
| Public visitor view | Approved and published read-only routes | RLS checks and route review | Implemented, final policy recheck pending |
| IoT monitoring | ESP32, MQTT bridge and dashboard | IoT tests and physical assembly | Partially verified, calibration pending |
| Admin account control | Staff allowlist and signup trigger | SQL trigger harness and code review | Implemented, live migration pending |
| Password reset | Forgot password, callback and reset page | Manual flow review | Implemented, live delivery pending |
| Security assessment | ZAP, audits, static checks and review | Security evidence pack | Partially verified, final retest pending |

### 8.8 Known Defects and Carry-Over Items

| Item | Impact | Required action |
|---|---|---|
| Staff allowlist migration not applied live | Live signup may not assign allowlist roles | Apply `015_staff_allowlist.sql` and verify with test accounts |
| Public visibility migration unconfirmed | Public routes may not match the intended policy | Confirm `014_public_record_visibility.sql` in the target database |
| Exposed service-role secret | Privileged access risk | Revoke, update environments and record the result without values |
| AI Field Assist live check incomplete | Feature may fail in deployment | Add `GROQ_API_KEY`, fix the mobile URL and verify end to end |
| Soil moisture calibration incomplete | Readings may mislead users | Calibrate and document the method |
| Independent usability study missing | No participant-based usability result | Run sessions or report the gap honestly |
| Final ZAP re-scan missing | Current deployment not re-tested | Run the recorded procedure against the final build |
| Signed Android release missing | No production install package | Decide whether to build or record a deferral |
| Some evidence is reconstructed | Weaker traceability | Label reconstructed evidence and retain source links |

### 8.9 Evidence Index

| Evidence | Location | What it supports |
|---|---|---|
| Officer conflict banner | `Docs/Testing/Evidence/issue-39/01_officer_conflict_banner.png` | Officer review conflict state |
| IoT assembly photograph | `Docs/Testing/Evidence/sprint2-iot/01-actual-assembly.jpeg` | Physical build |
| ZAP reports | `Docs/Testing/Evidence/` | Historical passive scan |
| Security evidence | `Docs/Testing/Security/evidence/` | RLS, headers, audits and checks |
| Sprint 1 report | `Docs/Reports/Sprint1/Sprint_Report_1.md` | Sprint 1 plan, review and retrospective |
| Sprint 2 report | `Docs/Reports/Sprint2/Sprint_Report_2.md` | Sprint 2 plan, results and limitations |
| Sprint 2 management plan | `Docs/Reports/Sprint2/Sprint_2_Management_Plan.md` | Sprint 2 planning evidence |
| System proposal | `Docs/Reports/System_Proposal_Report.md` | Original scope and architecture rationale |
| Contribution form | `Docs/Reports/Final/Team_Contribution_Form.md` | Team contribution draft |
| Submission checklist | `Docs/Reports/SUBMISSION_TODO.md` | Missing evidence and release actions |

**[ACTION REQUIRED: Basill, add the final GitHub repository link, Google Drive evidence link, GitHub Projects link and video link to this table]**

---

## 9. User Manual

### 9.1 Prerequisites

The complete system requires Node.js, npm, Expo tooling, a Supabase project and Python for the IoT bridge. The web and mobile applications need the Supabase URL and publishable key. The IoT bridge and AI Field Assist need server-only secrets. Test accounts should be used for demonstration. No live secret should appear in the report, the repository or the shared Drive.

### 9.2 Repository Setup

Clone the repository and install dependencies in each application directory.

```powershell
git clone <repository-url>
cd COS30049_InnovationProject_Plantiful
cd web
npm install
cd ..\mobile
npm install
```

**[ACTION REQUIRED: Basill, replace `<repository-url>` with the final GitHub link]**

### 9.3 Environment Configuration

Create local environment files from the provided examples. Use test values only in the submission evidence.

```text
web/.env.local
NEXT_PUBLIC_SUPABASE_URL=<supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<server-only-key>
GROQ_API_KEY=<server-only-key>
```

```text
mobile/.env
EXPO_PUBLIC_SUPABASE_URL=<supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<publishable-key>
EXPO_PUBLIC_FIELD_ASSIST_URL=<lan-url>
```

The mobile Field Assist URL must point to the running web server on the local network. A stale URL will cause the mobile AI request to fail even when the web feature works.

### 9.4 Database Setup

Apply migrations in the repository order. `apply_project.sql` covers migrations `002` to `011`. Then run the seed file for test accounts, staff allowlist entries and sample species.

```powershell
psql "<connection-string>" -f backend/supabase/migrations/001_schema.sql
psql "<connection-string>" -f backend/supabase/migrations/apply_project.sql
psql "<connection-string>" -f backend/supabase/migrations/012_monitoring_history.sql
psql "<connection-string>" -f backend/supabase/migrations/013_field_assist.sql
psql "<connection-string>" -f backend/supabase/migrations/014_public_record_visibility.sql
psql "<connection-string>" -f backend/supabase/migrations/015_staff_allowlist.sql
psql "<connection-string>" -f backend/supabase/seed.sql
```

The `013_field_assist.sql` migration is optional for the AI feature but required if Field Assist is demonstrated. The final migration state must match the live project before the report claims that the staff allowlist, public visibility or AI feature is live verified.

### 9.5 Run the Web Application

```powershell
cd web
npm run dev
```

Open the local URL shown by Next.js. Sign in with an admin, officer or botanist test account. The public visitor view can be opened without signing in and should show only approved and published records.

### 9.6 Run the Mobile Application

```powershell
cd mobile
npx expo start
```

Open the project in Expo Go or an available development build. Confirm that the Supabase URL and publishable key are present. Test capture while offline, then reconnect and check the sync state. Test GPS permission denial and recovery. Test QR scanning with a supported tag or test code.

### 9.7 Run the IoT Bridge

```powershell
cd iot
python supabase_rest.py
```

Confirm the MQTT broker, topic and Supabase connection settings before running the bridge. The bridge uses a privileged key and should be run only on a trusted host. Check that readings appear in the monitoring view and that alert states behave as expected.

### 9.8 Roles and Test Accounts

The seed file creates test accounts for demonstration. The staff allowlist seed includes `testofficer@sfc.com` and `testadmin@sfc.com`. The exact seeded roles and passwords must be checked against `backend/supabase/seed.sql`. Do not place real account passwords in the final report.

| Role | Main workflow |
|---|---|
| Visitor | Browse approved and published species and observations |
| Botanist | Capture, save and synchronise observations |
| Conservation officer | Review, approve or reject observations |
| Admin | Manage species, users, allowlist and records |

### 9.9 Core Workflows

**Field capture.** Sign in as a botanist. Start a new observation. Capture a photo, record the location and scan or enter the QR identifier. Save the record. If offline, confirm that the record appears in the local queue. Reconnect and confirm the sync state changes correctly.

**Officer review.** Sign in as an officer. Open the review queue. Inspect the photo and record details. Approve or reject with a reason. Confirm that the resulting state is visible to the botanist and that the public visibility rule behaves as expected.

**Public visitor view.** Sign out or open the public route. Confirm that approved and published records are visible and that unapproved records are not. Check that the detail view shows the intended fields and photo.

**Species knowledge.** Sign in as an admin or officer with permission. Create or update a species record. Check that the record appears in search and in the observation form.

**Reporting and maps.** Open the reporting and map views. Check that status counts and locations match the underlying records. Record any filters or limitations.

**Staff allowlist.** Sign in as an admin. Open `/admin/staff`. Add an email address and role. Sign in with that email and confirm the approved role. Change the role and confirm the effect. Remove the entry and confirm that the account no longer holds the managed role.

**Password reset.** Open the sign-in page. Use the forgot-password link. Complete the email step in the test environment. Open the callback link and set a new password. Confirm that the old session is cleared and that the new password works.

### 9.10 Troubleshooting

| Symptom | Likely cause | Action |
|---|---|---|
| Signup succeeds but the user is a botanist instead of staff | Staff allowlist migration missing, email not allowlisted or role not updated | Apply `015`, check the normalised email entry and confirm the role |
| Admin page redirects or denies access | Session missing or role not loaded | Sign out and in again. Check the profile role |
| Public page shows unapproved data | Public visibility policy mismatch | Recheck `014` and the query filter |
| Mobile capture saves but never syncs | Network, URL or auth issue | Check the sync state, Supabase URL and session |
| AI Field Assist fails | Missing key or stale mobile URL | Check `GROQ_API_KEY` and `EXPO_PUBLIC_FIELD_ASSIST_URL` |
| IoT readings do not appear | Broker, topic, bridge key or host issue | Check the bridge log and MQTT settings |
| Soil moisture reads 0 percent | Calibration issue | Calibrate the sensor and record the method |
| Build fails with memory pressure | Local resource limits | Close other processes and retry. Do not leave temporary CPU limits in the committed config |

### 9.11 Security Notes for Demonstration

Use test accounts and test data only. Do not show live secrets, service-role keys or real personal data. Redact phone numbers in WhatsApp evidence. Do not publish exact coordinates for sensitive species without a conservation policy decision. Do not describe public storage as private. Confirm that any published photo is intended to be public.

---

## 10. Conclusion

Plantiful delivered an integrated prototype for biodiversity field recording, review, public information and environmental monitoring. The system connects an offline-first mobile application, a Next.js web application, a Supabase backend and an IoT path. It includes role-based access, a public visitor view, officer review, staff account control, password reset and an AI drafting aid. The project also produced a substantial evidence base covering architecture, testing, security and sprint management.

The strongest outcome is the integration. The team did not only build separate screens. It built a shared data and permission model that lets a field record move through capture, review and publication while environmental readings remain visible alongside it. The staff allowlist and password reset work also close practical account-control gaps that were not in the original feature list.

The project has real limitations. The final live database migration has not been applied. The public visibility policy needs a final confirmation. The exposed service-role credential must be rotated. The AI feature has not been verified end to end in the deployed environment. The soil moisture sensor is not fully calibrated. The independent usability study was not completed. The final ZAP re-scan and signed Android release are outstanding. These are not minor footnotes. They define the difference between a working prototype and a release-ready service.

The project also showed the value of honest evidence. A local build is not a deployed system. A historical scan is not a final scan. A reconstructed chart is not a live project board. A test count is not a usability result. The team's reports became stronger when they stated those boundaries instead of hiding them.

Future work should focus on release evidence rather than new features. The next steps are to apply and verify the final migrations, rotate the exposed credential, run the final security scan, complete the device and sensor trials, run the usability sessions and produce a signed release package. If those steps are completed, the prototype would be a credible foundation for a pilot with the client.

---

## 11. References

Expo (2025) *Expo Documentation*. Available at: https://docs.expo.dev/ (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

Groq (2025) *Groq API Documentation*. Available at: https://console.groq.com/docs (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

MQTT.org (2025) *MQTT: The Standard for IoT Messaging*. Available at: https://mqtt.org/ (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

Next.js (2025) *Next.js Documentation*. Available at: https://nextjs.org/docs (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

Nielsen, J. (1994) *10 Usability Heuristics for User Interface Design*. Available at: https://www.nngroup.com/articles/ten-usability-heuristics/ (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

OWASP Foundation (2021) *OWASP Top 10:2021*. Available at: https://owasp.org/Top10/ (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

OWASP Foundation (2021) *OWASP Application Security Verification Standard 4.0.3*. Available at: https://owasp.org/www-project-application-security-verification-standard/ (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

OWASP Foundation (2025) *OWASP ZAP*. Available at: https://www.zap.org/ (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

Plantiful Group 7 (2026) *Sprint 1 Report*. Available in the project repository at `Docs/Reports/Sprint1/Sprint_Report_1.md`.

Plantiful Group 7 (2026) *Sprint 2 Management Plan*. Available in the project repository at `Docs/Reports/Sprint2/Sprint_2_Management_Plan.md`.

Plantiful Group 7 (2026) *Sprint 2 Report*. Available in the project repository at `Docs/Reports/Sprint2/Sprint_Report_2.md`.

Plantiful Group 7 (2026) *System Proposal Report*. Available in the project repository at `Docs/Reports/System_Proposal_Report.md`.

Pressman, R. S. and Maxim, B. R. (2020) *Software Engineering: A Practitioner's Approach*. 9th edn. New York: McGraw-Hill.

React Native (2025) *React Native Documentation*. Available at: https://reactnative.dev/docs/getting-started (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

Schwaber, K. and Sutherland, J. (2020) *The Scrum Guide*. Available at: https://scrumguides.org/scrum-guide.html (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

Sommerville, I. (2016) *Software Engineering*. 10th edn. Harlow: Pearson.

SQLite (2025) *Appropriate Uses For SQLite*. Available at: https://www.sqlite.org/whentouse.html (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

Supabase (2025) *Row Level Security*. Available at: https://supabase.com/docs/guides/database/postgres/row-level-security (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

W3C (2023) *Web Content Accessibility Guidelines 2.2*. Available at: https://www.w3.org/TR/WCAG22/ (Accessed: **[ACTION REQUIRED: Basill, insert access date]**).

---

## 12. Appendices

### Appendix A. Requirement Traceability Matrix

| ID | Requirement | Source | Implementation | Verification | Status |
|---|---|---|---|---|---|
| R1 | Field capture with photo, GPS and QR | Proposal | Mobile capture flow | Mobile tests and manual device checks | Partially verified |
| R2 | Offline save and later sync | Proposal | SQLite store and sync queue | Mobile tests | Partially verified |
| R3 | Officer review and approval | Proposal | Web review workflow | Web tests and manual review | Implemented |
| R4 | Public visitor view | Proposal | Read-only published routes | RLS checks and route review | Implemented, final policy recheck pending |
| R5 | Species knowledge management | Proposal | Web species CRUD and search | Web tests | Implemented |
| R6 | Reporting and maps | Proposal | Web reports and map views | Manual review | Implemented |
| R7 | IoT ingestion and monitoring | Proposal | ESP32, MQTT bridge and dashboard | IoT tests and physical assembly | Partially verified |
| R8 | Role-based access | Proposal | Supabase auth and RLS | Policy checks | Implemented, final live state pending |
| R9 | Staff account control | Change request | Staff allowlist and signup trigger | SQL harness and code review | Implemented, live migration pending |
| R10 | Password reset | Change request | Forgot password, callback and reset page | Manual flow review | Implemented, live delivery pending |
| R11 | AI drafting support | Change request | Server route and client feature | Code review | Partially verified |
| R12 | Security assessment | Unit requirement | ZAP, audits, static checks and review | Security evidence pack | Partially verified |

### Appendix B. Risk Register

**[ACTION REQUIRED: Basill, insert the final risk register from `Sprint_2_Management_Plan.md` or link it here]**

The final register should include risk ID, description, likelihood, impact, response, owner and status. At minimum it should retain the credential exposure, migration drift, field network, sensor calibration, usability evidence and final security retest risks.

### Appendix C. Test Evidence Index

**[ACTION REQUIRED: Basill, insert the final test evidence table or link to `Docs/Testing/Security/evidence/` and the relevant build logs]**

The evidence pack should distinguish local, live and field checks. It should include the exact command, date, commit, environment and result for each claim. Do not include secrets or real personal data.

### Appendix D. Security Findings and Recommendations

**[ACTION REQUIRED: Basill, insert the final findings register from the security assessment]**

The appendix should cover F-01 to F-12 and R-01 to R-10, including fixed, mitigated, open and deferred items. It should retain the requirement that the exposed service-role credential is revoked and the old credential is shown to fail. It should also record that the final live RLS check and ZAP re-scan are outstanding.

### Appendix E. Team Contribution Form

The separate contribution draft is at `Docs/Reports/Final/Team_Contribution_Form.md`. The official signed form must be inserted here or attached as required by the unit. **[ACTION REQUIRED: Basill, insert the official signed contribution form and reconcile the sixth member]**

### Appendix F. Project Management Evidence

**[INSERT IMAGE: GitHub Projects board]**  
**[INSERT LINK: GitHub Projects board]**  
**[INSERT IMAGE: burn up chart from GitHub Projects Insights]**  
**[INSERT IMAGE: reconstructed burndown chart, labelled as reconstructed]**  
**[INSERT IMAGE: sprint backlog or completed tasks]**

The GitHub Projects board may provide a burn up chart rather than a classic burndown. If a burndown is required, reconstruct it from task completion dates and label it clearly. Do not present a hand-drawn or generated chart as a native project board export.

### Appendix G. Team Communication and Decision Log

**[INSERT IMAGE: WhatsApp screenshots with phone numbers redacted]**  
**[INSERT LINK: exported chat or decision log]**  
**[INSERT TABLE: reconstructed decision log with date, decision, owner and evidence]**

The communication evidence should support specific decisions such as the choice of Supabase, the staff allowlist, the security remediation sequence and the final scope trade-offs. It should not be used to imply work that is not otherwise evidenced.

### Appendix H. Figure and Screenshot Register

| Figure | Subject | Source | Status |
|---|---|---|---|
| Figure 1 | System architecture | `Docs/Assets/System_Architecture.png` | **[VERIFY BEFORE EXPORT]** |
| Figure 2 | Data model | `Docs/Assets/ER_diagram.jpg` | **[VERIFY BEFORE EXPORT]** |
| Figure 3 | Mobile capture | **[ACTION REQUIRED]** | Missing |
| Figure 4 | Offline sync state | **[ACTION REQUIRED]** | Missing |
| Figure 5 | Officer review | **[ACTION REQUIRED]** | Missing |
| Figure 6 | Public visitor view | **[ACTION REQUIRED]** | Missing |
| Figure 7 | Admin staff allowlist | **[ACTION REQUIRED]** | Missing |
| Figure 8 | IoT assembly | `Docs/Testing/Evidence/sprint2-iot/01-actual-assembly.jpeg` | Available |
| Figure 9 | IoT dashboard | **[ACTION REQUIRED]** | Missing |
| Figure 10 | Security or test evidence | `Docs/Testing/Security/evidence/` | Partial |

### Appendix I. AI Tool Use Statement

**[OPTIONAL: add only if the unit requires a statement]**

If required, state which AI tools were used, for what purpose and how outputs were verified. Do not claim that AI-generated text or code was independently validated unless that verification is recorded. The final report should not include secrets, personal data or unpublished client information in any AI prompt.

### Appendix J. Submission Checklist

The master checklist is at `Docs/Reports/SUBMISSION_TODO.md`. It covers missing evidence, links, signatures, migration checks, credential rotation, screenshots, PDF export and final verification. **[ACTION REQUIRED: Basill, complete the checklist before export]**
