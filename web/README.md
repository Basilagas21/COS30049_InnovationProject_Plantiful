# Plantiful web

Next.js knowledge system for conservation officers: sign in, browse and search synced plant records, and approve or reject submissions.

## Setup

```bash
cd web
npm install
```

Create `web/.env.local` (git-ignored) with the Supabase project values:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

Without these the app still runs, but shows sample records and sign-in is disabled. The variables are read at build time, so rebuild after changing them.

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
| `/records` | Records list with species search; officers can approve or reject |
| `/records/[id]` | Record detail |
| `/map` | Located observations and summary (interactive map to come) |
| `/signin`, `/register` | Supabase email/password auth |
| `/profile`, `/profile/change-password` | Account and role |

Officer actions require a `user_profiles.role` of `conservation_officer` or `admin`.
