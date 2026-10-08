# Plantiful IoT

Python service that feeds the IoT-based plant protection feature. It registers simulated sensors, pushes synthetic environmental readings into Supabase, and evaluates threat rules that raise alerts for conservation officers.

**This is a simulator.** No physical hardware is attached — readings are generated on the machine running the scripts. It exists so the monitoring pipeline (sensor rows → readings → rules → alerts → officer dashboard) can be built, demoed, and reviewed end to end before any devices are procured.

## What lives here

```
iot/
├── README.md
├── supabase_rest.py    ← minimal PostgREST client (Python standard library only)
├── publisher.py        ← simulated sensor registration + reading feed
└── evaluate.py         ← threat-rule evaluator, writes rows to alerts
```

There are no third-party Python dependencies — only `urllib`, `json`, `os`, `time`, `random`, `argparse`, and `datetime` from the standard library.

## How it maps to the database

Both scripts talk to the Supabase REST API using the **service-role key**, which bypasses Row Level Security. That is required because `sensors`, `sensor_readings`, and `alerts` deliberately have no insert policy for signed-in users (see `backend/supabase/migrations/002_rls.sql`) — officers only ever *read* these tables, in the web dashboard at `/alerts`.

| Table | Written by | Columns used |
|---|---|---|
| `sensors` | `publisher.py` (upsert on `sensor_id`) | `sensor_id`, `gps_lat`, `gps_lng`, `install_date` |
| `sensor_readings` | `publisher.py` | `sensor_id`, `temperature`, `humidity`, `movement`, `recorded_at` |
| `alerts` | `evaluate.py` | `sensor_id`, `alert_type`, `severity`, `resolved` |

The schema has no soil-moisture or battery columns, so the simulator does not produce them; moisture stress is inferred from humidity, and loss/tamper is inferred from a sensor going silent.

Two fixed sensors are registered (upserted on every run):

| Sensor ID | Site | GPS |
|---|---|---|
| `6b1f0a2e-9c4d-4e8b-a7f3-2d5c8e1b4a10` | Microclimate station, Niah Great Cave approach | 3.8074, 113.7698 |
| `d47c9b21-5f6a-4a3e-9c88-71b6e3f05d2c` | Soil probe, trail-side monitoring plot | 3.7986, 113.7764 |

## Setup

1. Set the Supabase credentials in your shell (values from Supabase Dashboard > Project Settings > API; see `backend/.env.example`). The scripts exit with a clear message if either is missing.

   ```powershell
   $env:SUPABASE_URL = "https://<project-ref>.supabase.co"
   $env:SUPABASE_SERVICE_ROLE_KEY = "<service-role key>"
   ```

2. Apply `backend/supabase/migrations/001_schema.sql` (and the policies, per the root README) so the three tables exist.

3. **Run the feed.** A single pass is enough for a quick demo; it registers the sensors and pushes one batch of readings:

   ```
   python iot/publisher.py --once
   ```

   Continuous mode pushes every 30 seconds (configurable):

   ```
   python iot/publisher.py --interval 30
   ```

   Each push prints one status line, e.g. `2026-10-08T09:15:00+00:00 pushed 2 reading(s): 6b1f0a2e 28.4°C 87.0% movement=no`. Use `--seed <n>` for a reproducible demo run.

4. **Evaluate threat rules** over the recent readings:

   ```
   python iot/evaluate.py
   ```

   It prints every alert it raised (or confirms that active conditions are still inside the alert cooldown).

## Threat rules

`evaluate.py` reads the last `--window-hours` (default 6) of `sensor_readings` and applies:

| `alert_type` | Condition | Severity |
|---|---|---|
| `heat_stress` | temperature ≥ 36 °C | `high` (`critical` at ≥ 40 °C) |
| `drought_stress` | humidity ≤ 40 % | `medium` (`high` at ≤ 25 %) |
| `unusual_movement` | `movement` flag set on a reading | `medium` |
| `sensor_silent` | no reading for `--silent-after-minutes` (default 30) | `high` |

Dedupe: before inserting, the evaluator loads alerts raised in the last `--cooldown-hours` (default 6) and skips any sensor/rule pair already alerted inside that window, so a persistently hot afternoon produces one alert per cooldown period rather than one per reading.

## Web dashboard

Officers see the output at `/alerts` in the web app: recent alerts, and the latest reading per sensor. The page reads with the ordinary signed-in session under the officer RLS policies — no service key ever reaches the browser.

## Path to real hardware

To swap in physical devices, replace the random-walk generator in `publisher.py` (`Walk` / `build_reading`) with the real transport: decode MQTT messages from a broker or line-based JSON from a serial/USB sensor, map the fields onto the same `sensor_readings` payload, and keep the REST push as-is. `evaluate.py` and the dashboard need no changes — they only depend on the table schema. If the schema gains soil-moisture or battery columns later, add the matching rules here.
