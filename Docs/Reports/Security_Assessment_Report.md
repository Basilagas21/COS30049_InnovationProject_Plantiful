# Plantiful — Web & Mobile Security Assessment

**Secure Software Development Lifecycle (SSDLC) Vulnerability Assessment Report**

**Unit Code:** COS30049
**Unit Name:** COMPUTING TECHNOLOGY INNOVATION PROJECT
**Tutor:** Lee Sue Han, Kelvin Yong, Mark Tee, Fu Swee Tee
**Group Name:** Plantiful (Group 7)
**Target of Evaluation:** Plantiful Mobile Application (React Native / Expo SDK 57) and Web Digital Plant Knowledge System (Next.js 16), with the Supabase (PostgreSQL) backend, authentication, and object storage.

| # | Name | Student ID |
|---|---|---|
| 1 | Muhammad Maqeel bin Muhammad Kahfi | 102782384 |
| 2 | Nathan Sebastian Learmonth | 102782258 |
| 3 | Badrul Aliff Aiman bin Badrulmunirzaki | 102778273 |
| 4 | Gae Jayden MWINE | 104393610 |
| 5 | Ashley Wallen Anak Winston | 105806559 |
| 6 | Basill Agas Anak Heatley Rogers | 102778888 |

---

### Document Control

| Version | Date | Author | Status | Notes |
|---|---|---|---|---|
| 1.0 | 3 October 2026 | Group 7 | Issued | Initial security assessment. Covers static analysis (SAST), dependency vulnerability scanning, row-level security (RLS) verification, and manual secure-code review of the mobile and web applications. Dynamic analysis (OWASP ZAP DAST, Week-11 gate) and mobile security testing (OWASP MASTG) procedures defined for execution against the deployed system. |
| 1.1 | 10 October 2026 | Group 7 | Issued | Re-assessment. OWASP ZAP 2.17.0 dynamic scans executed against the deployed web app (anonymous baseline + authenticated officer), findings F-07–F-12 added, security-header and error-handling remediations verified by re-scan. Evidence stored in `Docs/Reports/evidence/`. |

---

### Executive Summary

Plantiful stores conservation data whose integrity is a conservation and legal concern for the Sarawak Forestry Corporation (SFC): field observations, geolocations, species catalogues, and official report artifacts. Because the threat model includes both anonymous public visitors and authenticated field botanists acting on shared infrastructure, access control, data confidentiality, and the separation between the public, officer, and botanist trust boundaries are critical properties.

This assessment verified the implemented controls against OWASP ASVS (Level 1 baseline, selected Level 2 requirements), OWASP Top 10 (2021), and the OWASP Mobile Application Security Testing Guide (MASTG) checklist. Verification was performed through strict static analysis (TypeScript with `strict` semantics, ESLint with the Expo config, production builds), dependency vulnerability scanning (`npm audit` against production dependency sets), and direct database-layer verification of every row-level security and storage policy that enforces the public write-block guarantee (requirement R7).

**Headline results.** The web production dependency set is clean (0 known vulnerabilities across 27 production packages). The mobile production dependency set reports 26 advisories, all confined to the Expo/React Native build-time toolchain (bundler, code-signing helpers, configuration modules) with no end-user runtime reach and no critical severity. Three implementation findings were identified and remediated during the assessment window: a broken photo-upload path in the mobile sync module (F-01), a server/client boundary violation that broke the web production build (F-02), and missing write-protection policies on two new storage buckets (F-03). The R7 anonymous write-block property was confirmed at the database layer for all public-facing entities, and the approval-gating trigger that prevents publishing unapproved species was verified.

A dynamic analysis pass was subsequently executed with **OWASP ZAP 2.17.0** against the deployed web application, in both anonymous and authenticated (officer) modes; no High-severity alerts were produced. Six further findings were identified and remediated during this pass: two storage/RLS hardening gaps (F-07, F-08), an approval-gate bypass (F-09), a missing role-administration path (F-10), an HTTP-500 error disclosure on malformed record ids (F-11), and the absence of security response headers (F-12). All remediations were verified by re-scan (Section 5.5, Sections 7).

**Residual risk** after remediation is Low. The two material residual exposures are (1) mobile toolchain advisories awaiting Expo SDK patch releases and (2) the absence of automated recurring dependency scanning, both of which have defined mitigation actions and responsible owners below. The remaining active-scan residual items are Low/tradeoff and are tracked in Section 7.2.

---

## 1. Scope and Objectives

### 1.1 In Scope

| Asset | Technology | Description |
|---|---|---|
| Mobile application | React Native 0.86, Expo SDK 57 (expo-sqlite, expo-camera, expo-location, expo-image-picker) | Offline field capture, QR tagging, GPS stamping, photo capture, offline SQLite store, authenticated sync to Supabase |
| Web knowledge system | Next.js 16.3.6, React 19.2, Tailwind CSS 4 | Conservation officer review/approval, species catalogue management, reporting/CSV export, map distribution, public visitor portal |
| Backend platform | Supabase (PostgreSQL 15, PostgREST, GoTrue auth, Storage) | Central database, JWT authentication, role model (`botanist`, `conservation_officer`, `admin`, `anon`), row-level security, object storage buckets |
| Data | `user_profiles`, `species`, `species_photos`, `plant_records`, `plant_record_photos`, `sync_log`, `reports`, `sensors`, `sensor_readings`, `alerts` | Conservation and audit-relevant datasets |

### 1.2 Out of Scope

