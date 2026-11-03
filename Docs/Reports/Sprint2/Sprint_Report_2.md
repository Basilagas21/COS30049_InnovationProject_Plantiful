# Plantiful Sprint 2 Report

## Smart Ground-Truthing and Digital Biodiversity System

| Document field | Value |
|---|---|
| Unit | COS30049 Computing Technology Innovation Project |
| Team | Group 7, Plantiful |
| Project context | Plant species documentation and biodiversity knowledge for Niah National Park, Sarawak |
| Reporting period | Sprint 2, Weeks 10 to 12 |
| Submission target | 6 November 2026 |
| Evidence cut-off | Repository and GitHub review on 2 November 2026 |
| Repository baseline | `main` at `874e992` |
| Status | Evidence-backed working draft. Not a final readiness declaration |
| Prepared from | Sprint 2 planning documents, verification records, dated issue comments and pull requests |

This report follows the [Sprint 2 management plan](Sprint_2_Management_Plan.md) and the [product marking rubric](../../Marking_Rubric.md). It distinguishes work present on the reviewed baseline from work awaiting integration. Device results were recorded by the team. Preparing this report did not rerun those trials.

`[TBD]` identifies missing evidence or a decision that needs confirmation. Figure placeholders identify required exports. Neither is a completed result. Before submission, replace them with observed outcomes or an explicit limitation. Include accessible supporting files rather than relying on local-only paths.

## Executive summary

Sprint 2 focuses on completing, integrating and evaluating the Plantiful prototype. This follows Sue Han's direction to prioritise enhancements, system integration, testing, bug fixing and refinement once the basic requirements are implemented. The intended outcome is a stable prototype that can be demonstrated and explained using traceable evidence.

The strongest progress since Sprint 1 is the move from source-level checks to recorded device and live-database trials. An iPhone trial documents offline captures, persistence across an application restart, subsequent synchronisation, duplicate checks and officer approval returning to the phone. A Pixel trial documents capture, location, photo delivery, restart persistence and QR opening on Expo SDK 58. A separate conflict trial uses one physical phone and a scripted second client to demonstrate stale-edit rejection, preservation of the local copy and explicit merge resolution. These results support the tested workflows. They do not establish population-level reliability or a complete two-phone user experience.

Security and review behaviour also improved. Dated verification records describe removal of legacy policies permitting botanist self-approval, extension of the species publication gate to inserts, and an 18-of-18 public write-block result. Officer observation management was clarified as review rather than editing the botanist's field data. Rejections now carry a reason, and correction takes place through botanist editing and resubmission. The latest dependency record reports zero mobile audit findings and zero web production findings at the tested revision.

Four further changes are implemented on review branches but are not part of the reviewed `main` baseline. PRs #62 to #65 cover alert resolution, sensor-payload validation, severity escalation and interruption recovery. Their branch test reports are useful development evidence, but final integration and physical-node checks remain necessary. Closed issue status is not treated as proof of merged or deployed implementation.

Final readiness is not yet demonstrated. Outstanding work includes measured QR and sync acceptance trials, five-user usability evaluation, hardware calibration and assembly evidence, credential-rotation confirmation, final security reassessment, broader coverage reporting and sign-off. The report therefore presents verified progress and a bounded completion plan rather than claiming that every requirement has been met.

## 1. Sprint objectives and delivery control

### 1.1 Tutor direction and response

Sue Han advised that Sprint 2 should focus on final implementation, enhancements, integration, testing, bug fixing and overall refinement. She also requested that the team arrange the Sprint 2 sign-off meeting. The team translates that direction into four delivery objectives.

1. Verify the complete mobile, database and web workflow under normal and interrupted conditions.
2. Correct defects affecting data integrity, permissions and monitoring decisions.
3. Evaluate usability and performance using recorded tasks and measurements.
4. Deliver an explainable prototype with accurate diagrams, supporting evidence and an actual sign-off record.

New visual features are secondary to these objectives. A feature contributes to Sprint 2 when its user benefit, implementation status and verification are clear.

### 1.2 Starting baseline and change attribution

