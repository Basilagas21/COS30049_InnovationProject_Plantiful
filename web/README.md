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
| `/explore` | Public species catalogue |
| `/species`, `/species/new` | Catalogue browsing and management (officer) |
| `/map` | Located observations on an interactive species map |
| `/records`, `/records/[id]` | Records list with species search and record detail; officers approve or reject |
| `/approvals` | Pending-submission queue with approve/reject + quick links (officer) |
| `/reports` | Generated biodiversity reports (officer) |
| `/alerts` | Live IoT threat alerts and latest sensor readings (officer) |
| `/users` | Grant or revoke roles (admin) |
| `/signin`, `/register` | Supabase email/password auth |
| `/profile`, `/profile/change-password` | Account and role |

Officer actions require a `user_profiles.role` of `conservation_officer` or `admin`; the `/users` page and its role changes require `admin`.
