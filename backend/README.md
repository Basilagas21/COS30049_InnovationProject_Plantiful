# Plantiful Backend

Supabase-backed backend for Plantiful. Owns the central database (PostgreSQL), authentication and roles, file storage, row-level security, and the approval gate that protects the public visitor portal.

## What lives here

```
backend/
├── README.md
├── .env.example              ← shared env template (URL + anon + service_role keys)
├── supabase/
│   ├── migrations/           ← schema, RLS policies, approval trigger (DDL)
│   └── seed.sql              ← seed officer/admin users and role assignments
└── scripts/
    └── verify_public_write_block.sql   ← R7 check: anon writes must fail
```

## Tech stack

| Layer | Technology |
|---|---|
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password, JWT) |
| Roles | `botanist`, `conservation_officer`, `admin`, `anon` |
| Storage | Supabase Storage buckets `record-photos` (field photos), `species-photos`, `reports` |
| Access control | Row Level Security (RLS) |
| API | Supabase auto-generated REST (PostgREST) |

## Prerequisites

- A Supabase account and a new project named `plantiful`.
- The project URL and keys (`anon` for clients, `service_role` for trusted scripts).
- [Supabase CLI](https://supabase.com/docs/guides/cli) (optional, for pushing migrations).

## Setup

1. **Create the project** (GitHub issue #1).
2. **Copy the env template** and fill in real values locally. Real keys must never be committed (see root `.gitignore`).

   ```
   cp backend/.env.example backend/.env
   ```

3. **Apply migrations.** Push the DDL in `backend/supabase/migrations/` against the project (issue #2, #5, #6) using the Supabase CLI or the SQL editor:

   ```
   supabase db push
   ```

   Without the CLI, open Dashboard > SQL Editor and run `001_schema.sql` then `002_rls.sql` in order.

4. **Enable auth** (issue #3): email/password provider, then run `seed.sql` to promote the officer and admin users (set your real emails in its two `update` statements first).
5. **Create the storage buckets and apply their policies.** For a fresh project, run `001_schema.sql` first and then the incremental migrations below in order; for the live project, run the consolidated `supabase/migrations/apply_project.sql` instead — it is idempotent and covers `002_rls.sql` through `008_species_knowledge_fields.sql` (schema backfills, RLS policies, workflow triggers, the botanist approval gate, the private `reports` bucket, and the `record-photos`, `species-photos`, and `reports` bucket policies). Upgrades are incremental:
   - `004_photo_visibility.sql` — photo reads follow record approval instead of species publication. Run it on any project created before it.
   - `005_record_photo_sync.sql` — **required for the mobile photo sync to complete.** It adds the missing `UPDATE`/`DELETE` policies on `record-photos` (without the `UPDATE` policy, the app's repair upload with `upsert: true` is rejected by RLS and the sync reports "The central database rejected this write under its access rules"), enforces the `<user id>/` path prefix on writes, and fixes an unqualified-column bug in `botanist_manage_own_photos`.
   - `006_record_approval_gate.sql` — the approval gate: requires `approval_status = 'pending'` and a null `reviewed_by` on botanist inserts and updates, so only officers can approve a record. Already inside `apply_project.sql`; run it on its own only when you are not re-running the consolidated file.
   - `007_reports_bucket_private.sql` — **required.** Flips the `reports` bucket to `public = false`. A public bucket bypasses RLS on `storage.objects`, so the officer CSVs (GPS of sensitive species) were readable by anyone with the URL even though `officer_read_reports` looks officer-only; also folded into `apply_project.sql`.
   - `008_species_knowledge_fields.sql` — **required.** Adds the nullable `species.ecology` and `species.cultural_significance` knowledge columns; also folded into `apply_project.sql`.
6. **Verify security** (issue #26): run `scripts/verify_public_write_block.sql` in the SQL editor and confirm every check passes — anonymous inserts, updates, and deletes are rejected, anonymous reads return only approved and published data, and no species can be published before it has an approved record (R7).
7. **Verify the photo write path:** run `scripts/verify_record_photo_write.sql`. Every line must read `PASS` (or `SKIP` where noted) before pressing **Sync now** on a device; otherwise photo uploads fail with an access-rules error.

## Data model

Applied in `supabase/migrations/001_schema.sql`. Field records are captured on the mobile device, synced into `plant_records`, linked to a species, and pass through officer approval before the species is published.

| Table | Purpose | Key columns |
|---|---|---|
| `user_profiles` | Roles tied to Supabase auth | `user_id` (FK `auth.users`), `role` (`botanist` / `conservation_officer` / `admin`) |
| `species` | Species catalog with publish flag | `scientific_name`, `conservation_status`, `is_published` |
| `species_photos` | Photos per species | `species_id`, `photo_url` |
| `plant_records` | Field observations | `species_id`, `botanist_id`, `qr_code`, `gps_lat/lng`, `height_cm`, `status`, `approval_status`, `reviewed_by`, `version`, `device_id` |
| `plant_record_photos` | Photos per record | `record_id`, `photo_url` |
| `sync_log` | Offline sync bookkeeping | `record_id`, `device_id`, `sync_status`, `conflict_flag` |
| `sensors` / `sensor_readings` / `alerts` | IoT monitoring | `gps_lat/lng`, `temperature`, `humidity`, `movement`, `severity` |
| `reports` | Officer export artifacts | `report_type`, `file_url`, `is_published` |

## Security rules

- RLS is enabled on every table with default deny (issue #5).
- Botanists manage only their own rows (`owner_id = auth.uid()`).
- Officers and admins manage all records; only officers/admins can approve or publish.
- `anon` can read only `approved = true AND published = true` records and their photos.
- A database trigger blocks publishing an unapproved record and stamps `reviewed_by`/`reviewed_ts` on approval (issue #6).

## Related issues

- Backend foundation: #1 to #7.
- Public portal RLS and read-only guarantee: #24, #26.