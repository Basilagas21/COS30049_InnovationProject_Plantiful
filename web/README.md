# Plantiful web

Next.js knowledge system for conservation officers: sign in, browse and search synced plant records, and approve or reject submissions.

## Setup

```bash
cd web
npm install
```

Create `web/.env.local` (git-ignored) with the Supabase project values (Dashboard > Project Settings > API Keys):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon / sb_publishable_ key>
```

The public key is labelled `anon` on older projects or `sb_publishable_…` on newer ones; both work here. Without these the app still runs, but shows sample records and sign-in is disabled. The variables are read at build time, so rebuild after changing them.

## IoT monitoring history (one-time SQL)

The `/alerts` dashboard's environmental charts call a `monitoring_history(...)` database function that returns pre-bucketed summaries (raw readings arrive roughly every 2 seconds, so the page never loads them directly). Run `web/sql/alerts_history.sql` once in the Supabase SQL Editor. It is re-runnable, uses `security invoker` (existing RLS still applies), and grants execute to `authenticated` only — no service key required. Until it is applied the dashboard still shows live status and alerts; the history charts report that this step is required.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## Pages

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/explore` | Public species catalogue |
| `/species`, `/species/new` | Catalogue browsing and management (officer) |
| `/map` | Located observations on an interactive species map |
| `/records`, `/records/[id]` | Records list with species search and record detail; officers approve or reject |
| `/approvals` | Pending-submission queue with approve/reject + quick links (officer) |
| `/reports` | Generated biodiversity reports (officer) |
| `/alerts` | IoT monitoring dashboard: per-sensor status cards, environmental trend charts, movement/rain strips, and an alert timeline with a 1d/5d/7d/all range selector (officer). Live readings/alerts poll every 10s and charts every 60s (paused in hidden tabs); history charts need the SQL step below |
| `/users` | Grant or revoke roles (admin) |
| `/signin`, `/register` | Supabase email/password auth |
| `/profile`, `/profile/change-password` | Account and role |

Officer actions require a `user_profiles.role` of `conservation_officer` or `admin`; the `/users` page and its role changes require `admin`.
