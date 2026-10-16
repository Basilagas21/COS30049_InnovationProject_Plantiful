# Security assessment evidence collection

Use this checklist alongside `Security_Assessment_Report.md`. Keep the original, dated tool output under `Docs/Reports/evidence/` locally (the directory is gitignored); copy the selected redacted artifacts into the final submission package. Do not substitute screenshots of prose claims for test output. Record tester, date/time, target URL/project, build or commit, command/options, account role, expected result, observed result, and evidence filename in a small index beside the files.

## Collect these screenshots and raw outputs

| Check | Screenshot to capture | Raw artifact / result to retain |
|---|---|---|
| ZAP anonymous and officer baseline + re-scan | ZAP target/context, scan time, alert totals/severity and a representative finding before/after | Original ZAP HTML/JSON reports and scan configuration for each authenticated/anonymous run; list excluded routes and whether spider/active scan was used. |
| Anonymous, botanist, officer/admin RLS | SQL Editor verdicts and policy matrix showing actual role-specific allowed/blocked reads/writes | Full output of `backend/scripts/verify_public_write_block.sql` and `verify_record_photo_write.sql`; note scripts that skip absent fixtures, plus any role-specific manual probes. Test botanist A's access to botanist B's row and approval/publish denial. |
| Storage and secrets | Bucket visibility and object policy screen (`reports` private), a representative denied anonymous request | SQL policy export, denied response/status, redacted built-client check showing no `service_role`; never photograph actual keys, JWTs, emails or sensitive GPS. |
| Web headers and route errors | Browser network tab for CSP/frame/nosniff headers and invalid record-id 404 | Saved HTTP response headers/status before and after remediation and the matching ZAP alert comparison. |
| Build and dependency audit | Terminal totals and dates for web/mobile checks and package audit | Untruncated `tsc`, lint, web build and `npm audit --omit=dev --audit-level=high` output for each app, with lockfile revision and any remaining findings. |
| Offline edit race | Two same-owner devices' local record revisions, sync conflict status, review dialog and resolved retry; cross-owner edit denied | Dated local `acceptance_measurements` rows, server record `record_id`/`version` (redacted), observed conditional-update result, and RLS denied request. Repeat after changing the server again between review and retry. |
| IoT integration (only after physical test) | ESP32 serial reading, bridge receipt, Supabase sensor row and officer `/alerts` view | Timestamped serial/bridge output, matching reading ID, evaluator output and alert ID. State whether data was simulated or physical; do not report MQTT/GPS or alert latency before verified. |

Redact secrets, authentication tokens, full locations of sensitive plants, and personal details **in copies**; preserve unmodified originals in restricted local storage. Update report counts and finding statuses to match the final re-test rather than inheriting earlier October results. Capture failures too and link each to remediation/re-test evidence. This is prototype test evidence, not a certification.
