# OWASP ZAP — Scan Summary (before / after)

**Target:** Plantiful web knowledge system, production build (`next start -p 3100`)
**Tool:** OWASP ZAP 2.17.0 (headless daemon, REST API), spider + passive scanned baseline
**Session:** unauthenticated (`zap-baseline-before`) and authenticated as `conservation_officer`
(replay of the `@supabase/ssr` session cookie, `zap-auth-before` / `zap-auth-after`)

| ZAP rule | Before (unauthed) | Before (auth) | After (auth, remediated) | Resolution |
|---|---|---|---|---|
| Content Security Policy Header Not Set | 13 Medium | 68 Medium | **0** | **Fixed** (F-12) — CSP header now emitted from `web/next.config.ts` |
| Missing Anti-clickjacking Header | 7 Medium | 70 Medium | **0** | **Fixed** (F-12) — `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` |
| Server Leaks Information via `X-Powered-By` | 13 Low | 65 Low | **0** | **Fixed** (F-12) — `poweredByHeader: false` |
| `X-Content-Type-Options` Header Missing | 29 Low | 78 Low | **0** | **Fixed** (F-12) — `nosniff` |
| Application Error Disclosure (HTTP 500 pages) | — | 2 Low | **0** | **Fixed** (F-11) — non-UUID `/records/<id>` now returns 404 |
| CSP: `script-src` uses `unsafe-inline` | — | — | 1099 Medium | **New tradeoff** — CSP is present; weak source-list noted for hardening |
| CSP: `style-src` uses `unsafe-inline` | — | — | 1100 Medium | **New tradeoff** — as above |
| Sub Resource Integrity Attribute Missing | — | 216 | 388 (196 unique URLs) | **Accepted** — static assets are self-hosted, hash-named, immutable (Next.js) |
| Private IP Disclosure | — | 3 Low | 3 Low | **Pending** — stored `qr_code` value `exp://192.168.1.11:8081` in one test record; scrub SQL provided |
| Content-Type Header Missing | — | 0 | 7 Info | **False positive** — spider-fuzzed phonetic paths returned as 404 |
| Modern Web Application | — | 2 Info | 4 Info | Informational — not a fault |
| Timestamp Disclosure — Unix | — | 1 Info | 0 | Variable/benign |

## Notes

- **No High severity alerts** in any run. No injection, XSS, or SQLi surfaced via the unauthenticated or authenticated baseline surface.
- Alert counts include one row per affected (URL, rule) pair; the rule table above lists raw counts and (where relevant) unique-URL counts.
- The CSP `unsafe-inline` alerts are a deliberate first-pass tradeoff: removing them requires a nonce-based strict CSP generated in `web/src/proxy.ts` per the Next.js documentation (recommended hardening, recorded as R-09).
- The `Private IP Disclosure` stems from stored **test data** (an Expo dev-server deep-link in `plant_records.qr_code`), not application code. Fix = `update plant_records set qr_code = null where qr_code ilike '%8081%';`
- Raw artifacts: `zap-alerts-before.json`, `zap-alerts-auth.json`, `zap-alerts-after.json`, and the three HTML reports in this folder.