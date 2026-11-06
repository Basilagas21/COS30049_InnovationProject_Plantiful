# Sprint 2 security evidence

This folder holds submission-safe extracts from the Plantiful security assessment. The full raw evidence remains in the ignored local security pack at `Docs/Security/Evidence/`. Do not commit credentials, session cookies, participant details or sensitive plant locations here.

The extracts support Section 8 of the [Sprint 2 report](../../Reports/Sprint2/Sprint_Report_2.md). They cover the cybersecurity and data protection scope block and the application security aspect. They are not a new certification and they do not replace the full assessment report.

## Evidence index

| ID | Claim supported | Date | File | Limitation |
|---|---|---|---|---|
| EV-SEC-01 | Live RLS and storage policy verification returned PASS for the executable checks and recorded data-dependent probes as SKIP | 10 October 2026 | [RLS and storage summary](evidence/S2-SEC-01-rls-storage-2026-10-10.md) | Live schema at that date. Re-run after the final migration state |
| EV-SEC-02 | SSDLC activities, tools, scope, owners and gates are defined before testing | 27 October 2026 | [Security plan](../../Security/01_Security_Plan.md), [assessment report](../../Security/02_Assessment_Report.md) | Local-only supporting documents. The plan is not proof of execution by itself |
| EV-SEC-03 | OWASP ZAP passive scans found no High alerts and verified the header and error-handling fixes | 10 October 2026 | [ZAP summary](evidence/S2-SEC-03-zap-2026-10-10.md), [header capture](evidence/S2-SEC-03-headers-2026-10-09.md) | Passive scan only. Last run before the final Sprint 2 code state |
| EV-SEC-04 | Production dependency audits on 6 November 2026 reported zero advisories for web and mobile | 6 November 2026 | [Web audit](evidence/S2-AUD-WEB-2026-11-06.json), [mobile audit](evidence/S2-AUD-MOB-2026-11-06.json) | Audit output describes the lockfiles in the working tree. Recurring scanning is still open |
| EV-SEC-05 | Anonymous probes did not demonstrate a usable public write path | 10 October 2026 | [Anonymous probe summary](evidence/S2-SEC-03-anon-probes-2026-10-10.md) | One ambiguous PATCH response is excluded from the pass claim. The SQL policy audit is authoritative |
| EV-SEC-06 | Current static checks and automated tests pass, with recorded build and Expo dependency limitations | 6 November 2026 | [Check log](evidence/S2-CHECKS-2026-11-06.md) | Web build rerun was blocked by host memory. Expo Doctor reported five version mismatches |
| EV-SEC-07 | Tracked code does not contain a client-side service-role secret, and no environment file is tracked | 6 November 2026 | [Bundle and secret check](evidence/S2-SEC-05-bundle-secret-2026-11-06.md) | Source review, not a full native binary inspection |
| EV-SEC-08 | A stored private IP disclosure in test data was removed and the affected pages were rechecked | 10 October 2026 | [Private IP resolution](evidence/S2-SEC-03-private-ip-2026-10-10.md) | Field removal from the public query remains open as R-10 |

## What the evidence supports

- Authentication uses Supabase Auth. Web sessions use `@supabase/ssr` cookies. Mobile sessions use AsyncStorage with auto-refresh.
- Authorisation is enforced in PostgreSQL through row-level security and storage policies. Client-side filters are defence in depth.
- Anonymous access is limited to approved and submitted observations and published species. The reports bucket is private.
- The browser and mobile clients use the publishable key. The service role is used only in server or trusted-host code.
- Transport uses HTTPS. Cloud data at rest relies on platform-managed encryption. The project does not implement column-level encryption or encrypted mobile SQLite.
- The assessment found 12 issues. Eleven were fixed and one has a defined mitigation. No confirmed critical or high issue remained in application code at the 10 October 2026 close.
- The 6 November 2026 dependency audits report zero advisories for both production trees.

## What the evidence does not prove

- It does not prove that the final deployed schema matches the tested schema.
- It does not prove that the final deployment still has every expected RLS and storage policy.
- It does not prove that the current deployment has been scanned with ZAP.
- It does not prove that the web production build completes on this host. The rerun ran out of memory.
- It does not prove that mobile version mismatches are harmless.
- It does not prove that local mobile storage is encrypted.
- It does not prove that the exposed credential has been revoked or that the affected accounts have been reset.
- It does not establish compliance with a data protection statute or certification scheme.
- It does not replace an active vulnerability scan, native binary inspection or physical-device security test.

## Reproduction commands

```powershell
# Web
npx tsc --noEmit
npm run lint
npm test
npm run build
npm audit --omit=dev --json

# Mobile
npx tsc --noEmit
npm run lint
npm test
npx expo-doctor
npm audit --omit=dev --json
```

Live RLS and ZAP checks require the deployed schema and a controlled web deployment. Use the commands and scope in the [security plan](../../Security/01_Security_Plan.md) and [evidence guide](../../Security/04_Evidence_Guide.md). Record the actual release revision, date, target and result.

## Redaction record

- Private addresses are replaced with `[REDACTED_PRIVATE_IP]`.
- Fixture user and record identifiers are removed from the submission-safe summaries.
- The Supabase project reference in the header capture is replaced with `<project-ref>`.
- No passwords, cookies, tokens, service keys, email addresses or personal names are included.
- The raw files in `Docs/Security/Evidence/` are unchanged and remain local only.

## Current status

The security section is suitable for submission as an honest Sprint 2 position. The remaining release actions are:

1. Re-run the RLS and storage verification against the final deployed schema.
2. Re-run ZAP against the final web deployment or record the scan as not completed.
3. Confirm credential rotation and account recovery.
4. Record the final release revision and the build limitation.
5. Confirm the dispositions for R-03 and R-06 to R-10.
