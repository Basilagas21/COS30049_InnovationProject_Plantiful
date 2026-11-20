# Plantiful Visitor Site

A standalone, public website about Plantiful and Sarawak Forestry
Corporation (SFC) at Niah National Park — information about the park and
the project, a navigation bar to jump between sections, a live (read-only)
species explorer, and an inquiry/contact form for questions, volunteering,
student placements, or partnerships. Dark theme by default.

This is intentionally a **separate app** from the main Plantiful system in
`../web`:

- No sign-in or account anywhere on this site.
- No shared code or components with `web` — pages, components and styles
  are all written fresh for this app.
- Runs on its own dev server, on its own port, and can be deployed on its
  own domain independently of the main app.
- The one thing it *optionally* shares is a read-only, public view of the
  same Supabase project (see "Live species data" below) — nothing here can
  sign in, write, or see anything the main app's own public pages couldn't
  already show an anonymous visitor.

A couple of buttons on this site link out to the main Plantiful app's
public (no-login) pages, such as the map. That target URL is configurable
— see below — since the two apps are meant to be deployed separately.

## Pages

- `/` — home: hero, about SFC, about Plantiful, short teasers linking to
  the two pages below, visiting info, FAQ.
- `/species` — the live species explorer (its own page).
- `/inquiry` — a contact form for questions, volunteering, student
  placements, or partnerships (its own page).
- `/plants/[id]` — a single published plant's visitor-friendly detail page.

The nav bar in the header works from any page: items that are their own
page (Species, Inquiry) navigate directly; the rest (About SFC, Why
Plantiful, Visiting, FAQ) jump to a section on the homepage.

## Running it

```bash
cd visitor-site
npm install
npm run dev
```

This starts the dev server on **http://localhost:3100** (the main `web`
app typically runs on port 3000, so the two can run side by side without
clashing).

```bash
npm run build   # production build
npm run start   # serve the production build, also on port 3100
npm run lint     # eslint
```

## Linking out to the main app

A couple of buttons ("Open the knowledge system", "Browse the species
catalogue", "Open the map") point at the main Plantiful app. By default
they point at `http://localhost:3000` (the main app's default local dev
port). To point them somewhere else — e.g. a deployed URL — set an env
var before building/running:

```bash
# visitor-site/.env.local
NEXT_PUBLIC_PLANTIFUL_APP_URL=https://plantiful.example.com
```

## Live species data (optional)

The "Explore verified plants" page (`/species`) and the `/plants/[id]`
pages can show real, published species data and a verified-observations
count, read live from the main Plantiful app's own Supabase project —
read-only, with the public anon key, same as how `web`'s own `/explore` and
`/species` pages already work for signed-out visitors.

Copy `.env.example` to `.env.local` and fill in the two Supabase values to
turn this on:

```bash
# visitor-site/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Until those are set, the site is still fully functional — it just shows an
honest "live species data isn't connected in this environment" message
instead of showing nothing, or worse, showing "no species yet" as if the
catalogue were really empty. A query that fails after being configured (bad
key, network issue, etc.) shows its own distinct error message too, rather
than collapsing into the same "empty" state — that was a real gap in the
main app's current `/explore` page (`fetchSpecies()` there returns `[]` for
both "zero species" and "not configured / failed"), fixed here.

The conservation-status filter buttons are built from whatever statuses
actually appear in the fetched species (not a fixed list), and there's a
"What do conservation status labels mean?" reference built from the
standard IUCN Red List categories for visitors who aren't familiar with the
terms. The `/plants/[id]` pages are deliberately visitor-friendly: no
internal species ID, no "Published" badge, and no link back into the main
app's staff-facing `/species/[id]` catalogue page — just the plant's
information and what its status means.

## Inquiry form (`/inquiry`)

Unlike the species pages, this one *writes*: submitting the form POSTs to
this site's own `/api/inquiries` route, which inserts a row into a new
`inquiries` table using the same public anon Supabase key the rest of the
site already uses for reads. That's safe only because of the database
side — `backend/supabase/migrations/add_inquiries.sql` gives the anon role
an INSERT-only policy on that table: no select, update, or delete, so this
site can never read back a submission, including the one it just created.

Reviewing and actioning submitted inquiries happens in the main `web`
app's `/admin/inquiries` page, signed in as a conservation officer or
admin — nothing about viewing inquiries lives on this no-sign-in site.

Until `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
(see "Live species data" above) and the `inquiries` table/migration exist
on the real project, the form honestly reports that inquiries can't be
saved right now, rather than pretending to succeed.

This is a first pass, not a complete contact-form system: there's no rate
limiting, CAPTCHA/spam protection, or email notification when a new
inquiry arrives — an officer or admin has to check `/admin/inquiries`
themselves. Worth adding before this is exposed on the open internet.

## What's intentionally not here

- No auth, no service-role key — only a public Supabase anon client. It's
  read-only for the two tables (`species`, `plant_records`) this site
  displays, and INSERT-only (via RLS, not app logic) for `inquiries`.
- No specific park opening hours / fees are stated on the page, since
  those can change — visitors are pointed to SFC's own official channels
  for that instead of us guessing or going stale.
- No light/dark toggle — this site defaults to dark and that's it for now.
  Both themes' CSS tokens exist in `globals.css` (copied/extended from the
  main app's palette) if a toggle is ever wanted later.
