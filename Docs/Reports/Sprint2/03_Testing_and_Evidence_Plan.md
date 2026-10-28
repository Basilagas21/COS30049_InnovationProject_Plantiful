# Sprint 2 testing and evidence plan

[Sprint 2 index](../../README.md#sprint-2) | [Execution backlog](02_Execution_Backlog.md)

## 1. Definition of Done

A deliverable is verified when its acceptance criteria are satisfied on a recorded version, relevant regression checks pass, observed failures are resolved or explicitly accepted with a reason, and supporting evidence is indexed. Compilation alone does not establish device or user success.

| Quality attribute | Acceptance basis | Measurement or check |
|---|---|---|
| Offline reliability | Proposal target greater than 95% sync success with no observed data loss | Count all attempts, successes, failures, conflicts and retries. Also group by scenario |
| QR performance | Proposal target less than five seconds average scan-to-record | Distinguish full user task from decoder-callback lookup timing |
| Code quality | Proposal target greater than 80% coverage on backend API and mobile sync | Define denominator and exclusions. Helper-only coverage is insufficient |
| Access control | Agreed role matrix and ownership restrictions | Allowed and denied operations, including direct backend requests |
| Data integrity | No unintended duplicate or silent overwrite in the tested scenarios | Record/photo IDs, revisions, retry and conflict observations |
| Usability | Relevant guidelines, clear navigation and successful tasks | Participant completion, assistance, errors, timings and retest findings |
| IoT correctness | Actual payload contract, calibration and alert policy | Valid/invalid readings, multiple rules, cooldown, silence and recovery |

Sample sizes, network conditions and additional timing targets must be agreed before trials. A result outside a target remains a failure or limitation until addressed, not a reason to change the target retrospectively.

## 2. Environment record

Complete one record per distinct environment. Use a test account identifier rather than a password.

| Field | Value to record |
|---|---|
| Test ID and date | Test identifier, date, time zone and tester |
| Version | Commit, mobile build and firmware version |
| Device | Phone model/OS, host OS and browser version |
| Backend | Test project identifier and migration version, with no credentials |
| Network | Connected, disconnected, restricted or deliberately interrupted |
| Account role | Anonymous, botanist A, botanist B, officer or administrator |
| IoT | Board, sensor models, pin map, power, calibration, transport and evaluator schedule |
| Preconditions | Cached catalogue, baseline revision, fixtures and permissions |
| Cleanup | Test records to remove, retained evidence and restoration checks |

The dated local software environment and existing check results are in [the audit](01_Baseline_Audit.md). Do not copy that environment into physical trials without checking the actual equipment.

## 3. Trial procedures

### INT-01. Offline persistence and publication workflow

1. Prepare the catalogue and sign in as the test botanist.
2. Disconnect the device and capture at least three observations with photos.
3. Record local identifiers and confirm pending status.
4. Close and reopen the application. Check field values and photos.
5. Reconnect and synchronise. Record all attempts.
6. Match the remote observations and photographs to the local records.
7. Synchronise again and verify no unintended duplicates.
8. Complete the officer review and permitted publication steps. Check the anonymous view.

Pass requires persistence, correct transferred content and the expected visibility. A screenshot of the capture form alone does not establish completion.

### INT-02 and INT-03. Retry and conflict behaviour

Interrupt an upload after record insertion or during photo transfer. Preserve the failure result. Retry and check row identity, photo contents and final state.

For conflicts, use two independent installations signed in as the same owner. Import the same baseline, edit offline on both, then sync A before B. Confirm B preserves its edit and shows a conflict. Resolve using the implemented workflow. Repeat with another server edit between review and retry. A different botanist must not gain write access.

### INT-04 and SEC-01. Publication and permissions

Test pending, approved, rejected and resubmitted observations. Test species publication separately because its flag is not an observation field. Include a published-on-insert fixture and updates without an approved observation. Record public visibility before and after each operation.

Verify anonymous, owner, other botanist, officer and administrator outcomes. Compare deployed rules with repository SQL. Treat skipped fixtures as skipped checks rather than passes.

### PERF-01 and REL-01. Measured acceptance

For QR trials, record the device, cached/non-cached state and timing boundary. Use the existing measurement export for decoder-callback lookup. Measure the broader scan-to-record task separately if claiming the proposal's complete timing target.

Export `plantiful.db` using the available development-device tooling. Run `python mobile/scripts/summarize_acceptance.py PATH_TO_DB --raw PATH_TO_EVENTS.csv` from the repository root. Record each device/trial separately. Keep the raw data and note that the in-app display uses a limited recent sample.

Report sync successes divided by all recorded attempts, including retries and conflicts as specified by #40. Also report scenario groups so deliberately induced failures are interpretable. Do not claim a zero-sample result as passing.

### IOT-01 to IOT-03. Hardware, rules and malformed input

Confirm wiring and installed firmware first. Capture the assembled hardware, serial output, stored reading and dashboard state. Correlate by sensor and time and use returned identifiers where available. Label synthetic and physical tests separately.

Exercise normal conditions, suitable threshold or motion events, repeated events, silence and recovery. Define whether timing begins at the physical event, serial receipt or database insertion. Record independent rule behaviour when a reading meets multiple conditions.

Run negative payload cases before any live ingestion test. Check wrong types, non-finite values, percentage bounds, missing/null fields and unexpected sensor identity. Invalid input must not produce an insert or alert under the chosen contract.

### SEC-02 and SEC-03. Security reassessment

Preserve dependency audit JSON before and after deliberate compatible updates. Analyse package paths and affected functionality. Retest typechecking, lint, build and affected workflows.

Repeat scoped role, storage, header and route-error checks. Record ZAP version, target, release, anonymous/authenticated contexts, scan method and exclusions. A passive scan does not establish exhaustive injection coverage. Record remaining findings and remediation recommendations.

### WEB-01. Web regression

Check species create/edit/delete, search/filter, maps, photo display, report exports and monitoring filters. Verify role restrictions, missing records and connection failure feedback. Separate observation management requirements from species management.

## 4. UX-01 usability sessions

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

Review visibility of status, consistent controls, error prevention, recovery, readable text, contrast, touch targets, keyboard focus and loading/empty/error states. Name the guidelines used. A brief review does not establish full accessibility compliance.

Prioritise recurring problems, implement bounded refinements, and retest affected tasks. Report whether retest participants were the same people because familiarity can influence results.

## 5. Registers to complete during execution

### Test execution record

| Test ID | Date/version/environment | Expected | Actual | Status | Evidence IDs | Defect/retest |
|---|---|---|---|---|---|---|

No device, live integration or participant result is entered yet. Use Pass, Fail, Blocked or Not run and retain initial failures when retesting.

### Evidence register

| Evidence ID | Test/requirement | Date and version | Description | Relative file path | Redaction and limitations |
|---|---|---|---|---|---|

### Usability observation record

| Participant | Task | Completion | Help/errors | Time | Comment | Proposed refinement | Retest |
|---|---|---|---|---|---|---|---|

### Defect and change record

| Defect ID | Reproduction | Impact | S2 item | Fix/version | Retest | Status |
|---|---|---|---|---|---|---|

## 6. Evidence storage and submission

Keep raw session exports, scans and logs in the local-only `Docs/Security/Evidence/` folder, using the `sprint2/` subfolder when collection begins. Preserve historical originals. Store only selected reviewed and redacted submission copies with the Sprint 2 delivery package. Do not copy tokens, passwords or sensitive locations into tracked documentation.

Use filenames containing test ID, date and a short description. Link screenshots to the same record or sensor across the workflow. A screenshot illustrates an outcome, while the full log or export supports detailed verification.

The final package must contain accessible evidence files. Links to personal absolute paths or ignored folders alone are insufficient. Confirm referenced files exist in the exported submission package.
