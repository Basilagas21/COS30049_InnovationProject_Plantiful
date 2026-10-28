# Sprint Report Figures - Diagram Sources

These are the renderable sources for the figures referenced in `Docs/Reports/Sprint1/Sprint_Report_1.md`.
Render each Mermaid block to PNG or SVG (for example with the Mermaid CLI or the draw.io import), then paste it into Word.

Figures that do not suit Mermaid are listed at the end with their recommended tool.

---

## Figure 1. Sprint timeline (Section 1.2)

Dates below are indicative. Adjust to your actual trimester dates before rendering.

```mermaid
gantt
    title Sprint timeline (Weeks 6 to 12)
    dateFormat YYYY-MM-DD
    axisFormat %d %b
    section Sprint 1 (Weeks 6-9)
    Backend PB-1              :a1, 2026-09-14, 21d
    Mobile PB-2               :a2, after a1, 14d
    Web PB-3 PB-5             :a3, after a1, 14d
    Sync PB-4                 :a4, after a2, 10d
    IoT PB-6                  :a5, after a2, 14d
    Officer approval PB-7     :milestone, m1, after a4, 0d
    Sprint 1 review           :milestone, m2, after a5, 0d
    section Sprint 2 (Weeks 10-12)
    IoT tuning PB-8           :b1, after m2, 10d
    Security PB-9             :b2, after m2, 14d
    Integration PB-10         :b3, after b1, 10d
```

---

## Figure 4. Alert logic (Section 2.8)

```mermaid
flowchart TD
    A[Reading received] --> B{Temperature at or above critical}
    B -- yes --> C[Raise heat stress critical]
    B -- no --> D{Temperature at or above high}
    D -- yes --> E[Raise heat stress high]
    D -- no --> F{Air humidity low}
    F -- yes --> G[Raise drought stress]
    F -- no --> H{Motion detected}
    H -- yes --> I[Raise unusual movement]
    H -- no --> J[No alert for this reading]
    C --> K{Cooldown active for this type}
    E --> K
    G --> K
    I --> K
    K -- yes --> L[Suppress duplicate]
    K -- no --> M[Write alert row]
    N[Periodic silent-sensor pass] --> O{Node stopped reporting}
    O -- yes --> P[Raise silent sensor alert]
```

---

## Figure 5. System context (Section 2.9)

```mermaid
flowchart LR
    Bot[Botanist] -->|capture and sync| SYS((Plantiful system))
    Off[Conservation officer] -->|review, publish, monitor| SYS
    Adm[Administrator] -->|manage roles| SYS
    Pub[Public visitor] -->|read only| SYS
    Node[Sensor node] -->|readings| SYS
    SYS -->|alerts and records| Off
    SYS -->|published content| Pub
```

---

## Figure 6. Three-tier architecture (Section 2.9)

```mermaid
flowchart TB
    subgraph Client[Client tier]
        Mob[Mobile app - offline first]
        Web[Web app - officers, admin, public]
    end
    subgraph Backend[Application and data tier]
        Supa[Supabase - PostgreSQL, auth, RLS, REST, storage]
    end
    subgraph Device[Device tier]
        ESP[ESP32 node with sensors]
        Bridge[Host bridge]
    end
    Mob -->|REST, online path| Supa
    Web -->|REST| Supa
    ESP -->|USB serial, about 2 s| Bridge
    Bridge -->|REST with service role| Supa
    Supa -->|alerts and readings| Web
    Mob -. offline path: local SQLite .-> Mob
```

---

## Figure 7. From capture to public record (Section 2.9.1)

```mermaid
flowchart LR
    A[Botanist captures offline] --> B[Saved to device SQLite]
    B --> C[Sends from sync centre]
    C --> D[Supabase checks owner and version]
    D --> E[Record stored as submitted]
    E --> F[Officer approves in queue]
    F --> G[Approval stamped and species published]
    G --> H[Visible on public explore portal]
```

---

## Figure 8. Navigation maps (Section 3.2)

