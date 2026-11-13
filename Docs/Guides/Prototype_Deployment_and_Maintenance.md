# Prototype deployment and maintenance

## What runs where

Supabase hosts authentication, PostgreSQL tables, storage buckets and row-level access rules. The Expo mobile app stores captures locally in SQLite, each stamped with the signed-in botanist account, and pushes them when that account chooses **Sync now**. The Next.js web app reads the same database for officers and the public visitor portal. The USB-first IoT prototype has an ESP32 on a host computer; `iot/bridge.py` sends readings to Supabase and immediately checks each stored reading for heat, low humidity and movement alerts. Run `iot/evaluate.py` periodically to catch silent sensors and retry failed alert evaluations. The `/alerts` dashboard displays stored readings and alerts. The physical end-to-end path is still to be verified; MQTT is future work.

## Set up a demonstration

1. Create a Supabase project. Apply `backend/supabase/migrations/001_schema.sql` on a fresh project, then the **current** `backend/supabase/migrations/apply_project.sql` in Dashboard SQL Editor. On an existing project re-run the consolidated script and confirm the live trigger `stamp_reviewer` clears prior review on owner resubmission. The migrations folder is local-only under the repository ignore rule; include the actual SQL separately in the team's deployment handover. Check live columns for record attributes and `sensor_readings.soil_moisture`/`rain`.
2. Create test accounts and assign botanist, conservation officer and admin roles as described in `backend/README.md`. Verify RLS and storage policies using the backend verification scripts; keep the dated output. Use test records without sensitive real-world coordinates.
3. Configure the public Supabase URL and **anon/publishable** key for `mobile` and `web` (their READMEs describe environment variables). Run the mobile app with Expo and the web app with its project scripts. Host the Next.js production build on a suitable web host for an externally accessible demo; point both apps to the same Supabase project. Do not ship `SUPABASE_SERVICE_ROLE_KEY` in web client or mobile bundles.
4. For the hardware demo only, flash `iot/sketch_oct9a/sketch_oct9a.ino`, wire sensors per `iot/README.md` and connect the ESP32 by USB. Run `iot/bridge.py` on a trusted host with the service-role key stored in host environment variables; schedule `iot/evaluate.py` separately for missing-sensor checks. Set the registered fixed sensor coordinates for its installation location; the kit has no GPS module. Do not open Arduino Serial Monitor and the bridge on the same COM port. Verify an actual reading and alert in Supabase and `/alerts` before describing this path as integrated.

## Keep the prototype operating

- **Each demonstration:** check auth, storage/RLS, mobile offline capture and sync, web approvals, and retained dated acceptance measurements. Resolve sync conflicts on the owner device after comparing server and local values; a conflicting record stays local until reviewed. Preserve a database backup/export before schema changes.
- **Weekly during active use:** review failed syncs and stale local conflicts, Supabase storage/quota, bridge logs, sensor power/wiring and evaluator execution; check the report and security evidence index for newly introduced findings. Calibrate analog soil/rain thresholds against observed dry/wet conditions before relying on alert semantics.
- **At release or dependency updates:** run mobile typecheck/lint and web typecheck/lint/build, repeat role/RLS and photo policy probes, and re-check dependency advisories. Apply SQL first in a test project, then the demo project; retain migration version and rollback/export notes. Rotate exposed keys and revoke unused demo accounts. Keep the service-role key only on the trusted host.
- **For operational continuity:** document actual host URL, project ownership, migration version, named operational contacts, backup/restore procedure, sensor installation coordinates and outstanding defects. This is a proportionate student prototype runbook, not an organisational service-level or security certification.

### Account switching on a shared device

The mobile app binds every local capture to the account that created it, so one device can serve several botanists without misattributing field data:

- Each capture is stamped with the signed-in user's id at creation, and the central database owner is taken from that same stamp at push time.
- Sync pushes, the Sync tab lists, the sign-out warning, the My records list and the acceptance measurements are all scoped to the signed-in account. Another account signing in on the same device sees none of it and cannot upload it.
- A capture made by botanist A and left unsynced stays on the device pending until A signs in again and syncs; botanist B's **Sync now** will not carry it.
- Captures made before owner stamping existed are adopted once by the first account to open the Sync tab after upgrading, matching the single-user device that produced them; the adoption happens a single time and cannot repeat for another account.
- Last-sync time and the outcome breakdown (synced, conflicts, failed) are per account; a fresh account on a used device correctly reports "Last sync: never" until it syncs.

Verified on a Google Pixel 9 Pro XL with Expo Go on 1 November 2026: capture pending under one botanist, signed out, signed in as a second botanist, sync ran with nothing uploaded and the record absent from the second account's lists, signed back in as the first, the record pushed under the correct owner.

## Measurement evidence