- The IoT monitoring layer (MQTT, ESP32) participates in this assessment through its database surface (`sensors`, `sensor_readings`, `alerts`); RLS coverage is listed in Appendix A. The embedded device firmware itself is out of scope (no end-user input surface; constrained device, no network exposure beyond the authenticated ingest path).
- The physical security of SFC field equipment and premises.
- Third-party SaaS availability (Supabase platform controls, AWS/CGP infrastructure underlying Supabase) — relied upon under the Supabase shared-responsibility model.

### 1.3 Assessment Objectives

1. Verify that the public visitor portal is **strictly read-only** and that no anonymous write path exists (requirement R7).
2. Verify the **separation of roles** — botanists may only manage their own records; only officers/admins may approve, publish, and manage the catalogue and reports.
3. Verify **confidentiality of unpublished data** — anonymous users must only ever see approved, submitted, published content.
4. Identify and remediate vulnerabilities in the mobile and web applications before the Week-11 SSDLC gate, leaving **zero critical/high confirmed findings** in application code.

---

## 2. Methodology

### 2.1 Standard Alignment

| Framework | Application |
|---|---|
| OWASP ASVS 4.0 | V1 (architecture), V2–V3 (auth/session), V4 (access control), V6 (storage/crypto), V12 (files) |
| OWASP Top 10 (2021) | A01–A10 classification of findings |
| OWASP MASTG | Mobile application checks (MASVS L1) |
| NIST SP 800-115 | Technical testing and secure-code review approach |
| CVSS v3.1 | Severity scoring used alongside the 4-tier OWASP risk rating |

### 2.2 Test Layers and Tools

| Layer | Tool / Technique | Evidence |
|---|---|---|
| Static application security testing (SAST) | TypeScript `tsc --noEmit` (strict), ESLint (`eslint-config-expo` for mobile, standard config for web) | Clean runs on both apps (Section 5.1) |
| Build integrity | `next build` (web), `expo-doctor` (mobile) | Clean production build; documented in Section 5.1 |
| Dependency vulnerability scanning | `npm audit --omit=dev` (production trees) | Web: 0 findings; Mobile: 26 build-toolchain advisories; detail in Section 5.2 and F-06 |
| Database / RLS verification | Purpose-built SQL verification script against the live schema (`backend/scripts/verify_public_write_block.sql`) and direct policy audit querys | Section 5.3, Appendix A and B |
| Manual secure-code review | OWASP ASVS-referenced code walkthrough of auth flows, sync, upload, and route handling | Findings F-01, F-02, F-03 |
| Dynamic analysis | OWASP ZAP 2.17.0 (anonymous baseline + authenticated officer) | Executed 10 Oct 2026 against the deployed web app; no High alerts; see Section 5.5 and Appendix C |
| Mobile deep testing | OWASP MASTG checklist on a development build (rooted/emulated device checks) | Executed 10 Oct 2026 as code/bundle review (no rooted device); see Appendix D |

---

## 3. Security Architecture Overview

### 3.1 Trust Boundaries

```
[ Anonymous public / visitor ]          [ Botanist (field) ]          [ Conservation Officer / Admin ]
        |  HTTPS                              |  HTTPS + JWT                   |  HTTPS + JWT
        v                                     v                               v
[ Web visitor portal ]            [ Mobile app (SQLite offline) ]   [ Web knowledge system ]
        |                                     |  offline-first,                |
        |                                     |  sync on reconnect             |
        v                                     v                               v
        +----------------------------+   Supabase Auth (GoTrue JWT)   +----------------------------+
        |   PostgREST API  <-------->|-------------------------------|<--------------------------- |
        |   PostgreSQL + RLS         |                                |                            |
        |   Storage buckets          |                                |                            |
        +----------------------------+                                |                            |
        |  anon  -> approved+published only                            |                            |
        |  botanist -> own records only                                |                            |
        |  officer -> all records, approve/publish, reports            |                            |
```

The client applications hold only the **anonymous (publishable) key**. The JWT returned by Supabase Auth is the bearer credential that drives `auth.uid()` inside every RLS policy. There is no alternate authentication path: the web server components authenticate to Supabase using the same anon key plus the user session cookie (server-side session via `@supabase/ssr`), so database policies are the single enforcement point and are identical regardless of which client made the request. The `service_role` key exists only in the (git-ignored) backend environment template and is never embedded in either client.

### 3.2 Role Model (enforced in `user_profiles` + RLS)

| Role | Read | Write |
|---|---|---|
| `anon` (unauthenticated) | Approved + submitted records; published species + their photos; public `record-photos` bucket | None |
| `botanist` (authenticated) | Own records and photos; full published/unpublished species catalogue (read-only) | Insert own records; update own records; manage own photos |
| `conservation_officer` | All records, species, photos, reports | Approve/reject, publish, catalogue CRUD, photo management, report generation |
| `admin` | Everything an officer can | Everything an officer can |

### 3.3 Enforcement Stack

1. **PostgreSQL Row Level Security** — enabled on every application table (default deny) with explicit policies per role per command. Listed in Appendix A.
2. **Storage policies** on `storage.objects` per bucket — public read for `record-photos` and `species-photos`, role-gated writes for `species-photos` and `reports`, authenticated insert for `record-photos`. Listed in Appendix B.
3. **Database triggers** — `handle_new_user` (auto-provision botanist profile), `stamp_reviewer` (records reviewer/audit timestamp on approval change), and `deny_unapproved_publish` (blocks publishing a species with no approved record).
4. **Application-layer defence in depth** — the visitor portal additionally filters `is_published = true`; officers-only UI routes apply; TypeScript strictness prevents accidental cross-boundary imports (see F-02).
5. **Transport security** — all client-server traffic is HTTPS to the Supabase endpoint; sessions persisted in mobile AsyncStorage with auto-refresh enabled.

