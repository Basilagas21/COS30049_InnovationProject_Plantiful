<p align="center">
  <img src="Docs/Assets/plantiful_logo.jpg" alt="Plantiful Logo" width="400"/>
</p>

<h1 align="center">Plantiful</h1>

<p align="center">
  <strong>Smart Ground-Truthing and Digital Biodiversity System for Plant Species Documentation</strong><br/>
  Niah National Park, Sarawak
</p>

---

## Overview

Plantiful is an integrated mobile and web platform that streamlines biodiversity documentation for Sarawak Forestry Corporation (SFC) at Niah National Park. Botanists scan QR-tagged plants and record species data offline in the field, and conservation officers manage, review, and publish that data through a centralised web knowledge system. IoT sensors monitor rare and endangered species, alerting staff to threats in real time.

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
| IoT | MQTT (Mosquitto) + simulated sensors → InfluxDB |
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
│   └── src/app/           ← App Router pages (records, records/[id], profile, settings)
├── backend/
│   └── supabase/
│       ├── migrations/    ← 001_schema.sql, 002_rls.sql, 003_workflow_triggers.sql, apply_project.sql
│       └── seed.sql       ← seed officer/admin users and role assignments
├── iot/                   ← IoT sensor pipeline (MQTT → InfluxDB) and alerts
├── Docs/
│   ├── Assets/            ← logo, diagrams, images
│   ├── Design/            ← architecture, ER diagrams (.drawio), wireframes
│   │   └── Wireframes/
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

Create these two files (both are git-ignored) with the Supabase Project URL and anon key. These are only used on the client and are safe to expose. Values come from Supabase Dashboard > Project Settings > API.

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
3. Open Dashboard > SQL Editor and run `backend/supabase/migrations/001_schema.sql`, then `002_rls.sql`, then `003_workflow_triggers.sql`. Alternatively run `apply_project.sql`, which combines an idempotent version of all of them.
4. Run `backend/supabase/seed.sql` to create officer and admin users and assign roles.
5. Invite your own test users in Dashboard > Authentication > Users and tick "Email confirmed" (email confirmation is on).
6. The `record-photos` storage bucket and its policies are created by `apply_project.sql`. If you applied the files individually, create the bucket and policies manually.

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

### Checks

```
cd web && npm run lint && npm run build
cd mobile && npx tsc --noEmit && npx expo lint
```

## Docs

- [System Proposal Report](Docs/Reports/System_Proposal_Report.md)
- [Product Backlog Template](Docs/Templates/01_R_Product_Backlog_Template.md)
- [Project Proposal Template](Docs/Templates/COS30029 Complete Project_Proposal_Template.md)
