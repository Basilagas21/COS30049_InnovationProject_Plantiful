# ZAP security scan procedure (issue-53)

Reproducible method for the four OWASP ZAP runs recorded in
`zap_scan_summary.txt`. Scans run against a LOCAL Supabase clone with
synthetic data, never the live project. This document is self-contained:
the original run used local helper scripts, but the steps and traps below
are all that is needed to reproduce the method on any host.

## Prerequisites

- Docker, the Supabase CLI, Node, and the OWASP ZAP stable image
  (`ghcr.io/zaproxy/zaproxy:stable`).
- A local clone of the repository with the reference migrations applied.
- Local-only env keys for the clone. Never use the live project keys.

## Known traps, read first

- The stable ZAP image ships no browser. The DOM-XSS active rules
  (plugins 40023, 40024 and 40026) crash the scanner JVM with OOM kills.
  Disable them via the API before any full active scan, and cover DOM
  sinks by code review instead.
- Docker Desktop can exhaust IPv4 allocation after a container storm; new
  networks then hand out IPv6-only endpoints, which breaks every
  IPv4-only listener (PostgREST, Kong). Symptom: published ports give
  empty replies while Go dual-stack services work. Cure:
  `docker network prune -f` and a Desktop restart. Health-check with a
  fresh container on `bridge` showing an IPv4 address.
- The ZAP API rejects calls whose peer is the bridge gateway IP. Drive
  the API from INSIDE the daemon container, where the loopback peer is
  permitted.

## Steps

1. Recreate a clean local stack: `supabase start`, then reapply the
   reference migrations, grants and synthetic seed data.
2. Front the stack with a dual-stack nginx on `bridge`, published on a
   local port, with upstreams pinned to bridge IPv4 (works around the
   IPv4-storm trap above).
3. Create scan users via the auth admin API and seed their data.
4. Serve a production build of the web app on a local port using the
   clone-only env keys.
5. Capture an officer session (for example via Playwright) and front the
   stack with a cookie-injecting proxy for the authenticated context.
6. Authenticated active scan: start the ZAP daemon, disable the DOM-XSS
   rules first, spider, then active-scan. Drive the API from inside the
   container and poll the returned scan id, because stale scans report
   100 instantly.
7. Anonymous active scan: re-spider after any session purge, then
   active-scan.
8. Harvest: copy the reports into `Docs/Testing/Evidence/issue-53/` and
   grep them for session leakage (auth tokens, scan passwords, home
   paths) before committing. Commit only redacted extracts.

## Teardown

`supabase stop --no-backup`; remove the ZAP and front containers; kill the
local web server; `docker network prune -f`. Verify zero residue.

## Result, 3 November 2026

Four runs: baseline and full active, in anonymous and officer-authenticated
contexts. Zero High and zero injection findings. The only Mediums are the
CSP unsafe-inline allowances (R-09, scanner-justified deferral). See
`zap_scan_summary.txt` and the redacted reports alongside this file.
