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
| Storage | Supabase Storage bucket `plant-photos` |
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

4. **Enable auth** (issue #3): email/password provider, then run `seed.sql` to create officer and admin users and set their roles.
5. **Create the storage bucket** and apply its policies (issue #4).
6. **Verify security** (issue #26): run `scripts/verify_public_write_block.sql` and confirm anonymous inserts, updates, and deletes are rejected and no record can be published before it is approved (R7).

## Data model

Mirrors the mobile SQLite schema (`mobile/src/db.ts`) and adds the review-publish columns used by web and public portal.

| Table | Purpose | Key columns |
|---|---|---|
| `plants` | Plant records captured in the field | `id` (stable QR ID), `species_name`, `latitude`, `longitude`, `accuracy`, `owner_id`, `approved`, `published`, `reviewed_by`, `reviewed_ts`, `sync_status` |
| `photos` | Photo attachments linked to a plant | `plant_id`, `storage_path` |
| `species_catalog` | Offline species reference list | `name`, `scientific_name` |
| `sync_queue` | Offline sync bookkeeping | `record_id`, `sync_status`, `updated_at` |

## Security rules

- RLS is enabled on every table with default deny (issue #5).
- Botanists manage only their own rows (`owner_id = auth.uid()`).
- Officers and admins manage all records; only officers/admins can approve or publish.
- `anon` can read only `approved = true AND published = true` records and their photos.
- A database trigger blocks publishing an unapproved record and stamps `reviewed_by`/`reviewed_ts` on approval (issue #6).

## Related issues

- Backend foundation: #1 to #7.
- Public portal RLS and read-only guarantee: #24, #26.