```mermaid
flowchart TB
    subgraph Mobile[Authored mobile flow - botanist]
        M1[Sign in] --> M2[Capture]
        M2 --> M3[Records]
        M2 --> M4[Species]
        M2 --> M5[Sync centre]
        M2 --> M6[Profile]
    end
    subgraph WebApp[Web sitemap]
        W1[Public: home, explore, map]
        W2[Officer: records, approvals, species, reports, alerts]
        W3[Admin: users]
    end
```

---

## Figure 9. IoT data flow with timing (Section 3.4)

```mermaid
sequenceDiagram
    participant ESP as ESP32 node
    participant Br as Host bridge
    participant DB as Supabase
    participant Ev as Evaluator
    participant Dash as Officer dashboard
    loop about every 2 seconds
        ESP->>Br: serial line with reading
        Br->>DB: insert into sensor_readings
        Br->>Ev: evaluate reading
        Ev->>DB: write alert when a rule fires
    end
    Dash->>DB: refresh live state every 10 seconds
    Dash->>DB: refresh chart history every 60 seconds
```

---

## Figure 10. Sequence, one observation (Section 3.6)

```mermaid
sequenceDiagram
    actor Bot as Botanist
    participant Mob as Mobile app
    participant DB as Supabase
    actor Off as Officer
    participant Pub as Public portal
    Bot->>Mob: scan QR and update record offline
    Mob-->>Mob: save to local store
    Bot->>Mob: send from sync centre
    Mob->>DB: push record and photo with version
    DB-->>Mob: accepted and version bumped
    Off->>DB: open approvals queue
    Off->>DB: approve record
    DB-->>Pub: record and species now visible
```

---

## Figure 11. Real-life deployment (Section 3.6)

```mermaid
flowchart LR
    subgraph Field[Field near the plant]
        Plant[Tagged plant] --- Node[ESP32 node with sensors]
    end
    subgraph Post[Ranger post]
        Bridge[Host computer running the bridge]
    end
    subgraph Office[Conservation office]
        Dash[Officer dashboard]
    end
    Node -->|USB serial| Bridge
    Bridge -->|internet| Cloud[Supabase cloud]
    Cloud --> Dash
```

---

## Figures that suit other tools

| Figure | Section | Recommended tool | Notes |
|---|---|---|---|
| Figure 2. ERD | 2.4 | draw.io or dbdiagram.io | Light background, show primary and foreign keys, group tables into identity, species, field records, IoT, and system. Replace the dark `Docs/Assets/ER_diagram.jpg`. |
| Figure 3. IoT wiring | 2.8 | Fritzing or Wokwi | Use the real GPIO pins below. Mark analog and digital pins and show power and ground. |
| Figure 12. Acceptance target status | 5.3 | draw.io or Excel | Traffic-light chart of the seven targets, marked verified, pending, or partial. |
| Figure 13. Security findings and gates | 5.4 | draw.io or Excel | Bar of findings by status plus a pipeline strip of the four workstream stages. |
| Figure 14. Committed versus delivered | 7.1 | draw.io or Excel | Bar chart of 51 committed, 59 delivered, 80 total. |
| Figure 15. Risk matrix | 7.2 | draw.io | Plot R1 to R7 and I1 to I2 by likelihood and impact. |

## Figure 3 pin map (from `iot/sketch_oct9a/sketch_oct9a.ino`)

These are the real pins in the firmware. Use them in the wiring diagram so a marker can cross-check the drawing against the code.

| Component | ESP32 pin | Type | Notes |
|---|---|---|---|
| DHT11 data | GPIO 4 | digital | temperature and humidity |
| PIR motion signal | GPIO 27 | digital input | |
| PIR indicator LED | GPIO 26 | digital output | optional on the diagram |
| Soil moisture signal | GPIO 34 | analog, ADC1 | input only, 12-bit |
| Rain sensor signal | GPIO 35 | analog, ADC1 | 12-bit |
| Power | 3V3 | power | |
| Ground | GND | ground | |

Calibration values in the firmware for the analog sensors: soil dry raw 4095, soil wet raw 1650, rain dry raw 4095, rain wet raw 2200. The analog pins use 11 dB attenuation for the full 0 to 3.3 V range.
