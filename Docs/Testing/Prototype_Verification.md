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
| Measurement summarizer | `python -m unittest discover -s mobile/scripts -p 'test_*.py'` | PASS, 2 tests | Retries/denominators and zero samples |
| IoT bridge/evaluator | `python -m unittest discover -s iot -p 'test_*.py'` | PASS, 7 tests | Host timestamp, ingestion, immediate alert/cooldown, invalid node IDs, empty-window silence, alert retry, severity |
| Web typing | `cd web; npx tsc --noEmit` | PASS | Static typecheck |
| Web lint | `cd web; npm run lint` | PASS with one existing `<img>` optimisation warning in `records/[id]/page.tsx` | Source lint |
| Web production | `cd web; npm run build` | PASS | Compiles routes; no live request verification |

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

### Demo steps (client demo)

1. Sign in on the phone as a botanist while online.
2. Turn on Airplane mode. Capture a plant with tag, GPS and photo. Show it as Pending on the Sync tab.
3. Close and reopen the app to show the record is kept on the device.
4. Turn Airplane mode off and press **Sync now**. Press it again to show nothing is uploaded twice.
5. On the web app, sign in as a conservation officer, open Records and approve the new plant.
6. On the phone, press **Sync now** and open the record to show the **Approved** badge.

Setup notes for Codespaces with Expo SDK 58: sign in with `npx expo login -u <user> -p <password>` (the browser sign-in cannot reach the Codespace), use `npx expo start --tunnel ngrok` (the default tunnel failed with `s.WebSocket is not a constructor`), and open the web app through the forwarded `-3000.app.github.dev` address rather than `localhost`.