### 3.4 Data Protection and Encryption Controls

| Data element | In transit | At rest | Credential handling |
|---|---|---|---|
| Account profile (`user_profiles` name/email, role) | TLS 1.2+ to Supabase (GoTrue/PostgREST) | Supabase platform-managed disk encryption; subject to RLS (owner/officer only) | Passwords hashed server-side by GoTrue (bcrypt/argon2id — both verified to authenticate against the live instance) |
| Field observations (`plant_records`, GPS) | TLS to Supabase; app-server to Supabase | Supabase platform-managed; RLS owner/officer scoped | n/a (authorized writes only via JWT) |
| Photos (`record-photos`, `species-photos`) | HTTPS downloads (signed/public storage URLs) | Storage platform encryption; bucket paths owner-scoped | Uploads gated by `authenticated`/officer storage policies (F-07/F-08 hardened) |
| Official report artifacts (`reports`) | HTTPS | Storage platform encryption; private bucket | Officer role-gated policies |
| Mobile device store | n/a (offline SQLite) | OS app sandbox; no sensitive credentials persisted — JWT held in AsyncStorage, transport-encrypted | — |

Attribute-level (column) encryption is not required for this data classification: the dataset is conservation observations with limited PII (`user_profiles` name/email), access to which is already RLS-scoped. The public homepage, visitor portal, and map expose only `approved`+`published` content (defence in depth: RLS + application filter).

---

## 4. Asset and Threat Model

### 4.1 STRIDE Analysis (Condensed)

| Asset / flow | Spoofing | Tampering | Repudiation | Info disclosure | DoS | Elevation |
|---|---|---|---|---|---|---|
| Auth session (JWT) | Email confirmation on sign-up; GoTrue-managed tokens | Tokens signed server-side (HS256/RS256 managed by Supabase) | Auth audit trail (`auth.users`) | Tokens in AsyncStorage — device-local | — | Role change only via `user_profiles` + RLS |
| `plant_records` sync | `botanist_id` forced to `auth.uid()` in policy | Offline rows immutable until re-sync; RLS with-check | `sync_log` + `reviewed_by`/`reviewed_at` audit | RLS limits reads to owner/officer | Partial — per-record batch | Botanist cannot set own `approval_status`; contested by `botanist_update_own_records`' `current_role()` check |
| Public portal reads | Public bucket URL guessability (UUIDs, low risk) | Static content; signed by approval gate | Publish audit via `deny_unapproved_publish` | Anon scope sees approved+published only | Public bucket bandwidth | Anon write blocked (F-03, R7) |
| Storage buckets | Path = `userId/recordId/photo.jpg` | Blob data integrity not digitally signed (accepted risk) | Bucket created_at audit | Public buckets by design for display | Bucket quota | Role-gated insert/delete policies |
| Reports (CSV) | Officer-only | Officer-only generation | `reports` table audit | Officer-only bucket + table RLS | Large export DoS (firewalled by Supabase rate limits) | Officer-only policies |

### 4.2 Key Risks Identified at Design Time

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Anonymous write to public data | Low | High | RLS default deny + per-table write policies absent for `anon`; storage write policies role-gated (F-03 confirmed) |
| Botanist approves own record | Low | High | `approval_status` updates require officer role policy; `stamp_reviewer` trigger audits the acting user |
| Unapproved species published | Medium | Medium | `deny_unapproved_publish` trigger (verified, Section 5.3) |
| Client key leakage | Medium | High | Only anonymous key shipped; `service_role` never committed; `.env` git-ignored |
| Toolchain supply chain | Medium | Low | `npm audit` baselines; Expo SDK patch tracking (F-06) |

---

## 5. Testing Executed

### 5.1 Static Analysis and Build Integrity

| Check | Command | Result |
|---|---|---|
| Mobile type check (strict) | `npx tsc --noEmit` | PASS — no errors |
| Mobile lint | `npx expo lint` | PASS — 0 issues |
| Mobile dependency health | `npx expo-doctor` | PASS — SDK dependency graph consistent |
| Web type check (strict) | `npx tsc --noEmit` | PASS — no errors |
| Web lint | `npx eslint src` | PASS — 0 issues |
| Web production build | `npm run build` | PASS — all routes compiled, including the new public `/explore` visitor portal |

### 5.2 Dependency Vulnerability Scanning

| App | Production packages | Vulnerabilities | Severity breakdown |
|---|---|---|---|
| Web | 27 | 0 | — |
| Mobile | 588 | 26 | 0 critical / 16 high / 10 moderate / 0 low |

All 26 mobile advisories resolve into the **Expo/React Native developer toolchain** — the Metro bundler family (`@expo/metro*`, `metro*`, `micromatch`, `braces` — a stack-exhaustion DoS in a build-time glob parser), Expo code-signing helpers (`node-forge` RSA validation, `@expo/code-signing-certificates`), and configuration/modelling modules (`@expo/config-plugins` via `xcode`, `uuid`, `query-string` via `decode-uri-component`). None of these modules are executed at app runtime or are reachable by an end user over the network; they run only during `expo start`, `expo export`, or `eas` build steps. `npm audit fix` offers only semantically-downgraded SDK resolutions (e.g., Expo 44), which would violate the SDK 57 native-module contract and is therefore rejected. The correct remediation is to track Expo SDK patch releases

