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
7. **Security and usability:** repeat final ZAP/RLS/storage tests against the deployed build using `Docs/Reports/SECURITY_EVIDENCE_README.md`, then conduct the five-user walkthrough. Report actual coverage over the requested scope, not the isolated helper's percentage.

After the integrated trials, record counts and root causes for failed cases before making any final performance or security claims. The historical Sprint 1 report is a separate later activity.
