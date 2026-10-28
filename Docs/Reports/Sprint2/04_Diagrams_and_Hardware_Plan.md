# Sprint 2 diagrams and hardware plan

[Sprint 2 index](../../README.md#sprint-2)

## 1. Figure specifications

The D-02 physical wiring review draft was generated on 28 October 2026. Its [image, editable source and online editing instructions](../../README.md#d-02-physical-build) are available for user review. Other figures below remain planned. Existing Sprint 1 sources may be reused after review.

| ID | Figure | Required content | Placement |
|---|---|---|---|
| D-01 | Architecture and deployment | Mobile SQLite, browser/server, Supabase Auth/DB/Storage, ESP32, trusted bridge host, actual protocols, roles and privileged boundary | Architecture section |
| D-02 | Electrical wiring and assembly | Board/shield, sensors, actual GPIO, supply voltage, common ground, LED resistor and unused DO outputs. Companion annotated hardware photograph | IoT implementation |
| D-03 | IoT reading-to-alert flow | Serial payload, host timestamp, validation, storage, independent rule checks, cooldown, periodic silence check and dashboard refresh. Separate simulator branch | IoT integration |
| D-04 | Offline sync sequence | Local capture, persistence, reconnect, identity lookup, version check, photo upload/retry, conflict and review resolution | Integration |
| D-05 | Review/publication lifecycle | Observation pending/approved/rejected/resubmitted states, officer decisions, species publication and public visibility | Prototype workflow |
| D-06 | ERD | Actual tables, keys and cardinalities grouped by identity, catalogue, observations, IoT and reporting | Data design |
| D-07 | Role-based task flows | Botanist capture/sync, officer review/monitoring, administrator actions and public browsing, including recovery paths | Usability |

Optional additions are a focused before/after change diagram, an alert decision figure if D-03 becomes crowded, and charts based on actual test or usability results. Do not fill a chart with target values and label it as observed performance.

## 2. Source and export workflow

1. Read the implemented code and confirmed hardware configuration.
2. Draw an editable source using Mermaid for logical flows or a suitable schematic tool for physical wiring.
3. Review terminology, roles, states and protocols with the component owner.
4. Export a readable vector figure where practical. Test any raster image at final page size.
5. Add a numbered caption and explain what the figure establishes.
6. Check the figure again against the tested release before submission.

When created, store editable files under `diagrams/source/` and exports under `diagrams/exported/` inside this Sprint 2 folder. Use stable names such as `D-01_system_architecture`. Keep source and export versions together.

Existing references are [Sprint 1 figure sources](../Sprint1/diagrams/FIGURES.md) and [shared assets](../../README.md#shared-assets). Existing figure numbering belongs to Sprint 1. Assign final Sprint 2 caption numbers when the report order is stable.

## 3. Physical wiring supplied by the team

This is a design record supplied in conversation. It is not a measured electrical verification. Board coordinates assume standard a-to-e and f-to-j connected row groups.

### Shield to breadboards

| Shield pin | Destination | Purpose |
|---|---|---|
| D04 S | Board 1, 4a | DHT11 data |
| D04 V | Positive rail | Sensor power, voltage unconfirmed |
| D04 G | Negative rail | Ground |
| D27 S | Board 1, 27b | PIR signal |
| D27 V | Positive rail | Sensor power |
| D27 G | Negative rail | Ground |
| D26 S | Board 1, 26a | LED signal |
| D26 G | Board 1, 25j | LED return |
| D34 S | Board 2, 24g | Soil AO |
| D35 S | Board 2, 30g | Rain AO. User confirmed D35 on 28 October 2026 |

Soil and rain use the D34 and D35 shield S pins only. Their V and G header pins remain empty. Module power comes from the rails. The user's D35 confirmation supersedes the conflicting D33 entry in the earlier shield table. Physical assembly evidence remains pending.

### Board 1 components

| Component pin | Destination |
|---|---|
| DHT11 positive / OUT / negative | Positive rail / 4b / negative rail |
| PIR VCC / OUT / GND | Positive rail / 27a / negative rail |
| Resistor first / second leg | 26b / 25b |
| LED anode / cathode | 25e / 25f |

The LED circuit runs from D26 S through row 26, the resistor, row 25 a-to-e, the LED, row 25 f-to-j, and D26 G. The LED crosses the centre gap. Record the resistor value.

### Board 2 modules and rail links

| Module pin | Component coordinate | Wire |
|---|---|---|
| Soil VCC | 21f | 21g to positive rail |
| Soil GND | 22f | 22g to negative rail |
| Soil DO | 23f | Unused |
| Soil AO | 24f | 24g to D34 S |
| Rain VCC | 27f | 27g to positive rail |
| Rain GND | 28f | 28g to negative rail |
| Rain DO | 29f | Unused |
| Rain AO | 30f | 30g to D35 S, confirmed by the user on 28 October 2026 |

Board 1 positive rail links to board 2 positive rail. Board 1 negative rail links to board 2 negative rail. Confirm continuity across any split rails.

## 4. Open hardware and calibration details

| Item | Repository evidence | Required confirmation |
|---|---|---|
| Rain input | Firmware GPIO 35 and user-confirmed D35 wiring on 28 October 2026 | Companion assembly photo and installed firmware version |
| Supply | Wiring description says V | Shield model, jumper setting and actual rail voltage |
| LED resistance | Resistor present in supplied map | Resistance value |
| PIR and module models | Generic components described | Exact parts and supply/output specifications |
| Transport | Reviewed sketch emits serial DATA lines | Whether the running node uses this firmware or another version |
| Soil calibration | Dry 4095, wet 1650 | Wet constant marked placeholder. Retain measured dry/wet raw samples |
| Rain calibration | Dry 4095, wet 2200 | Wet constant marked placeholder. Retain measured conditions and samples |
| Reporting interval | Configured 2000 ms, printed four seconds | Correct presentation and measure actual timing |

Check analogue output compatibility with ESP32 input limits. ADC attenuation configuration is not protection against an excessive input voltage. Calibration percentages are normalised indicators unless validated against a physical reference, not certified soil water-content measurements.

## 5. Figure quality checklist

- Use consistent names across code, tables and captions.
- Label arrows with actual data or protocols and show their direction.
- Show fixed deployment coordinates rather than an on-board GPS receiver unless hardware changes.
- Distinguish host internet connectivity from ESP32 transport.
- Show that heat, humidity and movement checks can all produce findings from one reading.
- Distinguish observation approval from species publication.
- Identify implemented and proposed components explicitly.
- Use readable fonts and sufficient contrast at final page size.
- Include legends where colour or line style carries meaning.
- Introduce each figure in the text and explain its purpose and limitations.