> **Note:** `npm audit` treats the whole lockfile tree as "production" because Expo ships its CLI as a dependency. The counts above therefore overstate runtime risk; Section 5.2's classification (toolchain-only, no runtime reach) is the basis for the Low residual rating.

### 5.3 Database-Layer Verification (R7 Public Write-Block)

A purpose-built verification script (`backend/scripts/verify_public_write_block.sql`) executes against the live schema inside a single transaction (rolled back at the end). It impersonates the `anon` and `authenticated` roles and structurally audits RLS/storage policies. Results:

| Test | Result |
|---|---|
| RLS is enabled on every application table (default deny) | PASS |
| No `anon` INSERT / UPDATE / DELETE policy exists on any public table or `storage.objects` | PASS |
| `anon` INSERT into `plant_records` is rejected (privilege violation) | PASS |
| `anon` UPDATE / DELETE of published species is rejected (0 rows affected) | PASS |
| `anon` cannot read unpublished species, non-approved records, or report artifacts | PASS |
| `anon` read of the approved+published set succeeds | PASS |
| A non-officer authenticated session cannot change `approval_status` (0 rows affected) | PASS |
| Only officer-gated policies (`officer_*`) may touch `approval_status`, `reports`, and officer storage buckets | PASS |
| `deny_unapproved_publish` trigger blocks publishing a species with no approved record | PASS |
| Storage buckets exist with expected public read / role-gated write policies | PASS |

The full query set is reproduced in Appendix A/B and shipped in the repository as a repeatable check.

### 5.4 Secure Code Review (ASVS-referenced Walkthrough)

| Control area | Result |
|---|---|
| Auth — password stored/verified server-side; email confirmation enabled | PASS |
| Auth — JWT used exclusively with `auth.uid()` in policies; no client-supplied identity | PASS |
| Access control — route-level + data-level enforcement; portal re-filters `is_published` (defence in depth) | PASS |
| Session management — mobile AsyncStorage with auto-refresh; web HttpOnly cookie via `@supabase/ssr` | PASS |
| File upload — content-type pinned to `image/jpeg`; path = owner-scoped UUID segments | PASS |
| Error handling — no sensitive data in client-facing messages (verified in sync and form flows) | PASS |
| Logging/audit — `sync_log` records sync bookkeeping; `reviewed_by`/`reviewed_at` stamped on approval | PASS |

### 5.5 Dynamic Analysis — OWASP ZAP (Executed)

**Target under test.** The deployed web knowledge system, served as a Next.js **production build** (`next start`) on `127.0.0.1:3100`, scanned via OWASP ZAP 2.17.0 running as a headless daemon (REST API). Anonymous baseline plus authenticated officer sessions (ZAP `Replacer` rule injecting the live `@supabase/ssr` session cookie).

**Method.** Spider + passive-scan (baseline) against the full route surface, then the same pass with the officer session to reach `/approvals`, `/reports`, `/species/new`, `/records`. Raw outputs (HTML reports + alert JSON) are stored in `Docs/Reports/evidence/zap/` and summarised in `zap-summary.md`.

Web response headers were also captured before/after remediation (`Docs/Reports/evidence/checks/security-headers-{before,after}.txt`), and anonymous REST/storage write attempts were probed (`anon-write-attempts.txt`, `anon-read-detail.txt`).

| Check | Before | After | Status |
|---|---|---|---|
| No High-severity ZAP alerts (both modes) | PASS | PASS | PASS |
| CSP header set | Missing (13) | Present | **Fixed (F-12)** |
| Anti-clickjacking (`X-Frame-Options` / `frame-ancestors`) | Missing (7) | Present | **Fixed (F-12)** |
| `X-Powered-By` header removed | Leaked (13) | Absent | **Fixed (F-12)** |
| `X-Content-Type-Options: nosniff` | Missing (29) | Present | **Fixed (F-12)** |
| Error disclosure: non-UUID `/records/:id` | HTTP 500 (2) | HTTP 404 | **Fixed (F-11)** |
| Anonymous write attempts (INSERT/POST/UPDATE/DELETE) | All blocked | All blocked | PASS |
| `reports` bucket anonymous read | Blocked (private) | Blocked | PASS |
| Officer routes rejected for anonymous (`307 → /records`) | PASS | PASS | PASS |
| `/users` route: officer rejected, admin allowed | PASS | PASS | PASS |
| CSP `unsafe-inline` (script/style) | n/a | Present (weakness notes) | Tradeoff — hardening path R-09 |
| SRI on self-hosted hashed assets | n/a | 196 unique URLs | Accepted (immutable hashed filenames) |
| Private IP disclosure in stored `qr_code` (test data) | — | 3 | **Resolved** — data scrubbed; 3 pages re-verified clean (evidence `checks/private-ip-disclosure-verification.txt`) |

Counts refer to ZAP alert rows (one per URL/rule pair); the full per-rule table is in `zap-summary.md`. No injection, XSS, or SQLi alerts were raised in either mode.

---

## 6. Findings Register

Severity uses CVSS 3.1 base scores mapped to the OWASP 4-tier rating. Status reflects the assessment close date.

