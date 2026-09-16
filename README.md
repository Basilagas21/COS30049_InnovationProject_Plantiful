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

Plantiful is an integrated mobile and web platform that streamlines biodiversity documentation for Sarawak Forestry Corporation (SFC) at Niah National Park. Botanists scan QR-tagged plants and record species data offline in the field; conservation officers manage, review, and publish that data through a centralised web knowledge system. IoT sensors monitor rare and endangered species, alerting staff to threats in real time.

**Industry partner:** NeuonAI (SFC's commercialisation partner)

## Team (COS30049 Group 7)

| Name | Student ID | Role |
|---|---|---|
| Nathan Sebastian Learmonth | 102782258 | Team Lead, Web Knowledge System (Records) |
| Badrul Aliff Aiman bin Badrulmunirzaki | 102778273 | Web Knowledge System (Reporting & Maps) |
| Muhammad Maqeel bin Muhammad Kahfi | 102782384 | Mobile App (Sync & Backend APIs) |
| Ashley Wallen Anak Winston | 105806559 | Integration, PM & Documentation |
| Basill Agas Anak Heatley Rogers | 102778888 | Mobile App (Field Data Capture) |
| Jay | — | Support / Auxiliary |

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | Flutter (offline-first, QR, GPS, camera) |
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
  <em>Sample/draft ER diagram — TODO: replace with final version</em>
</p>

### UML Sequence Diagrams

<p align="center">
  <img src="Docs/Assets/UML_Sequence_Botanist.png" alt="UML Sequence — Botanist" width="600"/><br/>
  <strong>Botanist workflow</strong>
</p>

<p align="center">
  <img src="Docs/Assets/UML_Sequence_ConservationOfficer.png" alt="UML Sequence — Conservation Officer" width="600"/><br/>
  <strong>Conservation Officer workflow</strong>
</p>

<p align="center">
  <img src="Docs/Assets/UML_Sequence_Admin.png" alt="UML Sequence — Admin" width="600"/><br/>
  <strong>Admin workflow</strong>
</p>

## Repository Structure

```
COS30049_InnovationProject_Plantiful/
├── Docs/
│   ├── Assets/              ← logo, diagrams, images
│   ├── Design/              ← architecture, ER diagrams (.drawio), wireframes
│   │   └── Wireframes/
│   ├── Reports/             ← proposal, final report
│   └── Templates/           ← docx + md templates
├── .gitattributes
├── .gitignore
└── README.md
```

## Docs

- [System Proposal Report](Docs/Reports/System_Proposal_Report.md)
- [Product Backlog Template](Docs/Templates/01_R_Product_Backlog_Template.md)
- [Project Proposal Template](Docs/Templates/COS30029 Complete Project_Proposal_Template.md)

## Branching Convention

```
main          ← clean, production-ready
├── feat/*    ← new features
├── fix/*     ← bug fixes
├── docs/*    ← documentation only
└── chore/*   ← tooling, config, housekeeping
```

All commits follow [conventional commits](https://www.conventionalcommits.org/): `type(scope): description`.
