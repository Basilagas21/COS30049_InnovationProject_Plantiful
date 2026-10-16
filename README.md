<p align="center">
  <img src="Docs/Assets/plantiful_logo.png" alt="Plantiful Logo" width="400"/>
</p>

<h1 align="center">Plantiful</h1>

<p align="center">
  <strong>Smart Ground-Truthing and Digital Biodiversity System for Plant Species Documentation</strong><br/>
  Niah National Park, Sarawak
</p>

---

## Overview

Plantiful is an integrated mobile and web platform that streamlines biodiversity documentation for Sarawak Forestry Corporation (SFC) at Niah National Park. Botanists scan QR-tagged plants and record species data offline in the field, and conservation officers manage, review, and publish that data through a centralised web knowledge system. An IoT monitoring layer records environmental conditions around monitored field sites and raises alerts that conservation officers review in the web dashboard. It can be fed either by a simulated publisher or by a real ESP32 sensor node over USB.

**Industry partner:** NeuonAI (SFC's commercialisation partner)

## Team (COS30049 Group 7)

| Name | Student ID | Role |
|---|---|---|
| Nathan Sebastian Learmonth | 102782258 | Web Knowledge System (Records) |
| Badrul Aliff Aiman bin Badrulmunirzaki | 102778273 | Web Knowledge System (Reporting & Maps) |
| Muhammad Maqeel bin Muhammad Kahfi | 102782384 | Mobile App (Sync & Backend APIs) |
| Ashley Wallen Anak Winston | 105806559 | Integration, PM & Documentation |
| Basill Agas Anak Heatley Rogers | 102778888 | Team Lead, Mobile App (Field Data Capture) |
| Gae Jayden MWINE | 104393610 | IoT-Based Plant Protection (sensor data pipeline, alert/threat detection logic, monitoring dashboard) |

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (offline-first, QR, GPS, camera) |
| Web | React / Next.js + Tailwind |
| Backend & DB | Supabase (PostgreSQL, auth, storage, auto-generated APIs) |
| Offline storage | SQLite (on-device) |
| IoT | ESP32 sensor node (DHT11/PIR/soil/rain) → USB bridge or Python simulator → threat-rule evaluator → Supabase (`sensors`, `sensor_readings`, `alerts`) → officer alert dashboard |
| Security testing | OWASP ZAP |
| Version control | Git + GitHub |
| Hosting | Vercel / Render + Supabase |

## System Architecture

<p align="center">
  <img src="Docs/Assets/System_Architecture.png" alt="System Architecture" width="700"/>
</p>

### ER Diagram

<p align="center">
  <img src="Docs/Assets/ER_diagram.jpg" alt="ER Diagram" width="700"/><br/>
  <em>ER diagram. Plantiful data model.</em>
</p>

### UML Sequence Diagrams

<p align="center">
  <img src="Docs/Assets/UML_Sequence_Botanist.png" alt="UML Sequence - Botanist" width="600"/><br/>
  <strong>Botanist workflow</strong>
</p>

<p align="center">
  <img src="Docs/Assets/UML_Sequence_ConservationOfficer.png" alt="UML Sequence - Conservation Officer" width="600"/><br/>
  <strong>Conservation Officer workflow</strong>
</p>

<p align="center">
  <img src="Docs/Assets/UML_Sequence_Admin.png" alt="UML Sequence - Admin" width="600"/><br/>
  <strong>Admin workflow</strong>
</p>

## Repository Structure

```
COS30049_InnovationProject_Plantiful/
├── mobile/                ← React Native / Expo app (offline field data capture)
│   └── src/app/           ← Expo Router screens (scan, capture, records, sync, profile)
├── web/                   ← Next.js web knowledge system for conservation officers
│   └── src/app/           ← App Router pages (explore, species, map, records, reports, alerts, profile)
├── backend/
│   └── supabase/
│       ├── migrations/    ← 001_schema.sql + apply_project.sql (consolidated, idempotent); applied/ holds the 002–011 history
│       └── seed.sql       ← assigns officer/admin roles by email + sample species catalogue
├── iot/                   ← ESP32 firmware, USB bridge, simulated publisher + threat-rule evaluator (writes to Supabase)
├── Docs/
│   ├── Assets/            ← logo, diagrams, images
│   ├── Reports/           ← proposal, final report
│   └── Templates/         ← docx + md templates
├── .gitignore
└── README.md
```

## How to Run

### Prerequisites

- Node.js 20+ and npm
- The Expo Go app on a phone (Android or iOS), or an Android emulator
- A Supabase project (free tier is enough) with the Project URL and anon key

### 1. Configure environment

Create these two files (both are git-ignored) with the Supabase Project URL and anon/publishable key. These are only used on the client and are safe to expose. Values come from Supabase Dashboard > Project Settings > API Keys (the project URL is shown at the top of that page; the public key may be labelled `anon` or, on newer projects, `sb_publishable_…`).

`mobile/.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
# Optional, defaults to record-photos
EXPO_PUBLIC_SUPABASE_PHOTO_BUCKET=record-photos
```

`web/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

### 2. Set up the backend (one time)

1. Create a project in Supabase.
2. Enable Supabase Auth with email/password.
3. Open Dashboard > SQL Editor and run the two scripts in `backend/supabase/migrations/`: `001_schema.sql` first (tables), then `apply_project.sql` — one consolidated, idempotent script covering everything else (RLS policies, schema backfills, workflow triggers, photo visibility, the botanist approval gate, the private reports bucket, storage-bucket policies, and admin role management). The per-feature files it consolidates are kept for reference in `migrations/applied/` — never run them individually.
4. Run `backend/supabase/seed.sql` to assign officer and admin roles by email — edit its two `update` statements to your own addresses first — and to load the sample species catalogue.
5. Invite your own test users in Dashboard > Authentication > Users (dashboard-created users are confirmed automatically) — or register through the app; if registration says "Email not confirmed", either turn off "Confirm sign up" under Authentication > Emails (requires Admin project role) or run the one-off `update auth.users set email_confirmed_at = now() …` snippet for that account.
6. Verify the setup with the scripts under `backend/scripts/`: `verify_public_write_block.sql` should show anonymous writes rejected and anonymous reads limited to approved and published data, and `verify_record_photo_write.sql` must report `PASS` on every line before the mobile Sync now button is used.
7. For the IoT monitoring dashboard, run `web/sql/alerts_history.sql` once in the SQL Editor (re-runnable; adds the read path used by `/alerts` — no service key, existing RLS still applies).

### 3. Run the web app

```
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with an officer or admin account to see all records, approve or reject pending ones, and open record details. Search species in the records page with the suggestion box.

### 4. Run the mobile app

```
cd mobile
npm install --legacy-peer-deps
npx expo start
```

Scan the QR code shown by Expo with Expo Go on your phone, or press `a` for an Android emulator. Then:

1. Sign in on the Profile tab with a botanist account.
2. Scan a plant QR tag on the Scan tab.
3. Use the flashlight toggle in dark environments.
4. Fill in the capture details (species, height, morphology, notes), take photos, and save.
5. Go to Sync and tap "Sync now" to push offline captures to the central database as submitted records.

### 5. Verify the full loop

- A record captured on mobile shows up as Pending on the web for an officer.
- An officer approves or rejects it. Approved records become visible to the public portal.
- Botanists can see their own records on the web (including pending ones) after the `apply_project.sql` policy is applied.

### 6. Run the IoT monitor (optional demo)

Two ways to feed the same tables and dashboard: a simulator (no hardware) or a real ESP32 node over USB.

**Simulator (no hardware):**

```
python iot/publisher.py --once
python iot/evaluate.py
```

The publisher registers simulated sensors and pushes synthetic readings; the evaluator applies threat rules and raises alerts.

**Real ESP32 node (USB):**

1. Wire the node and flash `iot/sketch_oct9a/sketch_oct9a.ino` (Arduino IDE, board ESP32 Dev Module). It prints a QA/QC table plus one `DATA {json}` line per reading at 115200 baud.
2. Close the Arduino Serial Monitor, then in a PowerShell terminal set the credentials from Project Settings > API Keys (use the secret key — `service_role`, or `sb_secret_…` on newer projects):

```
$env:SUPABASE_URL = "https://<project-ref>.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "<secret key>"
python -m pip install -r iot/requirements.txt
python iot/bridge.py --port COM5
```

The bridge registers the node's sensor, inserts each reading, and raises heat/humidity/movement alerts immediately. The secret key stays on this host only — never in the sketch, mobile app, or web client.

**Dashboard:** officers review alerts and the latest reading per sensor at `/alerts` in the web app. It shows per-sensor status cards, environmental trend charts, movement/rain event strips, and an alert timeline with a 1d/5d/7d/all range selector; live readings and alerts auto-refresh every 10s and charts every 60s (paused when the tab is hidden), or use **Refresh now**. Environmental history is served by a database function, so run `web/sql/alerts_history.sql` once in the Supabase SQL Editor (re-runnable; no service key needed) or the charts report that setup is required. Details in [`iot/README.md`](iot/README.md).

### Checks

```
cd web && npm run lint && npm run build
cd mobile && npx tsc --noEmit && npx expo lint
```

## Docs

- [System Proposal Report](Docs/Reports/System_Proposal_Report.md)
- [Product Backlog Template](Docs/Templates/01_R_Product_Backlog_Template.md)
- [Project Proposal Template](Docs/Templates/COS30029 Complete Project_Proposal_Template.md)