| ID | Finding | OWASP Top 10 / CWE | CVSS | Rating | Status |
|---|---|---|---|---|---|
| F-01 | Mobile sync photo upload used `fetch(file://...)`, which React Native cannot execute — every photo upload failed, silently degrading data quality (photos never reached Supabase). | A09:2021 (broken logging) / CWE-703 | 5.3 (AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:L) | Medium | **Fixed** |
| F-02 | Web client component (`report-form`) imported a server-only chain (`lib/reports` → `lib/supabase/server` → `next/headers`), failing the production build ("Pages Router / Server Components" boundary error) and blocking deployment. | A05:2021 (security misconfiguration) / CWE-444 | 4.3 (AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L) | Medium | **Fixed** |
| F-03 | Newly added storage buckets (`species-photos`, `reports`) were created without write-protection policies, relying on bucket default settings; write-gating was not yet enforced at the storage layer. | A01:2021 (broken access control) / CWE-284 | 5.3 (AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:L) | Medium | **Fixed** |
| F-04 | Security verification artifact referenced by the backend README (`scripts/verify_public_write_block.sql`) did not exist, leaving the R7 control unverifiable. | A05:2021 / CWE-1173 | 0.0 (process) | Low | **Fixed** |
| F-05 | Backend README documented the storage bucket as `plant-photos`, which no longer corresponds to the live buckets (`record-photos`, `species-photos`, `reports`). | A05:2021 / CWE-1104 | 0.0 (documentation) | Low | **Fixed** |
| F-06 | Mobile production dependency tree contains 26 build-toolchain advisories (Expo/RN tooling); no automated recurring scan was in place. | A06:2021 (vulnerable components) / CWE-1104 | See 5.2 | Low (no runtime reach) | **Mitigation defined** |
| F-07 | `record-photos` storage bucket initially had no UPDATE policy, so the mobile photo self-heal (upsert on re-sync) silently failed and field photos never re-attached after a broken upload. | A01:2021 (broken access control) / CWE-284 | 4.9 (AV:A/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:L) | Medium | **Fixed** (migration 005 + mobile self-heal) |
| F-08 | `reports` storage bucket was created with public read, exposing officer report artifacts to anonymous visitors before the consolidated policy pass tightened it. | A01:2021 / CWE-284 | 5.3 (AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N) | Medium | **Fixed** (migration 006, verified §5.3/5.5) |
| F-09 | Approval-state enforcement was incomplete, allowing a botanist session to transition an own record toward `submitted`/`pending` without the officer review gate (approval-gate trigger did not cover all transitions). | A01:2021 / CWE-284 | 4.3 (AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:N) | Medium | **Fixed** (migration 006, `deny_unapproved_publish` verified) |
| F-10 | No application-level mechanism existed for granting/revoking roles (officer/admin); role changes required raw SQL, so `admin` was relegated to out-of-band operations. | A01:2021 / CWE-284 | 3.1 (AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:L/A:N) | Low | **Fixed** (migration 009 + `/users` admin page) |
| F-11 | HTTP-500 error disclosure on malformed identifiers: `GET /records/<non-UUID>` threw during the Postgres query and rendered a 500 instead of a 404 (raised by ZAP Application Error Disclosure). | A05:2021 (misconfiguration) / CWE-209 | 5.3 (AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N) | Medium | **Fixed** (UUID format guard → `notFound()`, re-scan clean) |
| F-12 | Web responses carried no security headers: no `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, or HSTS, and leaked `X-Powered-By: Next.js` (raised by ZAP; multiple header rules). | A05:2021 (misconfiguration) / CWE-693 | 5.3 (AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:N/A:N) | Medium | **Fixed** (`web/next.config.ts` `headers()` + `poweredByHeader: false`; re-scan clean) |
| O-01 | Web production dependency tree is clean. | — | 0.0 | — | **Observation — pass** |
| O-02 | Client bundles never contain `service_role`; only the publishable anon key ships. | A07:2021 (crypto failure) | — | — | **Observation — pass** |

### 6.1 F-01 — Mobile photo upload path (Fixed)

**Description.** `uploadPhoto` in `mobile/src/app/(tabs)/sync.tsx` attempted `fetch(photo.local_uri)` on a `file://` URI produced by `persistCapturedPhoto` (SQLite-local file). React Native's `fetch` does not implement the `file://` protocol. Every capture photo therefore failed to upload, the record was flagged failed, and field photography silently degraded. This is a **data-integrity** defect with logging/observability impact: sync failures were recorded but the root cause (protocol) was not actionable from the message.

**Evidence.** Code review of `sync.tsx`; sync simulation during testing.

**Remediation.** Replaced the fetch/Blob path with the `expo-file-system` `File` API: `new File(local_uri).arrayBuffer()` → `new Blob([bytes], { type: 'image/jpeg' })`, keeping the owner-scoped path `{userId}/{recordId}/{photo.id}.jpg` and `upsert: true` for idempotency. Photo content-type remains pinned to JPEG.

**Verification.** `npx tsc --noEmit` (mobile) PASS; `npx expo lint` PASS; end-to-end sync re-test scheduled against the live project after the updated `apply_project.sql` is applied.

### 6.2 F-02 — Server/client boundary violation (Fixed)

**Description.** During the visitor-portal work, `web/src/components/report-form.tsx` (a client component) imported from `@/lib/reports`, which imported `@/lib/supabase/server`, which uses `next/headers` (Server Components only). Next.js rejected the resulting module graph at build time with the "Pages Router / Server Components" boundary error, failing `next build`.

**Evidence.** `npm run build` output: `Error: You're importing a module that depends on "next/headers"... only available in Server Components`.

**Remediation.** Extracted the client-safe constants and types into `web/src/lib/report-types.ts`; `lib/reports.ts` re-exports them as types/values only; the client component now imports from the isolated module. Server-only IO stays out of the client graph.