The [27 October baseline audit](Sprint_2_Management_Plan.md#2-baseline-and-provenance) identified gaps between the implemented prototype and its acceptance commitments. These included loose IoT input validation, bridge termination on service errors, unresolved calibration, incomplete coverage and outstanding device measurements. It also provided the starting dependency observations for remediation.

The baseline audit date is an engineering comparison point, not automatically the Sprint 1 submission cut-off. The exact submitted Sprint 1 PDF is retained at [Sprint 1 submission](../Sprint1/sprint1.pdf). Features already present there must not be claimed as newly built in Sprint 2 merely because their evidence was collected later.

| Product backlog | Sprint 2 interpretation |
|---|---|
| PB-7, review and approval | Verify the existing workflow and add the documented rejection-reason correction loop |
| PB-8, IoT refinement | Confirm the existing USB hardware path, calibrate sensors and validate alert/recovery behaviour |
| PB-9, security | Reassess the final release, fix permissions and dependencies, confirm credential remediation and close recommendations |
| PB-10, final integration | Complete acceptance trials, usability evaluation, documentation, handover and demonstration |

[TBD] Confirm the Sprint 1 submission cut-off and the reporting dates with the team lead. Attribute work by demonstrated behaviour and dated evidence, not commit counts alone.

### 1.3 Work-package status at the evidence cut-off

The following status is an evidence classification. It does not derive a completion percentage from GitHub issue counts. Coordination roles are taken from the planning workspace and require confirmation of final individual contributions.

| ID | Work package | Coordination | Issue or PR | Evidence position |
|---|---|---|---|---|
| S2-01 | Dependencies and SDK 58 | Web and mobile owners | #43 | Verification recorded at `9a4d99b`. Mobile audit zero, web production audit zero. Hosted deployment not verified |
| S2-02 | Credentials and accounts | Authorised Supabase owner | #41 | Rotation and password-reset confirmation outstanding |
| S2-03 | Publication and role policies | Backend and web owners | #44 | Live verification recorded on 29 and 31 October, with a subsequent issue-comment recheck |
| S2-04 | IoT payload validation | IoT owner and PR author | #45, PR #63 | Branch implementation and regression results available. PR open |
| S2-05 | IoT interruption recovery | IoT owner and PR author | #46, PR #65 | Branch implementation and simulated interruption results available. PR open |
| S2-06 | Alert escalation | IoT and officer-workflow owners | #47, PR #64 | Severity-aware policy proposed and branch-tested. PR open |
| S2-07 | Interval and calibration | Hardware holder | #48 | Physical measurements outstanding |
| S2-08 | Wiring and assembly | Hardware holder | #49, #58 | D35 confirmed and D-02 draft available. Electrical and assembly confirmation incomplete |
| S2-09 | Alert resolution | Web and backend owners | #31, PR #62 | Branch implementation available. Integration and database state need release confirmation |
| S2-10 | Observation-management scope | Web and mobile owners | #16 | Agreed scope and rejection-reason implementation documented. Database restrictions verified in dated records |
| S2-11 | Species mutation feedback | Web owner | #50 | Live happy-path, missing-row, concurrent-delete and denied-role results recorded |
| S2-12 | Location recovery | Mobile owner | #51 | Four Android permission/service scenarios recorded, including defect correction |
| S2-13 | Alert-flow diagram | IoT and documentation owners | #52 | Update required to match the eventual integrated policy |
| S2-14 | Security close-out | Security and component owners | #53 | Final reassessment and recommendation dispositions outstanding |
| S2-15 | Acceptance and usability | Testing coordinator and team | #39, #40 | Conflict evidence recorded. QR, reliability and participant measurements outstanding |
| S2-16 | Whole-scope coverage | Component owners | #54 | Helper coverage recorded. Wider denominator and coverage gaps unresolved |
| S2-17 | Diagrams and evidence | Documentation owner | #55 | Existing captures and D-02 draft available. Final packaging incomplete |
| S2-18 | Report, sign-off and rehearsal | Team lead and whole team | #56 | This report is drafted. Meeting outcome and rehearsal results outstanding |
| S2-19 | Issue reconciliation | Team lead and issue owners | #57, PR #60 | Scope comments exist. Documentation PR remains open and some original issue wording is stale |

### 1.4 Schedule and release sequence

| Period | Recorded activity or remaining gate |
|---|---|
| 27 to 28 October | Baseline review, work-package planning and D-02 draft |
| 29 to 31 October | Publication/review and species-feedback fixes. Offline iPhone trial and database verification |
| 1 to 2 November | Pixel permission, conflict and dependency regression records. IoT and alert-resolution PRs opened |
| Next integration gate | Review PRs #60 and #62 to #65, apply required database changes and record the combined release revision |
| Next evidence gate | Physical IoT trials, measured acceptance, usability, security reassessment and coverage analysis |
| 5 November internal target | Reviewed report, accessible evidence package and completed rehearsal |
| 6 November submission target | Inspect uploaded files and retain submission receipt |

[TBD] Confirm the meeting booking, participant availability and exact submission time. Proposed dates are not evidence that an activity occurred.

## 2. User needs and requirement coverage

### 2.1 Users and data ownership

Botanists need to capture observations when connectivity is unavailable. Officers need to review those observations, maintain shared species knowledge and inspect monitoring alerts. Administrators manage roles. Visitors need access to information authorised for publication.

A species is a catalogue entity, while an observation is a field record linked to it. One species can have observations from several botanists at different locations. Officer catalogue management must therefore remain distinct from ownership of field observations. Under the recorded scope decision, officers approve or reject observations rather than rewriting or deleting the botanist's content. The botanist performs corrections and resubmits for review.

### 2.2 Traceability matrix

Evidence identifiers are defined in Appendix A. A successful example establishes the stated scenario, not all possible inputs or environments.

| User need or requirement | Implementation or proposed change | Verification | Current conclusion |
|---|---|---|---|
| Capture without connectivity | SQLite-backed observations and local photo files | EV-01, INT-01 | Three deliberately offline records were retained and later uploaded in the recorded trial |
| Preserve data through restart | Persisted local records, photo references and sync state | EV-01, EV-03 | Persistence observed. Fully offline Expo Go cold launch not established |
| Deliver records without unintended duplicates | Stable record identity and repeat-sync handling | EV-01, EV-03 | Repeat sync produced no duplicate in the recorded fixtures. Interrupted photo-upload coverage still needs explicit evidence |
| Avoid silent competing-edit overwrite | Version compare-and-swap, conflict state and per-field merge | EV-02, INT-03 | Two conflict cycles recorded using a phone and scripted second client |
| Retrieve a record from a QR tag | Camera decoder and record lookup | EV-03, PERF-01 | Live QR opening recorded. Offline timing target not established by that result |
| Review without changing field ownership | Reject with reason, botanist correction and resubmission | EV-04 | Browser and policy results recorded. Retain a final phone rejection-to-resubmission trace |
| Manage species accurately | Officer species actions with affected-row checks | EV-05, WEB-01 | Happy path and failure feedback verified in recorded live checks |
| Provide public information safely | Read policies and separate observation/species visibility rules | EV-04, SEC-01 | Tested role and lifecycle cases passed. Final combined-release retest required |
| Search, map and export biodiversity information | Existing web catalogue, map and reports | WEB-01, EV-03 | Page rendering is recorded. Final search/map and actual CSV/PDF download checks must be attached |
| Capture location with usable recovery | Manual Capture GPS action and Open settings recovery | EV-06 | Four Android scenarios recorded. Automatic GPS stamping is not claimed |
| Monitor and respond to threats | Existing monitoring plus PRs #62 to #65 | EV-08, IOT-01 to IOT-03 | Branch evidence available. Integrated physical verification outstanding |
| Protect accounts and sensitive information | Auth, RLS, storage policies, transport controls and secret handling | EV-04, EV-07, SEC-01 to SEC-03 | Selected controls verified. Credential remediation and final reassessment remain open |
| Support efficient field and officer tasks | Navigation, status feedback and recovery refinements | UX-01 | Developer/device observations exist. Independent user task results outstanding |

## 3. Implementation changes and justification

### 3.1 Baseline, decision, outcome and limitation

| Area | Observed problem | Change and rationale | Verification and boundary |
|---|---|---|---|
| Publication gate | Published inserts were not covered by the update-only gate | Include inserts and updates so the entry path cannot bypass the approved-observation prerequisite | Live lifecycle probes reported in #44. Preserve exact deployed SQL and output |
| Botanist permissions | Legacy permissive policies combined with hardened policies and allowed self-approval | Remove legacy policies rather than relying on UI restrictions | Direct backend denial checks and 18/18 script result recorded |
| Review correction | Review needed a clear explanation and resubmission path | Require a rejection reason and clear it on resubmission. Botanists retain responsibility for field content | Browser and database results recorded. Sprint 1 already described approve/reject, so the new claim is the reason and enforcement improvement |
| Species mutations | A zero-row mutation could appear successful | Request the affected identity and return Species not found when nothing changed | Four live cases recorded in #50. Automated web regressions remain a gap |
| GPS failure recovery | Some forms showed a dead-end error after denied permission | Offer Open settings and retain entered fields across recovery | Device trial found two missing call sites, fixed in `7c10326` and retested |
| Conflict visibility | Officers lacked context when the botanist had an unresolved edit | Add owner-scoped conflict reports and an officer-visible banner | Two conflict cycles and banner access checks recorded in EV-02 |
| Dependencies | Vulnerable transitive mobile tooling remained after the SDK upgrade | Use compatible SDK 58 updates and patched dependency overrides instead of a forced downgrade | Recorded audits and six regression steps at `9a4d99b`. Overrides require continued maintenance |
| Appearance and layout | Device review identified gesture-bar clearance and inconsistent spacing | Adjust insets, controls and typography. Provide Light, Dark and System appearance | Implementation and device-review history exist. Participant benefit and final contrast checks are not yet measured |

### 3.2 Changes awaiting integration

The following are descriptions of open PR implementations, not claims about the reviewed main branch.

| PR | Proposed implementation | Why this approach | Limitation to verify |
|---|---|---|---|
| #63 | Reject malformed, non-finite and out-of-range bridge readings before insertion | Rejecting a bad line preserves evidence of sensor failure instead of silently clamping it into a believable measurement | Bridge-only validation. Simulator/direct-write paths and database constraints are not hardened by this PR |
| #64 | Allow higher severity to escalate through cooldown while suppressing equal/lower severity | Balances alert fatigue against the risk of hiding a worsening condition | Six-hour cooldown needs operational justification. Physical and live-table verification remain outstanding |
| #65 | Buffer readings in memory, retry uploads with backoff and reconnect USB | A bounded buffer avoids immediate process termination and limits memory growth | Not durable storage. Buffer overflow, bridge shutdown and uncaptured USB-gap readings can cause loss |
| #62 | Allow officers/admins to resolve alerts, with database-stamped resolver and time | Officers need a recorded response action rather than a read-only alert list | Final resolution cannot be reopened in the proposed design. Confirm workflow acceptance and deployed migration |

PR #65 reports a default capacity of 1,800 readings, approximately one hour at a two-second interval. This is a capacity calculation, not a measured one-hour endurance result. Its recovery policy does not justify claiming zero loss under every interruption. A timeout after a server commit but before acknowledgement also needs an explicit duplicate/retry test before claiming exactly-once IoT storage.

### 3.3 Decision register

| Decision | Evidence or status | Trade-off |
|---|---|---|
| Officer review rather than observation edit/delete | Scope agreement recorded in #16 on 29 October | Protects authorship but requires a clear rejection/correction workflow |
| Compare-and-swap rather than last-write-wins | Existing Sprint 1 design, with expanded Sprint 2 evidence and visibility | Prevents silent overwrites but requires user resolution of conflicts |
| USB bridge rather than MQTT deployment | Existing delivered transport | Reduces prototype integration dependencies but requires a trusted host and cable |
| Severity escalation and final alert resolution | Open PR policies as at 2 November | Reduce suppressed critical alerts and ambiguous resolution, but need owner confirmation and integrated tests |
| No application-level field encryption | Rationale recorded in the security assessment | RLS and platform controls are distinct from field encryption. Acceptance against the original objective still needs explicit confirmation |
| Curved navigation and glass/image-backed cards | User-supplied design references, not an implemented scope commitment | Potential visual coherence must be weighed against readability, rendering cost and navigation stability |

### 3.4 Visual change evidence

Screenshots will make the Sprint 2 improvements easier to inspect. They must show the actual application, not mockups or design references. Each capture uses the same viewport, account role and data state for the before and after views.

The IMG-S2 series is planned. Insert a capture only after the change is implemented and verified on the recorded build. Label every image with its test ID, build or commit, date and role. Redact personal data and sensitive locations.

| Image ID | Change shown | Required capture | Caption must state |
|---|---|---|---|
| IMG-S2-01 | Web homepage glass and image-backed cards | Discover, Connect and Conserve sections at one viewport. Include the previous layout for comparison | Image source and licence. Cards shown are implemented content. Do not claim a usability gain without participant evidence |
| IMG-S2-02 | Officer approval photograph review | Queue with thumbnails, a larger inspection view and one record with no photo | Record IDs are redacted. The missing-photo state is deliberate. The photo is the botanist submission, not a catalogue substitute |
| IMG-S2-03 | Mobile curved bottom navigation | All five tabs at rest, with each selected state in light and dark appearance | Tab labels remain visible. Touch targets and gesture-area clearance were checked. Decoration does not replace the accessible name |
| IMG-S2-04 | QR scanner guide animation | Two or three still frames showing the guide and scan line at different positions, or a short muted clip | The animation shows readiness only. It does not prove a successful decode |
| IMG-S2-05 | Photo-led species list | Before and after cards for the same species. Include one species with no photograph | The long description moved to the detail screen. The fallback is deliberate |
| IMG-S2-06 | Unknown QR resolution states | Found locally, found online, offline unavailable, not accessible, unsupported tag and deliberate new-tag confirmation | Each panel names the input state and observed message. A failed lookup does not automatically start a new record |
| IMG-S2-07 | Light and dark appearance | Web and mobile screens at the same task and viewport | Contrast was checked by the stated method. Fixed camera and QR surfaces are excluded from theme inversion |
| IMG-S2-08 | Offline sync and conflict feedback | Pending, synced, failed and conflict states. Include the officer conflict banner | Test ID, revisions and whether the second client was scripted. The banner is visible to the intended role |
| IMG-S2-09 | IoT reading to dashboard trail | Annotated assembly, serial output, stored reading and dashboard alert with correlated values | Physical and synthetic labelled separately. Calibration and wiring limitations stated |
| IMG-S2-10 | Layout and spacing refinements | Before and after mobile screens at the same viewport, including the gesture-bar area | The observed defect, the change and the retest result. Device and build identified |

Do not place an unlabelled image between two paragraphs and leave the reader to infer its meaning. Introduce it in the text, keep the caption factual and link it to the change or test it supports.

## 4. Architecture and integration

### 4.1 Deployment and trust boundaries

The mobile app stores observations in SQLite and photographs in local files. It communicates with Supabase as the authenticated user. The Next.js application includes browser and server responsibilities, with role checks in server actions and database policies. Supabase provides Auth, PostgreSQL/PostgREST and object storage. The physical node sends serial readings to a trusted host bridge. The bridge uses a privileged service credential for ingestion.

Cloud API and storage connections use HTTPS. The ESP32-to-host connection is USB serial, not HTTPS. Development-server connections must be described separately from production transport. The service credential bypasses normal RLS, so user-role tests do not establish that bridge operations are constrained by those same policies.

The following editable figure is a documentation draft for owner review. It describes the baseline deployment, not a newly tested installation.

```mermaid
flowchart LR
    subgraph Phone[Botanist phone]
        App[Expo application]
        Local[SQLite and local photo files]
        App <--> Local
    end
    Browser[Officer, administrator or visitor browser]
    Web[Next.js application and server actions]
    subgraph Cloud[Supabase cloud services]
        Auth[Auth]
        DB[PostgREST and PostgreSQL]
        Storage[Object storage]
    end
    Node[ESP32 and sensors]
    Host[Trusted bridge host]
    Browser <-->|Web requests| Web
    App <-->|HTTPS authenticated requests| Auth
    App <-->|HTTPS under user identity| DB
    App <-->|HTTPS uploads and downloads| Storage
    Web <-->|HTTPS session validation| Auth
    Web <-->|HTTPS under request identity| DB
    Web <-->|HTTPS file access| Storage
    Node -->|USB serial DATA lines| Host
    Host -->|HTTPS with privileged service credential| DB
```

Figure D-01. Deployment responsibilities and trust boundary. The local store supports disconnection. The host bridge is the privileged component. Browser-side Supabase calls also occur where required by authentication flows. Export a readable vector figure and confirm all arrows against the final release.

### 4.2 Data model

The changes listed below comprise one table and three columns across merged and proposed work. This is an inventory of the changes described here, not a claim to be a complete schema diff.

| Entity | Change | Status |
|---|---|---|
| `sync_conflicts` | New table recording unresolved edits with owner-scoped access | Recorded in the current conflict implementation |
| `plant_records` | `rejection_reason` | Recorded in the current review implementation |
| `alerts` | `resolved_by` and `resolved_at` | Proposed through PR #62. Confirm release database state |

One species can have many observations. Each observation has its own owner, location, measurements, photos, revision and review state. Species publication is separate from observation approval. The ERD must show actual keys and relationships rather than infer relationships from similar names.

[picture of D-06 ERD grouped into identity, species, observations, conflicts, IoT and reporting here]

### 4.3 Synchronisation and review

The normal path is local capture, explicit Sync now, record delivery, photo delivery and confirmation. Edits compare the device's baseline revision with the server revision. A stale edit remains locally available and enters conflict review. The botanist chooses the values to retain before another version-checked submission.

```mermaid
sequenceDiagram
    actor Botanist
    participant Phone as Mobile and local store
    participant Cloud as Supabase
    participant Officer as Officer web view
    Botanist->>Phone: Capture offline and save
    Note over Phone: Persist record and photo references
    Botanist->>Phone: Reconnect and select Sync now
    Phone->>Cloud: Deliver record and photos under owner identity
    Cloud-->>Phone: Return operation results
    alt Stored revision matches an edited record baseline
        Phone->>Cloud: Apply version-checked edit
        Cloud-->>Phone: Confirm updated revision
    else Stored revision has changed
        Cloud-->>Phone: No matching update
        Phone->>Phone: Preserve edit and show conflict
        Phone->>Cloud: File owner-scoped conflict report
        Officer->>Cloud: Read unresolved conflict context
        Botanist->>Phone: Review values and save merge
        Phone->>Cloud: Retry with revision check
    end
```

Figure D-04. Normal delivery and competing-edit decision points. Each operation can fail and must retain a recoverable local state. This figure is explanatory, not evidence that interrupted photo transfer has been exercised.

```mermaid
flowchart LR
    Pending[Pending observation] -->|Officer approves| Approved[Approved observation]
    Pending -->|Officer rejects with reason| Rejected[Rejected observation]
    Rejected -->|Botanist edits and resubmits| Pending
    Approved -->|Botanist edits and resubmits| Pending
    Approved -.->|Prerequisite checked by species gate| Publish[Officer requests species publication]
    Publish -->|Gate permits operation| Published[Published species]
```

Figure D-05. Observation review and species publication are separate lifecycles. Resubmission clears previous review fields. Actual anonymous visibility must be tested at each transition, including re-review, direct URLs and storage access. The diagram does not imply that changing observation state automatically changes the species publication flag.

### 4.4 IoT flow and hardware evidence

The final D-03 must distinguish the baseline from the proposed pipeline. After PR integration, it should show serial receipt, arrival timestamping, validation, bounded buffering, upload retry, independent rule checks, severity-aware cooldown, periodic silence checks and dashboard resolution. The simulator must appear as a separate source rather than as evidence of a physical run.

[picture of D-03 reading-to-alert and recovery flow after final PR integration here]

The [D-02 wiring draft](diagrams/exported/D-02_physical_build.png) is available with editable sources. Rain AO to D35 is user-confirmed. Supply voltage, resistor value, exact module specifications and the assembly photograph remain outstanding. Node location is a configured deployment coordinate. An on-board GPS receiver is not claimed.

[picture of annotated assembled hardware beside the verified D-02 wiring diagram here]

## 5. Testing plan and environment

### 5.1 Definition of Done and evidence strength

A work package is verified when its retained acceptance criteria pass on an identified revision, relevant regressions pass, unresolved results are documented and supporting evidence is accessible. A final deliverable also requires integration into the release and any necessary database migration. A closed issue, passing build or attractive screenshot alone is insufficient.

Three evidence levels are distinguished in this report.

1. Recorded device or live-system observations establish the stated procedure and environment.
2. Automated branch tests establish the exercised code behaviour under their fixtures.
3. Plans and design references establish intended work only.

Where only a narrative result exists, retain the underlying output before submission. A source file containing a test is not itself the result of executing that test.

### 5.2 Acceptance criteria and measurement rules

| Attribute | Retained target or acceptance basis | Measurement rule |
|---|---|---|
| Sync reliability | Greater than 95% success with no observed data loss | Successes divided by all recorded attempts under the agreed protocol. Include retries and conflicts and report scenario groups |
| QR performance | Mean full scan-to-record time below five seconds | Record full task time separately from decoder-callback lookup latency. The latter alone does not establish the full target |
| Coverage | Greater than 80% over the agreed backend API and mobile-sync scope | Declare included modules and coverage measures before measuring. Report helper coverage separately |
| Integrity | No unintended duplicates or silent overwrite in the tested cases | Compare record/photo identities, content and revisions after retries, conflicts and interruptions |
| Access control | Agreed role and ownership matrix holds | Test permitted and denied operations through direct backend requests as well as the UI |
| Usability | Greater than 90% unassisted task completion across the planned five-user evaluation | Unassisted completions divided by eligible assigned task attempts. Assisted completion is not unassisted success |
| IoT | Payload, alert and recovery policies hold | Test synthetic negatives and physical events separately, with timing and loss boundaries stated |

Sample sizes and task assignments must be fixed before trials. Do not remove deliberate failures from the headline denominator after seeing the result. Scenario-specific results may explain the outcome but must be labelled. Zero samples mean not measured. With small samples, report exact counts and avoid generalising to all field conditions.

### 5.3 Test identifiers

| ID | Scope | Remaining evidence focus |
|---|---|---|
| INT-01 | Offline persistence and review/publication workflow | Extend recorded sync/approval evidence with final anonymous visibility checks |
| INT-02 | Interrupted record/photo upload and retry | Explicit interruption after record insertion or during photo transfer |
| INT-03 | Competing edits and merge | Retain phone/script limitation. Run two physical installations if claiming that UI coverage |
| INT-04 | Publication lifecycle | Pending, approved, rejected, resubmitted and species publish/unpublish states |
| PERF-01, REL-01 | QR and sync measurements | Raw export, sample count, timing boundaries and denominator |
| IOT-01 to IOT-03 | Hardware, rule behaviour and malformed input | Final branch integration, calibration, physical recovery and correlated reading/alert evidence |
| SEC-01 | Role, storage and publication permissions | Release database matrix and full output with skipped cases visible |
| SEC-02 | Dependencies | Dated audit JSON with scope and tested lockfile/revision |
| SEC-03 | Headers, errors and dynamic scans | Release target, anonymous/authenticated contexts, actual scan method and exclusions |
| WEB-01 | Web regression | Search, maps, photos, exports, monitoring and denied-role feedback |
| UX-01 | Participant tasks and guideline review | Participant/task outcomes, observations, changes and retests |

These identifiers follow the existing [testing plan](Sprint_2_Management_Plan.md#4-testing-and-evidence-plan). UX-01 is used consistently rather than introducing a competing USE-01 identifier.

### 5.4 Recorded environments

| Trial | Environment and revision | Boundary |
|---|---|---|
| #23, 31 October | Physical iPhone, Expo Go SDK 58, Codespaces/ngrok, live Supabase, `8ce612e` | Phone model and iOS version still need recording. Network used to reload Expo Go after closing |
| #39, 1 November | Pixel 9 Pro XL, Android 17, Expo Go SDK 58, `73278e8`, same-owner scripted second client | Not two physical phones |
| #43, 1 to 2 November | Pixel 9 Pro XL, Expo SDK 58.0.22, `9a4d99b`, web Next.js 16.4.3 | Local application runs against live Supabase, not hosted-release verification |
| #51, 1 November | Pixel 9 Pro XL, Android 17, Expo Go 58.0.5, `7c10326` | Android permission scenarios. iOS equivalents not exercised |
| #44 and #16 policy records | Live database checks on 29 and 31 October, Linux/Node 22 recorded in comments | Preserve deployed policy definitions and raw output |
| IoT PR regressions | PR #63 `58e0aa7`, PR #64 `3fe69ed`, PR #65 `ffe764a` | Fake service/serial fixtures and branch integration checks reported by PR authors |

Expo SDK/package version and Expo Go client version are different fields. Record both. Final trials also need browser version, host OS, firmware version, migration state and network conditions. Do not replace missing exact versions with a broad value such as Node 20+.

## 6. Results, interpretation and limitations

### 6.1 Recorded results

| Evidence | Observed result in the source record | What it supports | What it does not establish |
|---|---|---|---|
| EV-01, #23 | Eight steps reported PASS. Four records uploaded, each with one photo and no duplicate on repeat sync | Offline record retention, later delivery, review and approval returning to phone | Four offline captures. One record uploaded while Wi-Fi remained on, leaving three deliberate offline captures |
| EV-02, #39 | Nine steps reported PASS across two conflict cycles, with version progression to 5 | Stale-edit refusal, preserved local choices, merge and conflict-banner lifecycle | Two-phone UI operation or every cross-owner content-edit case. Step 9 specifically records denied conflict filing |
| EV-03, #43 | Six regression steps reported PASS | Device capture, restart, photo delivery, repeat sync, QR opening and selected web checks after dependency changes | Hosted deployment, full report-export verification or offline QR timing |
| EV-06, #51 | Four permission/service scenarios reported successful | Recovery from denied/unavailable location while retaining form fields | Equivalent iOS behaviour or automatic GPS stamping |
| EV-04, #44 | 18/18 public write-block checks reported PASS with no skips | The checks represented by the script and recorded policy probes | Exhaustive security assurance or all storage/publication transitions |
| EV-04, #16 | Eleven-point live battery reported successful | Agreed review restrictions and selected owner/admin behaviours | Full regression on an eventual combined release |
| EV-05, #50 | Four live UI/role cases reported successful | Accurate species mutation feedback, including missing rows | Automated web regression coverage |

### 6.2 Automated verification and audit scope

The verification record reports passing mobile type checks, lint, unit tests and a Metro Android bundle at `9a4d99b`. It also reports web production dependency findings at zero, while noting development-tool findings separately. The mobile audit is recorded as zero across the reported audit scope after dependency overrides.

Do not rewrite this as both applications having zero vulnerabilities in every scope. An audit is a dated known-advisory check, not proof that application vulnerabilities are absent. The older October JSON files must not be presented as the raw evidence for the November result.

| Suite or branch | Recorded result | Reporting constraint |
|---|---|---|
| Mobile sync helper | Four tests and 100% helper coverage reported in the execution backlog | Not overall mobile or full sync-screen coverage |
| Measurement summariser | Historical two-test pass | Attach a release-revision rerun before quoting it as final |
| IoT baseline | Seven-test suite recorded historically | Does not include new branch regression tests |
| PR #63 | Fourteen tests reported, including seven validation additions | Branch result, not merged-release result |
| PR #64 | Fifteen tests reported, or twenty-two combined with #63 | Branch result with explicit combination |
| PR #65 | Twenty-one tests reported, or thirty-six combined with #63 and #64 | PR author reports all six merge orders checked. Final release rerun still required |
| Web | Type/lint/build checks recorded. No web test runner recorded | Build success is not runtime behaviour or coverage |

Do not sum hypothetical future test counts into a current release total. Likewise, route counts from different revisions or build-output conventions should not be treated as a quality metric.

### 6.3 Initial failures and retests

| Observation | Interpretation | Response and result |
|---|---|---|
| First #23 record uploaded while Wi-Fi remained enabled | Test-procedure error, not an offline-storage failure | Later captures used airplane mode. Only three are counted as deliberate offline captures |
| Permission recovery missing on discover/edit screens | Real UI recovery defect found by device testing | Added recovery actions in `7c10326`, with same-device verification recorded |
| RLS probe referenced a nonexistent column | Test-fixture defect, not proof of a policy failure | Probe corrected in `1a289a5`, then 18/18 recorded |
| Stale same-owner edits refused | Expected integrity behaviour | Local content retained, merge performed and subsequent revision checked |
| IoT timeout terminated the bridge | Baseline reliability defect reproduced in PR work | Recovery branch reports passing interruption regressions. Integration remains pending |

The report retains these observations rather than claiming every initial test passed. Final passing results must be linked to the correction and retest revision.

### 6.4 Acceptance targets still to measure

| Target | Current status | Required completion |
|---|---|---|
| Greater than 95% sync success | Not measured under the agreed acceptance protocol | REL-01 export with all attempts, scenario groups and loss/duplicate checks |
| Mean scan-to-record below five seconds | Not measured | PERF-01 full-task measurements plus separately labelled lookup timings |
| Greater than 90% unassisted completion | Not measured | UX-01 task-level participant outcomes |
| Greater than 80% target-scope coverage | Not demonstrated | Explicit denominator, measured coverage and exclusions |
| Security release criteria | Partly verified | Credential completion record, current scan/role/storage results and residual decisions |

The #23 panel's 4/8 attempt result includes deliberately failed offline attempts. It is evidence of that session, not a successful reliability benchmark. Both raw outcomes and scenario grouping must remain available.

### 6.5 Interpretation

The device results provide stronger support for recoverable offline work than the Sprint 1 screenshots of empty lists and an unused sync screen. Revision-aware refusal and merge provide direct evidence against silent overwrite in the exercised conflicts. They do not establish all-day forest reliability, accuracy under canopy or behaviour across every phone.

The main remaining assessment weakness is measured evaluation. Functional checks cannot substitute for performance samples or participant outcomes. Adding unit tests can improve confidence, but tests should cover meaningful failure boundaries rather than inflate a total. Broad sync refactoring solely to raise coverage would also require regression time close to release.

## 7. Usability, visual rationale and refinement

### 7.1 Design references supplied for team discussion

Six images were supplied during report preparation. Their provenance and licences have not been established. They are design-discussion inputs, not evidence of deployed features or tests. Do not reproduce third-party images in the submission without a suitable source credit and permitted use.

| Reference | What is visible | Relevant interpretation | Evidence boundary |
|---|---|---|---|
| Image 1 | A large red, pale-speckled flower resembling Rafflesia | Biodiversity imagery could support plant identity and project context | Exact species and location are not established by the image |
| Image 2 | A hornbill with a prominent orange-red casque | Regional wildlife imagery could provide context | Does not imply fauna-recording scope or prove the species occurs at the project site. A visible credit needs provenance checking |
| Image 3 | Red/white mobile navigation with a curved selected-item recess | Reference for an active-tab indicator | External concept, not Plantiful implementation |
| Image 4 | Dark navigation with a bright green active item moving across positions | Reference for selected-state visibility and transitions | Arrows illustrate a concept, not evidence of an implemented animation |
| Image 5 | Plantiful Capture screen with camera view, torch, scanner guide, new-tag action and five tabs | Shows the existing capture interface and the context for navigation refinements | Camera preview is visible. Successful decoding, timing and persistence are not demonstrated |
| Image 6 | Handwritten web notes and card sketches | Appears to propose glass effects, image-backed cards and images in officer approval sections | Product suggestions requiring confirmation, not approved implementation requirements |

These six items are design references or existing-state captures. They are not proof that a refinement was implemented. Implemented changes use the IMG-S2 captures defined in Section 3.4. A reference image may appear beside a change only when the caption distinguishes the concept from the delivered result.

### 7.2 Proposed design decisions and evaluation

Plant imagery can strengthen species recognition when it is linked to the correct entity and accompanied by a readable name. In officer review, the primary image should be the submitted observation photo. A catalogue image may be shown separately and labelled as a reference. Substituting a generic species image could obscure whether the botanist supplied adequate evidence.

Glass effects should be limited to surfaces where text remains readable across every background. Dense tables, review decisions and error messages need stable contrast. A solid fallback is appropriate for dark mode, reduced transparency or low-performance devices. No usability or performance benefit is claimed until tested.

A curved selected tab may make the current location more visible. It must retain stable tab positions, text labels, accessible names, adequate hit areas and separation from the phone's gesture area. Selection cannot depend on colour alone. Animation should respect reduced-motion preferences. The decorative movement must not shift the usable touch target unpredictably.

These proposals should be selected only if they address observed task problems and fit the remaining regression budget. Styling alone does not demonstrate innovation or improved usability.

### 7.3 Refinements already recorded

| Observed issue | Recorded change | Verification boundary |
|---|---|---|
| Tab labels overlapped the Android gesture area | Insets and bottom clearance adjusted | Device-review history. Include before/after captures at the same viewport |
| Torch control position drifted | Anchored to the camera view | Verify on final supported screen sizes |
| Sign-in content and spacing were inconsistent | Alignment, wording and control-padding refinements | Developer/device observations, not independent participant results |
| Denied GPS access left users without a recovery route | Open settings and field retention | Four Android scenarios in EV-06 |
| Headline sync percentage hid failure categories | Synced, conflict and failed breakdown added | Check whether participants correctly interpret each category |
| Users need appearance choice | Light, Dark and System controls | Check persistence, system following, contrast and fixed camera/QR surfaces on the final device build |

[picture of paired before/after Plantiful screens with the same viewport, task and labelled change here]

### 7.4 Evaluation protocol

Use the existing UX-01 method. Target five participants and state whether they are representative users or proxies. Prefer participants who did not implement the screens under test. Provide task goals without coaching the sequence of taps. Assign role-relevant tasks and record which tasks each participant receives.

| Task | Role | Observable success |
|---|---|---|
| UX-T1 | Botanist | Find the named species and explain the selected result |
| UX-T2 | Botanist | Save an offline observation with the requested photo and location outcome |
| UX-T3 | Botanist | Find the saved observation, explain its status and synchronise after reconnecting |
| UX-T4 | Officer | Review a submission, reject with a clear reason and identify the resulting state |
| UX-T5 | Visitor | Find a published species without signing in |
| Optional refinement task | Botanist | Read a rejection reason, correct the observation and resubmit |
| Optional refinement task | Officer | Resolve an alert after PR #62 is integrated and explain the resulting state |

Agree optional tasks before the sessions. Do not assume every participant performs every role. Report exact assigned-task denominators and per-role outcomes. If five participants each perform five tasks, the denominator is 25 and 23 unassisted completions would exceed 90%. This is an arithmetic illustration, not a result or a prescribed sample allocation.

Use Nielsen's heuristics for status, consistency, error prevention and recovery. Use WCAG 2.2 checks for relevant web contrast, focus and target behaviour, and Android accessibility guidance for native controls. These are proposed evaluation references, not evidence that the team previously applied them or that full compliance has been achieved.

| Participant | Role and assigned task IDs | Unassisted / assigned | Assisted | Failed | Time, errors and observation | Refinement and retest |
|---|---|---|---|---|---|---|
| P1 to P5 | [TBD] | [TBD] | [TBD] | [TBD] | [TBD] | [TBD] |

[TBD] Record sessions, compute the overall and per-task rates, explain recurring problems and retest changes. Identify repeat participants because familiarity can improve retest performance independently of the change.

## 8. Security and data protection

### 8.1 Current security evidence

| Control area | Recorded evidence | Outstanding release check |
|---|---|---|
| Dependencies | Mobile audit zero and web production audit zero in EV-03 | Retain dated raw JSON and identify dev/production scope on the final lockfile |
| User permissions and publication | Live probes and 18/18 RLS script record | Repeat after final schema/policy changes and retain full output |
| Officer observation restrictions | Eleven-point live battery recorded in #16 | Verify review, resubmit, denied content edits and denied deletes on the release |
| Cross-owner conflict reporting | 403 denial recorded in #39 | Do not generalise this single probe to every cross-owner operation |
| HTTP headers | Header configuration exists in `web/next.config.ts` | Capture actual responses on the demonstrated release, including errors |
| Storage | Historical bucket-policy assessment and private report-bucket design | Verify direct object access, owner restrictions and actual export download |
| Dynamic scanning | Historical 10 October ZAP reports | SEC-03 release scan with exact method, target and authenticated coverage |
| Credentials | Exposure recorded in #41 | Owner confirmation of revocation/reset, old-credential denial and service recovery |
| Alert resolution | Database enforcement proposed in PR #62 | Confirm migration, allowed/denied operations and stamped identity after integration |

Zero High findings in a ZAP run does not mean zero High risks across the entire system. An authenticated scan is not automatically an active scan. Record whether scanning was passive or active, what endpoints were reached and what was excluded.

### 8.2 Data protection boundaries

| Data or boundary | Control and rationale | Limitation |
|---|---|---|
| User identity and session | Supabase Auth, server-side identity checks and user-scoped requests | Review expiry, sign-out and shared-device behaviour |
| Mobile offline records | SQLite and app-private photo files | App sandboxing is not application-level database encryption |
| Mobile session tokens | Persisted through AsyncStorage in the current client | AsyncStorage must not be described as encrypted secure-token storage |
| Cloud records and files | RLS, storage policies and HTTPS cloud transport | Platform encryption claims need a cited service basis. RLS is access control, not encryption |
| Bridge credentials | Service key on trusted host | Privileged requests bypass RLS. Host access and validation are separate controls |
| Public biodiversity information | Publication and visibility rules | Review exact coordinates, QR identifiers and photo URLs, not only whether UI buttons are hidden |

The security assessment contains a rationale for not using field-level encryption for its data classification. This report does not infer tutor acceptance from that rationale. Confirm the original objective, platform controls, local-device exposure and sensitive-location policy at sign-off. Public records and public storage objects need explicit handling decisions because unpublished metadata does not automatically make an already-public object private.

### 8.3 Recommendation close-out

The following table carries forward the real R-01 to R-10 register entries. It replaces an empty recommendation template. Final dispositions require owner confirmation and supporting evidence.

| ID | Recommendation | Evidence position | Proposed release action | Recorded owner |
|---|---|---|---|---|
| R-01 | Repeat ZAP anonymous and authenticated scans | Historical scan available, final retest absent | Execute SEC-03 and retain remaining findings | Badrul |
| R-02 | MASVS L1 development-build checks | Historical code/bundle review and new functional phone trials | Map actual checks to MASVS. Functional trials alone do not complete it | Basill |
| R-03 | Recurring dependency scanning | No enabled recurring scan established in this review | Confirm repository configuration or explicitly defer with owner/date | Nathan |
| R-04 | Signed Android release and distribution archive | Expo Go evidence is available | Decide whether a development/release build is required for offline launch and handover. Record any deferral | Basill |
| R-05 | RLS rerun after migrations | Dated 18/18 results recorded | Rerun on final migration state and preserve full output | Maqeel |
| R-06 | Automated anonymous mutation regression | Manual/scripted permission evidence exists | Identify what is repeatable and what remains manual. Decide automation scope | Badrul |
| R-07 | Bucket MIME and size restrictions | Open in the register | Implement and verify, or record accepted limits and residual exposure | Maqeel |
| R-08 | Session expiry and reauthentication for role changes | Open in the register | Review or document explicit deferral. Do not imply current enforcement | Nathan |
| R-09 | Nonce-based CSP | Inline script allowance remains | Test a compatible policy or retain a justified prototype limitation | Badrul |
| R-10 | Remove public `qr_code` selection | Field removal remains open in the register | Verify actual public response and record a minimisation decision | Badrul |

F-06's dependency component has a newer zero-advisory record. Recurring scanning remains a separate R-03 concern. Updating a package does not by itself close the monitoring recommendation.

### 8.4 Required credential completion record

| Field | Required entry |
|---|---|
| Authorised owner and date | [TBD] |
| Exposed secret revoked and dependent environment updated | [TBD], no secret values |
| Affected account passwords reset and sessions addressed | [TBD] |
| Superseded credentials denied | [TBD], redacted result only |
| Legitimate bridge and application operations still work | [TBD] |

Until this record exists, credential exposure remains unresolved. A clean dependency audit cannot substitute for revoking an exposed credential.

## 9. Deliverables, reproducibility and demonstration readiness

### 9.1 Release acceptance gates

| Gate | Required evidence | Status at cut-off |
|---|---|---|
| Integration | Reviewed PRs integrated, migration state recorded and combined regression executed | Outstanding for PRs #60 and #62 to #65 |
| Functional acceptance | Core user workflows traced on the final revision, including failure recovery | Earlier trials available, final release verification outstanding |
| Physical IoT | Wiring, calibration, correlated readings/alerts and interruption trial | Outstanding |
| Measured evaluation | PERF-01, REL-01 and UX-01 outcomes with raw records | Outstanding |
| Security | Credential remediation, current role/storage/header and scan results, residual decisions | Partly complete |
| Reproducibility | Setup guide, dependency locks, SQL and safe configuration templates sufficient for another team member | Confirm using a clean setup |
| Submission | Rendered figures, accessible evidence, report cross-check and actual sign-off | In progress |

Absence of hosted verification is a limitation, not automatically an approved scope exclusion. Confirm the expected demonstration/deployment arrangement with the tutor. A stable local demonstration may be suitable, but it must be described accurately.

### 9.2 Deliverable inventory

| Deliverable | Location | Packaging requirement |
|---|---|---|
| Mobile application | `mobile/` | Record Expo Go or build distribution method and offline-launch limitation |
| Web application | `web/` | Record start/build commands and final demonstrated revision |
| Backend setup | `backend/` | Include reviewed SQL, required migration order and verification scripts. Most SQL is local-only in this checkout |
| IoT firmware and host services | `iot/` | Record firmware, port, wiring, calibration and evaluator schedule |
| Deployment guide | [Deployment and maintenance](../../Guides/Prototype_Deployment_and_Maintenance.md) | Check against integrated changes and perform a clean setup |
| User instructions | [TBD] | Provide botanist capture/sync/recovery and officer review/monitoring tasks. A developer runbook is not a user manual |
| Verification record | [Prototype verification](../../Testing/Prototype_Verification.md) | Preserve dates, revisions and limitations |
| Security pack | [Security index](../../README.md#security-and-data-protection) | Supply selected redacted copies. Gitignored local paths alone are insufficient |
| Figures | `diagrams/` and labelled draft figures in this report | Export and inspect at final PDF page size |

### 9.3 Figure plan

| Figure | Purpose | Completion requirement |
|---|---|---|
| D-01 | Explain deployment, protocols and privileged host boundary | Review and export the draft in Section 4 |
| D-02 | Connect electrical design to actual assembly | Verify existing draft and add annotated photograph |
| D-03 | Explain validation, independent alerts, escalation and recovery | Create after final PR policy integration |
| D-04 | Explain offline delivery and version-aware conflicts | Review and export draft, with failure paths explained |
| D-05 | Separate observation review from species publication | Review and export draft against live policy outcomes |
| D-06 | Show real entity keys and cardinalities | Generate from final schema, including conflicts and alert audit fields |
| D-07 | Explain role-based tasks and recovery | Map botanist, officer, admin and visitor journeys |
| IMG-S2-01 to IMG-S2-10 | Show implemented Sprint 2 changes and before/after states | Capture from the recorded build using the requirements in Section 3.4. Replace every planned placeholder |

Each figure needs a caption explaining its claim and an introduction in the text. An image of a plant is contextual illustration. A workflow diagram explains design. A correlated screenshot/log sequence demonstrates a test. These serve different purposes and should not be counted interchangeably as evidence.

Use images deliberately. A paired before and after capture is strongest when the viewport, task, role and data are the same. Show error and empty states as well as the successful state. Keep the original screenshots and place only reviewed, redacted copies in the submission package. Do not use a design reference as a substitute for an implemented screen.

### 9.4 Demonstration and sign-off preparation

| Segment | Target duration | Content |
|---|---|---|
| Problem and users | 1 minute | Offline fieldwork, reviewed knowledge and monitored conditions |
| Verified changes | 1 minute | Show a small number of important before/after improvements |
| Mobile-to-web workflow | 3 minutes | Capture, persistence, sync, rejection/correction or approval and public check |
| Physical IoT | 2 minutes | Node, reading, alert and integrated resolution behaviour |
| Results and limitations | 1 to 3 minutes | Actual acceptance/security/usability results and remaining constraints |

Confirm the presentation/Q&A allocation before fixing this schedule. Disclose prepared fixtures and backup recordings. Rehearse connectivity, authentication, Expo Go startup, cable ownership and recovery. Record actual duration rather than assuming the target was achieved.

## 10. Sign-off, retrospective and contributions

### 10.1 Meeting record

| Field | Entry |
|---|---|
| Booking confirmation | [TBD] |
| Date and attendees | [TBD] |
| Release and database state demonstrated | [TBD] |
| Deliverables reviewed | [TBD] |
| Tutor feedback and decisions | [TBD] |
| Outcome | [TBD], signed off, conditional or not signed off |
| Follow-up actions and completion evidence | [TBD] |

No meeting record was found in the reviewed workspace. This does not establish that no private booking exists. Conditional sign-off remains conditional until its actions are resolved.

### 10.2 Retrospective supported by current evidence

Recorded device trials found defects that static checks did not expose, including inconsistent permission-recovery actions. Direct database probes identified policy drift that could not be assessed from interface behaviour alone. These results justify testing across interface and backend boundaries.

The remaining weakness is scheduling evidence-dependent work. Participant measurements, calibration and credential confirmation cannot be replaced by more code commits. Issue closure also became detached from integration state, with several closed work items still represented by open PRs. Future progress tracking should distinguish implemented-on-branch, merged, deployed and verified-on-release states.

| Sprint 1 commitment | Current evidence | Lesson or remaining action |
|---|---|---|
| Improve branch coordination | Focused commits and review branches exist | Open-PR integration remains a gate. Commit volume does not establish coordination quality |
| Bench checks and calibration | Wiring draft exists, measured calibration outstanding | Book physical hardware access alongside implementation work |
| Document secret handling | Host-side environment handling described | Confirm actual rotation rather than infer it from configuration design |
| Schedule acceptance trials | Offline and conflict trials recorded, acceptance/usability measurements outstanding | Allocate people, devices and trial time before final writing |
| Explain deviations | Review and conflict policies documented | Carry decisions into issue bodies, diagrams, tests and user instructions consistently |

### 10.3 Contribution record

The following is a completion template, not an attribution claim. Issue assignment, PR authorship and test execution may belong to different people. Each member must supply their own dated contribution evidence.

| Member | Contribution, decision or test performed | Date and supporting reference |
|---|---|---|
| Muhammad Maqeel bin Muhammad Kahfi | [TBD] | [TBD] |
| Nathan Sebastian Learmonth | [TBD] | [TBD] |
| Badrul Aliff Aiman bin Badrulmunirzaki | [TBD] | [TBD] |
| Gae Jayden MWINE | [TBD] | [TBD] |
| Ashley Wallen Anak Winston | [TBD] | [TBD] |
| Basill Agas Anak Heatley Rogers | [TBD] | [TBD] |

### 10.4 Interim conclusion

Plantiful now has recorded evidence of offline record delivery, review feedback, conflict preservation and selected permission controls beyond the source-only checks presented in Sprint 1. The final claim of readiness depends on integrating outstanding PRs, completing measured and physical trials, resolving credential exposure and recording sign-off. These remaining activities determine whether the final system is demonstrably suitable for its intended tasks.

[TBD] Replace this interim conclusion after the release gates are evaluated, using actual outcomes and explicit remaining limitations.

## References

1. Group 7. [Submitted Sprint 1 report](../Sprint1/sprint1.pdf). Historical submission baseline.
2. Group 7. [System proposal](../System_Proposal_Report.md). Requirements and acceptance commitments. Confirm any difference from the submitted proposal PDF before final citation.
3. COS30049. [Marking rubric transcription](../../Marking_Rubric.md). Check against the official assessment handout.
4. Group 7. [Sprint 2 management plan](Sprint_2_Management_Plan.md).
5. Group 7. [Prototype verification record](../../Testing/Prototype_Verification.md).
6. Group 7. [Security findings and recommendations register](../../Security/03_Findings_Register.md). Local-only supporting document.
7. Nielsen Norman Group. [Ten usability heuristics for user interface design](https://www.nngroup.com/articles/ten-usability-heuristics/). Proposed evaluation framework.
8. W3C. [Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/). Proposed checks, not a compliance claim.
9. Android Developers. [Make apps more accessible](https://developer.android.com/guide/topics/ui/accessibility/apps). Proposed native-interface review guidance.
10. OWASP. [Mobile Application Security Verification Standard](https://mas.owasp.org/MASVS/). Scope reference for R-02.
11. ZAP. [Documentation](https://www.zaproxy.org/docs/). Cite the exact tool version and method used in the final scan.

[TBD] Format references in the unit's required style and record actual access dates when sources are consulted. Credit external images separately. Tutor email direction is paraphrased from the message supplied by the team lead, not a substitute for sign-off.

## Appendix A. Evidence register

| ID | Claim supported | Source | Submission action and limitation |
|---|---|---|---|
| EV-01 | Offline persistence, sync, duplicate checks and approval return | [Verification record](../../Testing/Prototype_Verification.md), [11 screenshots](../../Testing/Evidence/issue-23/) | Supply labelled copies and the record IDs. Preserve three-offline-record and Expo Go restart qualifications |
| EV-02 | Conflict, merge and officer banner | [Verification record](../../Testing/Prototype_Verification.md), [banner capture](../../Testing/Evidence/issue-39/01_officer_conflict_banner.png) | Retain server-query/probe outputs referenced by the narrative. State phone plus scripted client |
| EV-03 | Dependency changes and SDK regression | Verification record, `9a4d99b`, [issue #43](https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/issues/43) | Attach November raw audit/build outputs. October audit files are historical |
| EV-04 | Review, publication and RLS restrictions | [Issue #44](https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/issues/44), [issue #16](https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/issues/16), [verification script](../../../backend/scripts/verify_public_write_block.sql) | Save the executed output and deployed SQL state. Script source alone is not a result |
| EV-05 | Species mutation feedback | [Issue #50](https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/issues/50) | Retain UI/probe captures for the four reported cases |
| EV-06 | Android location recovery | [Issue #51](https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/issues/51), `7c10326` | Retain permission-state screenshots and device details |
| EV-07 | Historical security assessment | [Security evidence guide](../../Security/04_Evidence_Guide.md), local `Docs/Security/Evidence/` | Separate October history from release reassessment. Include redacted files in the actual package |
| EV-08 | Proposed alert and IoT fixes | [PR #62](https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/pull/62), [PR #63](https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/pull/63), [PR #64](https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/pull/64), [PR #65](https://github.com/Basilagas21/COS30049_InnovationProject_Plantiful/pull/65) | Branch-reported results. Add combined-release output and physical confirmation |
| EV-09 | Wiring design | [D-02 image](diagrams/exported/D-02_physical_build.png), [editable source](diagrams/source/D-02_physical_build.drawio) | Draft, not electrical verification. Add component values and assembly photo |
| EV-10 | Acceptance measurements | [TBD] PERF-01 and REL-01 raw exports and summaries | Include protocol, dates, sample counts and all outcomes |
| EV-11 | Usability | [TBD] UX-01 participant/task records | Anonymous IDs, role assignments, errors, timings and retest results |
| EV-12 | Release and sign-off | [TBD] meeting record, final revision and rehearsal | Actual outcome and unresolved actions |

## Appendix B. Rubric mapping and finalisation checklist

| Product criterion | Marks available | Main report evidence | Current barrier to a strong final assessment |
|---|---|---|---|
| Testing Plan | 10 | Section 5, traceability in Section 2 and Appendix A | Final sample sizes, exact environments and release coverage denominator |
| Test Results | 10 | Sections 6 and 8 | Measured acceptance, release retests and accessible raw outputs |
| Prototype | 10 | Sections 2 to 4 and 9 | Unmerged changes, physical validation and final figures |
| Software Usability | 10 | Section 7 | Participant outcomes and verified refinements |

The team's 36/40 target corresponds to 90% of these product marks. It is a target, not a predicted or guaranteed award. Writing quality cannot replace missing test or participant results.

- [ ] Review and integrate PRs #60 and #62 to #65, or record explicit exclusions and reasons.
- [ ] Record the release commit, dependency lockfiles and database migration state.
- [ ] Run combined-release checks and attach actual output rather than predicted test totals.
- [ ] Confirm credential remediation and legitimate-service recovery.
- [ ] Complete physical wiring, calibration, alert and interruption evidence.
- [ ] Complete PERF-01, REL-01 and UX-01 with pre-agreed methods.
- [ ] Verify interrupted photo upload, final rejection/resubmission and actual report exports.
- [ ] Complete SEC-01 to SEC-03 and decide every recommendation disposition.
- [ ] Measure the agreed coverage scope and report any missed target honestly.
- [ ] Render D-01 to D-07 and inspect labels, captions and page-scale readability.
- [ ] Include user instructions and reviewed SQL sufficient to reproduce the demo.
- [ ] Confirm contributions, dates, task owners and the actual sign-off outcome.
- [ ] Replace all placeholders and reconcile current versus historical statuses.
- [ ] Redact submission copies and verify all evidence is present in the exported package.
- [ ] Inspect the final PDF for broken bookmarks, clipped tables, separated captions and missing images.
- [ ] Rehearse, record the actual duration and check the submitted files.
