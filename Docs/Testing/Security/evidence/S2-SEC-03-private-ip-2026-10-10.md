# Private address disclosure resolution

Date: 10 October 2026

Finding: OWASP ZAP reported a low-severity private address disclosure. The value was a stale Expo development-server deep link stored in a test record.

Source: `Docs/Security/Evidence/checks/private-ip-disclosure-verification.txt`

## Resolution record

| Check | Result |
|---|---|
| ZAP finding source | `plant_records.qr_code` in test data, rendered by the public record-detail query |
| Data-level officer query | No current record contained the development-server port |
| Affected test record field | Empty after the data scrub |
| Anonymous `/records` recheck | HTTP 200. The redacted private address was not present |
| Affected record detail recheck | HTTP 404 because the record was not in the anonymous approved set |
| Officer `/approvals` recheck | HTTP 200. The redacted private address was not present |

The finding was resolved at the data level. The affected pages were rechecked and the disclosed value was not reproducible on a reachable page.

## Remaining hardening

The public record-detail query still selects `qr_code`. Removing that field from the public response is recommendation R-10. The current result depends on data hygiene, not on removing the field from the query.

## Redaction

The original private address is replaced with `[REDACTED_PRIVATE_IP]` in this summary. The raw local evidence remains unmodified. No credentials or account data are included.
