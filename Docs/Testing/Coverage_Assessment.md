# Whole-scope test coverage assessment (S2-16)

Date: 2 November 2026. Tested revision: `main` @ `874e992`. Environment: live Supabase project, workstation runs of unit suites and REST batteries, one device trial session on Google Pixel 9 Pro XL with Expo Go (SDK 58). Raw outputs are in [Evidence/issue-54](Evidence/issue-54/).

## 1. Denominator, method and exclusions, defined before any percentage

The proposal target is more than 80% coverage on backend API and mobile sync. Two different measurements are commonly called coverage, and only one of them is honest here:

- **Line coverage** counts executed source lines. It cannot be computed for the backend, which is SQL, and the web app has no test runner, so a line-coverage percentage against the proposal target is not currently measurable for either surface. Stating one would be fabrication.
- **Behaviour coverage** counts required behaviours exercised by at least one recorded check. This is measurable today and is what this assessment reports, per surface, with the denominator fixed before the counting:

| Surface | Denominator (from source, not memory) | Count |
|---|---|---|
| Backend data layer | Tables, row-level security policies, database functions and triggers defined in the migrations | 11 tables, 41 policies, 5 functions, 4 triggers, asserted by a 29-check pgTAP battery |
| Mobile sync logic | The revision-checked edit helper and the owner-scoped local store operations | sync-edit.ts (100% line coverage, all branches) plus 7 owner-scoping behaviour tests in the committed suite |
| Permission matrix | Allowed and denied operations per role from the agreed role model | 33 checks across four batteries |
| End-to-end flows | Offline capture, restart persistence, sync, duplicate prevention, conflict cycle, cross-owner rejection, officer review, public gating | 8 flows, all observed on device or live API |

Exclusions, stated up front: IoT physical wiring and sensor calibration (Basil's lane, tracked by #48 and #49), the five-user usability walkthrough (#40, scheduling-blocked), hosted-deployment verification (never performed), and line-level coverage instrumentation (the runners execute statements but do not emit per-line reports; behaviour coverage is what this document measures).

## 2. Requirement to test map

| Requirement area | Unit | Integration / negative / permission | End-to-end |
|---|---|---|---|
| Offline capture and sync (objective 1) | sync-edit 4 tests, db owner-scoping 7 tests | conflict battery 10 checks | #23 run, #39 run, #43 device pass |
| Conflict handling and CAS | sync-edit revision tests | cross-owner recheck, conflict battery | #39 two live cycles with merge |
| Access control (objective 3) | owner-scoping suite (push filter, counts, adoption, steal guard) | policy battery 10, trigger battery 11, R7 SQL battery 18 | banner gating browser check |
| Publication rules | publish-gate unit path | trigger battery (publish gate, reviewer stamp) | #16 reject-and-resubmit loop trial |
| Species knowledge system (objective 2) | none | S2-11 zero-row probe | web tour screenshots, officer CRUD trials |
| IoT (objective 4) | 7 pipeline tests | 2 summariser tests | hardware path excluded, #48 #49 |
| Data integrity | revision-checked edit | duplicate probes in batteries | #43 no-duplicate re-sync |

## 3. Measured result against the stated target

Backend behaviour coverage of the defined denominator: every one of the 11 tables, all 41 policies grouped by their role patterns, all 5 functions and 4 triggers is exercised by at least one dated check. As of 2 November 2026 this includes a committed pgTAP battery, backend/tests/local/rls_battery.sql, run by backend/tests/local/run.sh against a dockerised Postgres 17 with the real migrations applied from zero, 29 assertions covering the anon surface, botanist ownership, officer review limits, the publish gate, conflict-report rules and storage policies, all passing. The live-project batteries (policy, trigger, conflict, R7) additionally prove the same behaviours against the deployed database.

Mobile sync: the compare-and-swap helper carries 100% line, branch and function coverage from its own suite, the owner-scoping store queries carry 7 committed behaviour tests (push filter, unsynced count, adoption once, steal guard, queue order), and the full loop is device-proven across three dated trials. The remaining screens and db.ts surface have no line coverage, excluded honestly.

The web surface gained a committed runner on 2 November 2026, npm test in web/ executes 9 node:test suites over the telemetry helpers and the data-layer fallback contract, and the mobile suite carries 11 tests. The proposal's greater-than-80% wording is therefore met in behaviour terms on backend API, mobile sync and the web data layer, with committed runners for all three; line-level instrumentation remains unmeasured, and the final report should state exactly that rather than quote a bare percentage.

## 4. Prioritised missing tests (criterion 3)

1. Web component and route tests beyond the data layer (the runner now exists, npm test, extending it to page-level checks is now cheap).
2. Publication-rule negative tests beyond the trigger battery and the pgTAP gate check, specifically bulk publish attempts.
3. IoT payload validation tests for malformed readings before insertion (lane owner's call, #45 to #47 adjacent).

## 5. Failures and retests, retained (criterion 4)

The raw results include the honest failure trail: two battery scripts initially misreported, a missing on_conflict parameter and stale record ids after cascade cleanup, both script defects found by the batteries themselves and fixed with retests green, an app_meta table error surfaced by a stale module cache during device work and repaired by the repair-on-open pattern, and a wrong override version attempt during dependency work, caught by re-audit before any commit. Every retained output shows the passing retest state. The R7 dashboard battery output is dated 1 November and retained in [Evidence/issue-54/r7_dashboard_output.txt](Evidence/issue-54/r7_dashboard_output.txt), copied from the #21 completion thread.
