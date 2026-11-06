# RLS and storage policy verification summary

Date: 10 October 2026

Source: Supabase SQL Editor re-run of `backend/scripts/verify_public_write_block.sql` and `backend/scripts/verify_record_photo_write.sql`. Raw output is retained locally in `Docs/Security/Evidence/checks/sql-verification-output.txt`.

Result: both script verdicts returned PASS. The captured output contained 19 PASS lines and 6 SKIP lines across the two scripts.

## Public write-block and storage audit

| Check | Result |
|---|---|
| RLS enabled on all public tables | PASS |
| No anonymous write policy on any public table | PASS |
| Publish-gate trigger present | PASS |
| No anonymous write policy on `storage.objects` | PASS |
| Anonymous cannot read unpublished species | PASS |
| Anonymous cannot read non-approved records | PASS |
| Anonymous cannot read report artifacts | PASS |
| Anonymous cannot read photos of unpublished species | PASS |
| Anonymous cannot change `approval_status` | PASS |
| Authenticated non-officer session cannot approve records | PASS |
| Publish gate rejected publishing an unapproved species | PASS |
| `record-photos`, `species-photos` and `reports` buckets exist | PASS |
| Storage policy matrix complete for public read and role-gated writes | PASS |
| `record-photos` has select, insert, update and delete policies | PASS |
| Insert policy enforces the owner path prefix | PASS |
| Botanist photo policy matches the outer record identifier | PASS |
| Insert allowed for the owner path | PASS |
| Upsert and update allowed on the owner object | PASS |
| Write into another user folder denied by row-level security | PASS |

The script verdict was `ALL CHECKS PASSED - R7 public write-block CONFIRMED` for the public write-block script and `record-photo write path CONFIRMED` for the photo script.

## Skipped probes

| Probe | Reason |
|---|---|
| `plant_records` insert probe | Required a published species and an authenticated user fixture |
| Species insert probe | Required a published species row |
| Anonymous species update | No published species fixture |
| Anonymous species delete | No published species fixture |
| Authenticated species delete | No published species fixture |
| Direct SQL delete of a record photo | Deletes go through the Storage API, where a separate policy applies |

A SKIP is not counted as a pass. The missing fixtures are a limitation of this run.

## Interpretation

The run supports the claim that the tested live schema denied anonymous writes and enforced owner-scoped record-photo writes. It also supports the claim that the reports bucket was private and that the publication gate was present.

The result describes the schema on 10 October 2026. It does not establish that the final deployed schema is identical. Re-run both scripts after the final migration state and retain the full output.

No credentials, tokens or user identifiers are included in this summary.