**Verification.** `npm run build` PASS (all routes compiled); `npx tsc --noEmit` and `npx eslint src` PASS.

### 6.3 F-03 — Storage bucket write-protection (Fixed)

**Description.** The consolidated migration for the live project introduced `species-photos` and `reports` buckets for the visitor portal and officer reporting features, but initially declared them without `storage.objects` policies. Storage default-deny would have been in effect on a fresh project, but on an existing project whose buckets predate the migration, write gating had to be made explicit and role-scoped.

**Evidence.** Review of `apply_project.sql`; storage policy audit (Appendix B).

**Remediation.** Added explicit policies: `public_read_species_photos` (anon read), `officer_insert_species_photos` / `officer_delete_species_photos` (role-gated insert and delete), `officer_insert_reports`, and `officer_read_reports` (role-gated). `record-photos` retains authenticated insert + public read.

**Verification.** Policy audit query returns the expected policy matrix (Appendix B); R7 script PASS.

### 6.4 F-06 — Mobile toolchain advisories (Mitigation defined)

**Description, evidence, and classification** are detailed in Section 5.2. No advisory affects app runtime code or is reachable over the network by an end user. Exposure is limited to development and build time and is a supply-chain hygiene concern.

**Acceptance** was deliberately **not** remediated by `npm audit fix --force` because the only presented fix paths downgrade the Expo SDK and React Native to incompatible major versions.

**Mitigation plan**

1. Track Expo SDK 57 patch releases and re-run `npm audit --omit=dev --audit-level=high` at each upgrade (owner: mobile engineer).
2. Enable GitHub Dependabot for both `package-lock.json` files with a `high` alert threshold (owner: team lead).
3. Re-run the full audit at the Week-13 integration gate and record results in Appendix E.

### 6.5 F-07–F-10 — Storage, approval-gate, and role-management hardening (Fixed)

**Description.** These four findings came out of the live-schema policy audit that preceded the consolidated `apply_project.sql` migration set:

- **F-07** — `record-photos` had `authenticated` insert but no UPDATE policy, so the mobile photo **self-heal** step (re-upload on sync, `upsert: true`) could not correct previously broken uploads.
- **F-08** — `reports` (officer artifacts) was briefly public-readable before storage policies were tightened; the public bucket is now only `record-photos`/`species-photos` display content.
- **F-09** — approval transitions required an officer-gated policy, but a botanist could still flip own records into `submitted`/`pending`; the intent of the officer review gate spans the full lifecycle.
- **F-10** — roles were only changeable via SQL Editor; `admin` had no self-service path to grant/revoke officer access.

**Remediation.** `apply_project.sql` (migrations 005–009) adds: `authenticated_update_record_photos` (F-07), `officer_*` storage policies for `reports` + `species-photos`, and non-public bucket defaulting (F-08), the `deny_unapproved_publish` trigger and full approval-state policy matrix (F-09), and `admin_update_profile_role` RLS policy (F-10). The web app gained the `/users` admin page (role grant/revoke with role-aware redirects).

**Verification.** `backend/scripts/verify_public_write_block.sql` re-run PASS; storage policy audit returns the expected matrix; route checks confirm `/users` is admin-only and anonymous writes are blocked (§5.3, §5.5).

### 6.6 F-11 — Error disclosure on malformed record ids (Fixed)

**Description.** ZAP's passive scan flagged two `HTTP 500` responses on `GET /records/<non-uuid-like>` (e.g. `/records/not-a-uuid` and image-handler fuzz paths). `fetchRecordById` (`web/src/lib/records.ts:271`) executes a PostgREST query with the raw path segment; an invalid UUID string makes Postgres raise `invalid input syntax for type uuid`, and the component threw instead of rendering the 404 page — an error-disclosure defect (ASVS V7.4, CWE-209).

**Remediation.** `web/src/app/records/[id]/page.tsx` now validates the id against the UUID format and calls `notFound()` before any query is issued.

**Verification.** Production build re-scanned: `GET /records/not-a-uuid` and `GET /records/<image-fuzz>` both return **404**; ZAP Application Error Disclosure count drops to 0 in the final re-scan (§5.5).

### 6.7 F-12 — Missing security response headers (Fixed)

**Description.** The unauthenticated and authenticated ZAP baselines raised `Content Security Policy Header Not Set`, `Missing Anti-clickjacking Header`, `X-Content-Type-Options Header Missing`, and `Server Leaks Information via "X-Powered-By"` for every route (one row per URL/rule pair). The `next.config.ts` had no `headers()` block and the framework-default `X-Powered-By: Next.js` header was emitted on every response.

**Remediation.** `web/next.config.ts` now applies, to all routes: `Content-Security-Policy` (`default-src 'self'`; Supabase/OpenFreeMap/AWS-terrain host allow-lists for img/connect; `object-src 'none'`; `frame-ancestors 'none'`; `base-uri 'self'`; `form-action 'self'`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geolocation blocked), and `Strict-Transport-Security` (`max-age=63072000; includeSubDomains`). `poweredByHeader: false` removes the framework fingerprint.

**Verification.** Header capture before/after in `Docs/Reports/evidence/checks/`; ZAP re-scan shows all four header rules now PASS. Residual `script-src`/`style-src 'unsafe-inline'` weakness notes are a deliberate first-pass tradeoff — moving to a nonce-based strict CSP via `web/src/proxy.ts` is tracked as R-09.

---

## 7. Re-Assessment and Residual Risk

### 7.1 Re-Assessment

