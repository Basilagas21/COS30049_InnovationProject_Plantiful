# Anonymous access probe summary

Date: 10 October 2026

Source: `Docs/Security/Evidence/checks/anon-write-attempts.txt` and `Docs/Security/Evidence/checks/anon-read-detail.txt`

Scope: direct requests as an anonymous client against the REST and storage surfaces. This is a request-level probe. The SQL policy audit in EV-SEC-01 is the authoritative control test.

## Write attempts

| Attempt | Observed result | Interpretation |
|---|---|---|
| Anonymous insert into `species` | HTTP 401 with PostgreSQL code `42501` and a row-level security policy message | Denied |
| Anonymous post to `reports` | HTTP 401 with PostgreSQL code `42501` and a row-level security policy message | Denied |
| Anonymous patch on `species` | HTTP 204 | Ambiguous. A zero-row update filtered by RLS can return 204. Not counted as a pass |
| Anonymous select on `reports`, `sync_log`, `alerts` and `sensor_readings` | HTTP 400 in the captured probe | Not readable through this probe |
| Anonymous public URL request for the private `reports` bucket | HTTP 400 | Not served as a public object |

## Read scope

| Check | Observed result |
|---|---|
| Anonymous select of an approved record | Returned the approved record |
| Anonymous list of the `reports` bucket | Empty list |
| Anonymous list of the `record-photos` bucket | Public object metadata returned |
| Anonymous request for a missing public photo | HTTP 400 |

## Interpretation

The probes support the claim that anonymous clients had no usable write path on the tested surface. The species and report insert attempts were rejected by row-level security.

The HTTP 204 patch response is not used as evidence of denial. Status codes alone can be misleading for row-level security. The policy matrix and SQL verification are the stronger evidence.

The public `record-photos` bucket is readable by design. Published photo access is separate from write access and from access to unpublished records.

No tokens, cookies or account identifiers are included in this summary.
