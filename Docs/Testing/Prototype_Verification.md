# Prototype verification record

This is an as-built test plan and a record of checks run locally on 16 October 2026. Keep the untruncated terminal output and device/server evidence separately when preparing the final results. A local pass is not a physical hardware or live Supabase pass.

## Test environment and definition of done

- Windows development host; mobile Expo SDK 57 / React Native 0.86; web Next.js 16; Python 3.13; Node 24; pyserial 3.5. The only visible COM3/COM4 ports on this host were **Bluetooth serial links**, not an ESP32. No physical node or live project credentials were used for these checks.
- A prototype integration case passes only when the same test record/reading can be identified at each step, expected RLS decisions hold, and any failures leave a recoverable local copy. Log date, tester, build, device, account role, sample size, expected/actual result and matching redacted artifact.
- Source-only automated tests cannot establish a QR speed result, sync success rate, five-person usability result or live IoT alert timing. Those require measured trials on devices and the live demo environment.

## Local automated checks — observed

| Area | Command | Observed 16 Oct 2026 | Scope |
|---|---|---|---|
| Mobile typing | `cd mobile; npx tsc --noEmit` | PASS | Static typecheck |
| Mobile lint | `cd mobile; npx expo lint` | PASS | Source lint |
| Revision-checked edit | `cd mobile; npm run test:coverage` | PASS, 3 tests; 100% **of `sync-edit.ts` only** | Two-device stale update, unknown revision/other owner, server error |
| Mobile owner-scoping | `cd mobile; npm test` | PASS, 11 tests (2 November 2026) | Adds 7 owner-scoping behaviour tests: push filter, counts, legacy adoption, steal guard, queue order |
| Measurement summarizer | `python -m unittest discover -s mobile/scripts -p 'test_*.py'` | PASS, 2 tests | Retries/denominators and zero samples |
| IoT bridge/evaluator | `python -m unittest discover -s iot -p 'test_*.py'` | PASS, 7 tests | Host timestamp, ingestion, immediate alert/cooldown, invalid node IDs, empty-window silence, alert retry, severity |
| Web typing | `cd web; npx tsc --noEmit` | PASS | Static typecheck |
| Web lint | `cd web; npm run lint` | PASS with one existing `<img>` optimisation warning in `records/[id]/page.tsx` | Source lint |
| Web production | `cd web; npm run build` | PASS | Compiles routes; no live request verification |
| Web unit | `cd web; npm test` | PASS, 26 tests (2 November 2026) | Telemetry, data-layer fallback, live-query branches via a local stub server, API route gates and officer-gated component markup |
| Web browser flows | `cd web; npm run test:e2e` | PASS, 7 tests (2 November 2026) | Playwright on system Chrome: sign-in, officer approve, reject with reason, botanist role gate, visitor explore, species create through the form with detail navigation, non-officer page guard; disposable data, zero residue |
| Backend pgTAP | `backend/tests/local/run.sh` | PASS, 34 assertions (2 November 2026) | RLS, triggers, publish gate including bulk publish and republish-after-rejection, conflict rules, storage policies on a fresh Postgres 17 with the real migrations |

## Integration test cases — not yet observed