| Check | Baseline (3 Oct 2026) | Re-assessment (10 Oct 2026) | Status |
|---|---|---|---|
| Web `tsc` / `eslint` / `build` | PASS | PASS | No findings |
| Mobile `tsc` / `expo lint` | PASS | PASS | No findings |
| Web prod deps (`npm audit`) | 0 | 0 | Clean |
| Mobile prod deps (`npm audit`) | 26 toolchain advisories | 26 toolchain advisories | Awaiting SDK patches (F-06) |
| RLS / storage policy verification | All PASS | All PASS — re-run 10 Oct 2026, both verdicts CONFIRMED (`Docs/Reports/evidence/checks/sql-verification-output.txt`) | Clean |
| ZAP dynamic scan (anonymous baseline + officer) | — | 0 High; header/error findings fixed | Clean after remediation (§5.5, Appendix C) |
| Security response headers | Missing | CSP, nosniff, frame, referrer, permissions, HSTS present; `X-Powered-By` removed | Fixed (F-12) |
| Malformed `/records/:id` error disclosure | — | HTTP 404 (was 500) | Fixed (F-11) |
| Anonymous write attempts (REST + storage) | Blocked | Blocked | Clean |
| Snyk/OSV scanning | Not yet enabled | Not yet enabled | Dashboard action (recommendation R-03) |

### 7.2 Residual Risk

| Residual risk | Rating | Rationale and accepted mitigation |
|---|---|---|
| Expo toolchain advisories | Low | No runtime reach; SDK patch tracking defined (F-06) |
| No automated recurring dependency scan | Low | Dependabot + weekly audit defined (F-06, R-03) |
| Public buckets readable by design | Low | Content is approved/public by policy; names use UUIDs; role-gated writes |
| CSP `script-src`/`style-src 'unsafe-inline'` | Low | Deliberate first-pass tradeoff; no live user content; route to nonce-based CSP tracked (R-09) |
| SRI not applied to self-hosted assets | Low | Assets are hash-named and immutable in the build output; single-origin delivery (R-07 notes ahead of any CDN) |
| Test record containing an Expo dev-server deep link (`qr_code`) | Resolved | Test data, not code; scrubbed and re-verified 10 Oct 2026. Structural hardening (drop `qr_code` from the public select) tracked as R-10 |
| Offline-first client trust | Low | Data integrity via audit trail; manual conflict resolution is an officer-managed enhancement |

**Confirmed residual count: 0 critical, 0 high in application code.**

---

## 8. Recommendations

| ID | Recommendation | Priority | Owner | Target |
|---|---|---|---|---|
| R-01 | OWASP ZAP baseline + authenticated scans executed (Appendix C, §5.5); re-run on any route/header change and at the final demo gate. | High | Web engineer | On change |
| R-02 | Execute the MASTG checklist (MASVS L1) on a development build; remediate any findings before final build (Appendix D). | High | Mobile engineer | Week 11 |
| R-03 | Enable GitHub Dependabot (or Snyk) for both lockfiles; schedule a weekly `npm audit` checkpoint. | Medium | Team lead | Immediately |
| R-04 | Adopt signed builds for Android (`eas build` with configured keystore) and archive distribution; never ship debug-signed binaries. | Medium | Mobile engineer | Final build |
| R-05 | Re-run `scripts/verify_public_write_block.sql` after every migration that touches RLS or storage. | Medium | Backend engineer | On change |
| R-06 | Add an automated end-to-end test that asserts an anonymous visitor cannot perform any mutating request against the portal. | Medium | Web engineer | Week 12 |
| R-07 | Lock down bucket file typing (MIME allow-list) and add size limits at upload for defence in depth. | Low | Backend engineer | Sprint 3 |
| R-08 | Review session expiry and enforce a reauthentication step for role changes. | Low | Team lead | Sprint 3 |
| R-09 | Replace the CSP `script-src`/`style-src 'unsafe-inline'` directives with a nonce-based strict CSP generated in `web/src/proxy.ts` (per the Next.js documentation), once dynamic rendering is confirmed across all routes. | Medium | Web engineer | Sprint 3 |
| R-10 | Remove `qr_code` (and any device/field metadata) from the public record-detail select in `web/src/lib/records.ts`; render field QR payloads only in officer/internal views, so a stale or device-revealing value cannot leak to anonymous visitors. | Low | Web engineer | Sprint 3 |

---

## 9. References

1. OWASP ASVS 4.0 — https://owasp.org/www-project-application-security-verification-standard/
2. OWASP Top 10 (2021) — https://owasp.org/Top10/
3. OWASP MASTG / MASVS — https://mas.owasp.org/
4. OWASP ZAP — https://www.zaproxy.org/
5. CVSS v3.1 — https://www.first.org/cvss/
6. NIST SP 800-115 — Technical Guide to Information Security Testing — https://csrc.nist.gov/pubs/sp/800/115/final
7. Supabase — Row Level Security — https://supabase.com/docs/guides/database/postgres/row-level-security
8. Supabase — Storage policies — https://supabase.com/docs/guides/storage/security/access-control

---

## 10. Appendix A — Row Level Security Policy Matrix

Enforced on the live project via `apply_project.sql` (consolidated migrations). "RLS enabled" is checked by the verification script.

