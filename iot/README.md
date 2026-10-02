# Plantiful IoT

MQTT-based sensor pipeline for the IoT-based plant protection feature. Simulated and (later) real sensors publish environmental telemetry, a small ingestion service validates and stores it, and a rules engine raises alerts so conservation staff can react.

No physical hardware yet. Everything below runs against a simulator so the pipeline can be built and demoed before any devices exist (Readme tech stack and Report Section 5.3 backlog item).

## What lives here

```
iot/
├── README.md
├── contract/
│   └── telemetry.schema.json     ← MQTT topic + payload contract (issue #27)
├── simulator/
│   ├── publisher.py              ← fake station telemetry publisher (issue #28)
│   └── stations.json             ← fake station config
├── ingestion/
│   └── build.py                  ← subscribes, validates, writes to Supabase (issue #29)
├── alerts/
│   └── evaluate.py               ← rule evaluation over stored readings (issue #30)
└── .env.example                  ← MQTT + Supabase credentials template
```

## Tech stack

| Layer | Technology |
|---|---|
| Transport | MQTT (Mosquitto broker, HiveMQ public broker for local dev) |
| Simulator | Python (`paho-mqtt`) |
| Ingestion | Python or Supabase Edge Function |
| Storage | Supabase (`stations`, `sensor_readings`, `alerts` tables) |
| Dashboard | Web app admin area (see `web/`) |

## Topics (issue #27)

| Topic | Direction | Payload |
|---|---|---|
| `plantiful/<station_id>/telemetry` | station → broker | temperature, humidity, soil_moisture, timestamp, station_id |
| `plantiful/<station_id>/alert` | rules → dashboards | alert_level, rule, value, timestamp |

## Setup

1. **Copy the env template** and fill in values. Real keys must never be committed (see root `.gitignore`).

   ```
   cp iot/.env.example iot/.env
   ```

2. **Install Python dependencies** (create a virtual environment first, e.g. `python -m venv .venv`).

   ```
   pip install paho-mqtt
   ```

3. **Create the Supabase tables.** Apply the `stations`, `sensor_readings`, `alerts` migration (drop it in `backend/supabase/migrations/` and push, per issue #29).

4. **Run a broker** for local dev.

   - Option A, Mosquitto via Docker:
     ```
     docker run -it -p 1883:1883 eclipse-mosquitto
     ```
   - Option B, HiveMQ public broker: use the public broker URL and a unique client ID.

5. **Run the simulator** (issue #28). It publishes valid telemetry on the contract topics for the configured fake stations.

   ```
   python iot/simulator/publisher.py
   ```

6. **Run the ingestion service** (issue #29). It subscribes to the telemetry topic, validates each payload against `contract/telemetry.schema.json`, and writes valid readings to Supabase.

   ```
   python iot/ingestion/build.py
   ```

7. **Run the alerts evaluator** (issue #30) to flag readings outside configured thresholds.

   ```
   python iot/alerts/evaluate.py
   ```

## Contract-first rule

Never change a topic or payload field without updating `contract/telemetry.schema.json` first. The simulator, ingestion service, and web dashboard all read from that single source of truth.

## Related issues

- IoT pipeline: #27 to #31.
- Admin IoT monitoring dashboard (web): #31.