1. **Live SQL and RLS:** apply the consolidated migration and updated reviewer function in a test Supabase project. As anonymous, botanist A, botanist B and officer, record allowed/denied reads/writes, bucket visibility, publish and approval restrictions. Keep full backend verification-script output; record any skipped fixture.
2. **Offline capture and idempotent push:** on a device, capture tag, GPS fields and photo offline; confirm local display; reconnect and sync. Check the same `record_id`/`device_id`, one remote record, correct photo bytes, no duplicate after deliberate interrupted/retried upload. Record every sync attempt in `acceptance_measurements`.
3. **Competing same-owner edits:** sign in as the *same owner* on two devices and import one record. Edit both offline; sync A then B. B must show a conflict and preserve its copy. Compare every field, keep B's edit, sync and check server revision increments. Repeat with another intervening edit; B must conflict again. Repeat a write as a *different botanist* and confirm RLS denies it.
4. **Offline QR timing:** pre-cache a record and scan repeatedly without network. Export `plantiful.db`, run `python mobile/scripts/summarize_acceptance.py path/to/plantiful.db --raw path/to/events.csv`, retain test conditions, count and average; note the timer starts at the decoder callback, not when a person points the camera.
5. **Officer/public workflow:** approve/reject submitted captures as an officer, verify botanist review status, public-only approved visibility, and ensure an edited approved record returns to pending for re-review. Verify CSV/PDF exports and sensitive-role access.
6. **Physical sensor:** attach the ESP32 on a real USB serial port, confirm 3.3 V sensor outputs and matching pin definitions, close Arduino Serial Monitor, run the bridge and note one reading ID and host UTC time. Trigger a calibrated threshold or movement event; confirm the same sensor's alert and officer dashboard. Run the periodic evaluator for silence; verify cooldown and log elapsed times. No GPS module is present: use registered fixed coordinates. Keep service-role credentials only on the trusted host.
7. **Security and usability:** repeat final ZAP/RLS/storage tests against the deployed build using the [security evidence index](../README.md#security-evidence) and the [security plan](../Security/01_Security_Plan.md), then conduct the five-user walkthrough. Report actual coverage over the requested scope, not the isolated helper's percentage.

After the integrated trials, record counts and root causes for failed cases before making any final performance or security claims. The historical Sprint 1 report is a separate later activity.

## Offline-then-reconnect end-to-end test (#23) — observed 31 October 2026

Tester: Maq. Environment: real iPhone with Expo Go (SDK 58), app served from a GitHub Codespace (`npx expo start --tunnel ngrok`), web app run with `npm run dev` in the same Codespace, live Supabase project. Revision: `main` @ `8ce612e`. Accounts: botanist `maqbotanist1@test.com`, conservation officer `maqofficer@test.com`. Screenshots are in [Evidence/issue-23](Evidence/issue-23/).

| # | Step | Expected | Observed | Result | Evidence |
|---|---|---|---|---|---|
| 1 | Capture `Test 23 - plant 1` to `plant 4` with GPS and a photo while offline | Records kept locally, not uploaded | Plant 1 uploaded because Wi-Fi was still on when Sync was pressed. Plants 2 and 3 were captured in Airplane mode; the sync attempt failed with a readable "Internet connection appears to be offline" error and the records stayed on the device. Plant 4 was captured in Airplane mode and stayed Pending. | PASS (3 offline records) | 01, 02 |
| 2 | Fully close and reopen the app | Unsynced records and photos still present | Plants 2, 3 (Failed) and 4 (Pending) still listed with photos after restart. Expo Go needs network to load the dev bundle, so the phone was online on reopen; the app does not sync until **Sync now** is pressed. | PASS | 03 |
| 3 | Reconnect and press **Sync now** | All unsynced records upload | 0 pending, 4 synced, 0 failed | PASS | 04 |
| 4 | Press **Sync now** again | No new uploads | Run counters 0 / 0 / 0; list unchanged | PASS | 05 |
| 5 | Duplicate and photo check in Supabase (SQL below) | One row and one photo per record | 4 rows, each `records = 1`, `photos = 1` | PASS | 06 |
| 6 | Officer opens web Records list | 4 records Pending with photo and GPS | All 4 shown Pending with photo and coordinates | PASS | 07 |
| 7 | Officer approves all 4 | Status Approved | All 4 Approved | PASS | 08 |
| 8 | Phone syncs again and opens a record | Approval visible on phone | Records show Synced; record detail for plant 1 shows **Approved** | PASS | 09, 10, 11 |

Duplicate check used in step 5:

```sql
select r.provisional_name,
       count(distinct r.record_id) as records,
       count(p.*) as photos
from plant_records r
left join plant_record_photos p on p.record_id = r.record_id
where r.provisional_name like 'Test 23%'
group by r.provisional_name
order by 1;
```

The in-app acceptance panel reported "Sync success: 4/8 attempts (50.0%)" after this run, because the deliberate offline attempts count as failed attempts. This run is not a sync success-rate measurement; that belongs to #40.

## Dependency remediation and SDK 58 verification (#43) — observed 1 to 2 November 2026

Environment: Google Pixel 9 Pro XL (Android 17) with Expo Go (SDK 58), app served from a workstation (`npx expo start`), web app run with `npm run dev`, live Supabase project. Tested revision: `main` @ `9a4d99b` (expo 58.0.22, @expo/cli 58.1.18, overrides pinning shell-quote 1.12.0, zod 4.6.7, glob 14.0.2 and minimatch 11.0.3).

Audits, dated, before and after the remediation:

| App | Before | After | Residual |
|---|---|---|---|
| web (Next.js 16.4.3) | production 0; dev-only moderate entries in eslint tooling | zero, full and production audits, after a minimatch override on 2 November | none |
| mobile (Expo SDK 58) | critical 1, high 2, moderate 21, low 1 | critical 0, high 0, moderate 0, low 0 | none, `npm audit` reports zero |

Reachability and remediation decisions: the critical `shell-quote` advisory and the high `zod` advisory were reachable only through dev dependencies, `@expo/cli` and `eslint-plugin-react-hooks`, never in code that runs on the device or in the browser bundle; both were remediated by raising expo within the SDK 58 line and pinning patched versions with npm overrides, no downgrade, per the issue rule. The remaining moderate advisories resolved to two distinct issues, a `minimatch` denial-of-service and a `glob` cancellation-bypass, both transitive build-tooling dependencies, remediated by the same override mechanism at patched versions; the toolchain was re-verified after the pins, type check, lint, unit tests, Metro Android bundle and the device session all pass with the overrides in place.

| # | Step | Expected | Observed | Result |
|---|---|---|---|---|
| 1 | Capture on the phone: name, GPS, photo, save | Camera, location and photo flows work on the new build | Tag screen saved "S2-01 pass plant" with photo attached and GPS fix with accuracy estimate | PASS |
| 2 | Force-stop Expo Go and cold relaunch | Session and unsynced data survive | App reopened signed in, record present in My records still Pending | PASS |
| 3 | Sync now, then again | Upload lands, no duplicate | One server row with tag, photo stored as a valid 83 KB JPEG under the owner folder; second press created nothing new | PASS |
| 4 | Scan the record's QR tag on the Capture tab | Decoder opens the synced record | Camera decoded the tag and opened the record detail directly | PASS |
| 5 | Web after the upgrade: sign-in, officer view, public gating, reports | No regression from the dependency work (web untouched at 16.4.3) | Officer sign-in, record list, conflict banner path and reports page all rendered; R7 anonymous battery re-run green on the same day | PASS |
| 6 | Automated checks linked to the tested revision | tsc, lint, unit tests, Metro build | All green at `9a4d99b`; Metro compiled the full Android bundle on the new expo with the overrides in place | PASS |

Local checks are as above; deployment verification against a hosted build has not been performed and is not claimed.

## Two-device offline sync and conflict test (#39) — observed 1 November 2026

Environment: Google Pixel 9 Pro XL (Android 17) with Expo Go (SDK 58), app served from a workstation (`npx expo start`), web app run with `npm run dev`, live Supabase project. Revision: `main` @ `73278e8` plus this document's commit. Accounts: botanist `dld@botanist.com` on the phone; the second client was a scripted session using the same botanist credentials and the same REST update path the app uses. The conflict mechanism is the `plant_records.version` compare-and-swap on the server row, so the second client's transport does not affect what is proven; the method is stated here rather than claiming two physical devices.

| # | Step | Expected | Observed | Result | Evidence |
|---|---|---|---|---|---|
| 1 | Capture `Conflict test plant` on the phone and press **Sync now** | Record reaches Supabase as pending, version 1 | Row present with `approval_status = pending`, `version = 1` | PASS | server query |
| 2 | Second client edits the row (notes, height) and bumps version to 2 | Server diverges from the phone's baseline | `version = 2`, notes and height changed server-side only | PASS | server query |
| 3 | Edit the record on the phone (height 42, notes "Phone edit") and press **Sync now** | Compare-and-swap fails, conflict filed, local edit preserved | Push refused, record entered conflict state, `sync_conflicts` row visible to the botanist and the officer, message "The server record changed since this device last synced…" | PASS | server query |
| 4 | Open the conflict review screen | Every differing field offers server value versus local value | Per-field merge rows shown for all differing fields, defaults to the local copy | PASS | phone |
| 5 | Pick values, save merged, press **Sync now** | Merged record pushes, version bumps, conflict report clears | Server at `version = 3` with height 42 and notes "Phone edit"; report row gone for both accounts | PASS | server query |
| 6 | Repeat cycle: second client bumps to version 4 with a morphology change; phone edits and syncs | Conflict fires again | Report row live again (`server_version = 3`, unique per record and device) | PASS | server query |
| 7 | Officer opens the record on the web while the conflict is unresolved | Banner visible to officer only | "Unresolved sync conflict" banner shown to `dld@officer.com`; botanist page renders without the banner; anonymous sees neither banner nor record content | PASS | 01 |
| 8 | Resolve and resync on the phone | Server merged, report cleared | Server at `version = 5`, morphology kept the server value, height and notes kept the phone picks; report gone for botanist and officer; zero residue | PASS | server query |
| 9 | Cross-owner write as a different botanist | Rejected by RLS | Probed directly against the live policies with the second botanist account (`dld2@botanist.com`): cross-owner conflict filing returned 403, and the app cannot generate the scenario locally because its store only holds the signed-in owner's records; the REST probe is the correct test of the RLS layer | PASS | probe output |

Acceptance note: conflicts count against the in-app Sync success metric by design, the raw acceptance log keeps `synced`, `conflict` and `failed` as distinct outcomes, and the Sync tab now shows the breakdown beside the headline. This run is not a sync success-rate measurement; that belongs to #40.

### Demo steps (client demo)

1. Sign in on the phone as a botanist while online.
2. Turn on Airplane mode. Capture a plant with tag, GPS and photo. Show it as Pending on the Sync tab.
3. Close and reopen the app to show the record is kept on the device.
4. Turn Airplane mode off and press **Sync now**. Press it again to show nothing is uploaded twice.
5. On the web app, sign in as a conservation officer, open Records and approve the new plant.
6. On the phone, press **Sync now** and open the record to show the **Approved** badge.

Setup notes for Codespaces with Expo SDK 58: sign in with `npx expo login -u <user> -p <password>` (the browser sign-in cannot reach the Codespace), use `npx expo start --tunnel ngrok` (the default tunnel failed with `s.WebSocket is not a constructor`), and open the web app through the forwarded `-3000.app.github.dev` address rather than `localhost`.