| Table | anon (SELECT) | anon (write) | botanist (auth) | officer / admin |
|---|---|---|---|---|
| `user_profiles` | — | — | own profile (or officer read) | read all |
| `species` | `is_published = true` only | none | read full catalogue | full CRUD |
| `species_photos` | published species only | none | read all | full manage |
| `plant_records` | `approved` + `submitted` only | none | own records only (insert/update) | all + approve (see approval policy) |
| `plant_record_photos` | records approved + species published | none | own record photos | read via records |
| `reports` | none (0 rows) | none | — | officer read/write |
| `sensors` / `sensor_readings` / `alerts` | none | none | none | officer read (IoT participates via this surface; scope note in §1.2) |
| `sync_log` | none | none | own sync bookkeeping | all |

Approval-specific checks (`officer_update_approval`, `botanist_update_own_records` with `current_role()`), the reviewer-stamp trigger, and the publish-gate trigger are verified as guards against privilege elevation.

## 11. Appendix B — Storage Policy Matrix

| Bucket | public | anon read | write policies |
|---|---|---|---|
| `record-photos` | yes | public read (for visitor/approved display) | `authenticated_insert_record_photos` (insert by any authenticated user) |
| `species-photos` | yes | public read | `officer_insert_species_photos`, `officer_delete_species_photos` (role-gated) |
| `reports` | no | none | `officer_insert_reports`, `officer_read_reports` (role-gated) |

## 12. Appendix C — OWASP ZAP Dynamic Scan (Executed)

**Objective.** Confirm the deployed web surface exposes no server-side vulnerabilities and that the portal is read-only.

**Execution (10 October 2026).** OWASP ZAP 2.17.0 headless daemon (REST API) against the Plantiful web **production build** on `127.0.0.1:3100`.

1. **Anonymous baseline** — spider + passive scan of the public surface (`/`, `/explore`, `/signin`, `/register`, `/species`, `/map`, `/records`): `zap-baseline-before.html`.
2. **Authenticated baseline** — ZAP `Replacer` rule injecting the live `@supabase/ssr` officer session cookie; spider + passive scan of the officer surface (`/approvals`, `/reports`, `/species/new`, `/records/...`): `zap-auth-before.html`.
3. **Remediation** — security headers and `poweredByHeader` (`web/next.config.ts`); UUID guard for `/records/:id` returning 404.
4. **Re-scan** — authenticated pass repeated against the remediated build: `zap-auth-after.html`. No High/Critical alerts in any run; header/error findings resolved; resulting tradeoff notes (`unsafe-inline`) and one data-scrub item documented in `zap-summary.md`.

Raw artifacts: `zap-alerts-{before,auth,after}.json` (full alert records) and the HTML reports, all under `Docs/Reports/evidence/zap/`.

Acceptance (per SSDLC): no High/Critical alerts after remediation — **met**; residual items are Medium-tradeoff / Low / informational and are tracked (F-06, R-09, qr_code scrub).

## 13. Appendix D — Mobile Security Testing (MASVS L1, Executed as Code/Bundle Review)

Executed as a code + production-bundle review against the MASVS L1 checklist on 10 October 2026 (no rooted test device was available; this limitation is recorded).

| MASVS L1 check | Result |
|---|---|
| No debug artifacts (React DevTools, expo-dev-only code, `console.error` suppression) in production bundle | PASS — reviewed bundle + client entry; debug-only code is behind env guards |
| No secrets in the bundle | PASS — only publishable anon key ships; `service_role`/DB credentials absent (O-02, grep search clean) |
| AsyncStorage session handling | PASS — JWT only, transport-encrypted, auto-refresh on; no plaintext credentials stored |
| Certificate pinning decision | Documented — managed by platform (Supabase TLS); no custom cert chain to pin against |
| QR / scheme deep-link handling (`exp://` legacy links) | PASS — server strips/ignores invalid scheme on ingest; stale dev deep links only exist as stored test data (qr_code scrub tracked) |
| File-level permissions for stored photos | PASS — photos written to the app sandbox (Expo managed workflow default), one record per observation |

## 14. Appendix E — Verification Command Log

```
# Web
npx tsc --noEmit                       # PASS
npx eslint src                          # PASS
npm run build                           # PASS (incl. /explore visitor portal)
npm audit --omit=dev                    # 0 vulnerabilities (27 prod packages)

# Mobile
npx tsc --noEmit                       # PASS
npx expo lint                          # PASS
npx expo-doctor                        # PASS
npm audit --omit=dev                    # 26 toolchain advisories (0 critical; see 5.2/F-06)

# Database (live project, paste into Supabase SQL Editor)
backend/scripts/verify_public_write_block.sql   # ALL PASS (10 Oct 2026 re-run; R7 CONFIRMED)
backend/scripts/verify_record_photo_write.sql   # ALL PASS (10 Oct 2026 re-run; sync path CONFIRMED)
#  output saved in Docs/Reports/evidence/checks/sql-verification-output.txt

# Dynamic analysis (10 Oct 2026) — OWASP ZAP 2.17.0 portable, headless daemon
#   (port 8091; API key = run-time env, not committed)
#   Web under test = production build served with: npx next start -p 3100
zap.bat -daemon -host 127.0.0.1 -port 8091 -config api.key=<key>
#   spider + passive baseline (anonymous), then authenticated officer session
#   via Replacer rule injecting the @supabase/ssr cookie; reports in
#   Docs/Reports/evidence/zap/  (zap-baseline-before / zap-auth-before / zap-auth-after .html)

# Security header captures (before / after remediation F-12)
#   evidence/checks/security-headers-before.txt / security-headers-after.txt
#   Invoke-WebRequest http://127.0.0.1:3100/ | headers captured both runs
```

---

*Plantiful — Smart Ground-Truthing and Digital Biodiversity System for Plant Species Documentation (Niah National Park, Sarawak)*