The mobile **Sync centre** displays `synced / attempted record pushes` (failed and conflicting attempts count in the denominator; retries are separate attempts) and the average and under-five-second fraction for locally cached QR lookups. Both use dated rows in local SQLite table `acceptance_measurements` (latest 1,000 used in the screen summary). The timer starts when the QR decoder hands a tag to the app, so it does not measure the camera's time to recognise a tag or the user's navigation. Copy the test device's `plantiful.db` using development-device tooling and run `python mobile/scripts/summarize_acceptance.py path/to/plantiful.db --raw path/to/events.csv` to calculate the **full** database's denominators and export its original dated events. Store test date, device, build and network mode alongside the CSV; do not treat a zero-sample fraction as passing evidence. Run the script separately per device/trial if those conditions differ. Run `npm run test:coverage` in `mobile/` with Node 24 for the isolated revision-checked edit helper; its coverage applies **only to that helper**, not the full mobile sync flow or the proposed >80% backend/mobile coverage target. For the five-user walkthrough, keep consent-appropriate anonymised task completion/timing notes and participant count. These results have not yet been collected here.

## Decisions recorded

- **Sync wording.** The shipped behaviour is user-initiated **Sync now**, which satisfies the official scope ("synchronize ... whenever internet connectivity becomes available"). Foreground auto-sync was considered and declined: it entangles the acceptance-metric denominator of #40 and reopens the sync loop in the freeze window. The final report should describe the shipped behaviour; a future owner can add auto-sync deliberately.
- **Officer observation delete.** Dropped from live RLS on 31 October; deletion is an admin data-hygiene action. The `rejection_reason` column on `plant_records` was added on the live project during #16 and is now in the reference `apply_project.sql`, so a fresh rebuild reproduces the live shape and the pgTAP battery proves it from zero.

## Security scanning (issue-53)

Four ZAP runs (official stable image, API-driven daemon) against a LOCAL clone, never the live project: anonymous and officer-authenticated contexts, baseline plus full active scans. Zero High and zero injection findings; the only Mediums are the CSP unsafe-inline allowances (R-09, scanner-justified deferral). The reproducible method and its traps are in the [scan procedure](../Testing/Evidence/issue-53/zap_scan_procedure.md); redacted reports are alongside it.

## Verification gotchas

Hard-won traps, so nobody rediscovers them:

- PostgREST upserts via raw REST need `?on_conflict=col1,col2` in the URL; `Prefer: resolution=merge-duplicates` alone returns 409.
- Battery scripts must resolve record ids at runtime; stored probe ids go stale after cascade-delete tests.
- RLS asymmetry: an UPDATE or DELETE whose USING filter matches nothing affects zero rows silently; a WITH CHECK violation raises 42501. Assert row counts or wrap in `lives_ok`; never assume a silent statement did something.
- Playwright flows must resolve created rows over REST before asserting on the UI, so a failed UI assertion still leaves cleanup an id to delete. Dev-mode route compilation is slow: wait on content, not navigation events.
- Every e2e row carries a per-run unique id (a RUN_ID timestamp suffix on the probe name, hashed into the QR code); deterministic names make leftovers of a crashed run collide with the next insert. Interpolation needs BACKTICKS: with double quotes the literal text 'RUN_ID' is written to the database instead. After editing e2e name templates, grep for `${` and confirm backticks, then run the suite twice cold.
- Storage DELETE calls must not send a Content-Type header with an empty body; the API rejects that with a confusing 400 that looks like a policy block.
- Bucket MIME and size caps are not echoed by the bucket-config GET; verify behaviourally via a wrong-MIME upload expecting 415. Dashboard UPDATEs without RETURNING print "no rows returned" even when they worked; verify by read-back, never assume either way.
- expo-sqlite has no web build, so mobile store logic is verified by running the same SQL against Node's built-in SQLite (the owner-scoping suite).

## Test runners

- `backend/tests/local/run.sh`: pgTAP battery, 41 assertions, dockerised Postgres 17, applies the reference migrations from zero. Needs Docker; the container is created per run and reaped on exit by an ERR-safe trap including its anonymous volume, zero residue on success and on injected failure alike.
- `web npm test` and `test:coverage`: plain Node, zero new runtime dependencies beyond tsx as dev tooling.
- `web npm run test:e2e`: Playwright on the system Chrome via `executablePath`, no browser download; override with `PW_EXECUTABLE`. Disposable data, zero residue verified.
- `mobile npm test`: the owner-scoping behaviour suite plus the merged qr-lookup suite.

## Test accounts and dependency posture

Test accounts on the live project: `dld@botanist.com`, `dld2@botanist.com`, `dld@officer.com`, `dld@admin.com`. The password lives in the gitignored `web/.env` under `E2E_TEST_PASSWORD`; the shared loader `web/tests/e2e/env.ts` reads `web/.env` first and falls back to legacy `web/.env.local` so older checkouts keep working. Rotate or revoke via #41. Both apps report zero npm audit vulnerabilities after patched-version overrides (mobile pins shell-quote 1.12.0, zod 4.6.7, glob 14.0.2 and minimatch 11.0.3; web pins minimatch 11.0.3). If an install complains about glob resolution, the overrides block in package.json is the place to look.

## Mobile UI conventions

Pills radius 999, buttons 24, cards 26 via surfaces; page padding 16, gaps 12; section titles 14, page titles 20, 22 and 28 by role; search bars height 50 on the wrapper; header hairline `colors.sand`; tab bar separated by shape not line; scheme-aware scroll indicators. British spelling throughout, "catalogue" with ue.
