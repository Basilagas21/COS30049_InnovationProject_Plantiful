# Plantiful IoT

Python service and an ESP32 node that feed the IoT-based plant protection
feature. Sensor data lands in Supabase and surfaces for conservation officers on
the web dashboard at `/alerts`.

There are two ways to feed it, and both end at the same tables:

- **Simulator** (built). Synthetic readings pushed straight to Supabase. No
  hardware is attached. It exists so the whole pipeline (sensor rows → readings
  → rules → alerts → dashboard) can be built, demoed and reviewed end to end
  before any devices are procured.
- **Real hardware node, USB-first** (built). An ESP32 reads the sensors and
  prints one JSON line per reading over USB; a small bridge script on the host
  forwards each line to Supabase. A Wi-Fi/MQTT transport can replace the USB
  link later without changing anything downstream.

## What lives here

```
iot/
├── README.md
├── supabase_rest.py     ← minimal PostgREST client (Python standard library only)
├── publisher.py         ← simulated sensor registration + reading feed
├── evaluate.py          ← threat-rule evaluator, writes rows to alerts
├── bridge.py            ← USB-serial → Supabase bridge for the real node
├── requirements.txt     ← pyserial (only external dependency, used by the bridge)
├── test_pipeline.py     ← offline contract tests (no hardware or Supabase)
└── sketch_oct9a/
    └── sketch_oct9a.ino ← ESP32 firmware (DHT11 + PIR + soil + rain + LED)
```

The simulator uses no third-party Python dependencies — only `urllib`, `json`,
`os`, `time`, `random`, `argparse`, and `datetime` from the standard library. The
USB bridge is the one exception and needs `pyserial` (`python -m pip install -r
iot/requirements.txt`).

## Hardware node

Board: **ESP32-WROOM-32**. Sensors: DHT11 (temperature/humidity), PIR
(movement), soil-moisture probe (LM393 board), rain sensor (LM393 board), and a
status LED.

### Pin map

| Sensor | Signal | GPIO | Firmware |
|---|---|---|---|
| DHT11 | data | 4 | `#define DHT_PIN 4` |
| PIR | out | 27 | `#define PIR_PIN 27` |
| LED | anode via series resistor | 26 | `#define LED_PIN 26` |
| Soil probe board | AO | 34 | `#define SOIL_PIN 34` |
| Rain board | AO | 35 | `#define RAIN_PIN 35` |

Each `#define` must match the pin the wire is actually on. The firmware currently
uses D35 for the rain plate; if the wire is moved to D33, change the sketch to
`#define RAIN_PIN 33`. The D34 and rain headers use only their `S` (signal) pin;
their `V` and `G` pins stay empty.

### Wiring notes

- **Analog sensors must be on ADC1** (GPIO32–39). ADC2 is unusable while Wi-Fi is
  running, and the node needs Wi-Fi for the MQTT stage. GPIO34 is ADC1_CH6,
  GPIO33 is ADC1_CH5, GPIO35 is ADC1_CH7.
- GPIO34 and GPIO35 are **input-only**. That is fine for an analog read.
- **Voltage ceiling.** The soil and rain boards' `AO` swings with their own VCC.
  Power those boards from **3.3 V**, or divide `AO` down, so the signal never
  exceeds the ESP32's 3.3 V ADC limit. (The PIR is fine on 5 V because its output
  is already 3.3 V; the DHT11 runs on 3.3 V or 5 V.)
- Link the two breadboards `+` to `+` and `-` to `-` so every sensor shares a
  common ground.
- The LED sits behind a series resistor (≈220 Ω) on GPIO26.

### USB-first, and why the transport is swappable

The sensor-reading code and the JSON payload are **identical** for USB and MQTT.
Only the send step differs:

| | USB (now) | MQTT (later) |
|---|---|---|
| Firmware send | `Serial.println(json)` | Wi-Fi + `client.publish(topic, json)` |
| Host side | `bridge.py` reads the serial port (`pyserial`) | `ingest.py` subscribes to the broker |
| After the JSON | `SupabaseRest` insert | identical `SupabaseRest` insert |
| Tethered | yes, USB cable to the host | no, wireless via a broker |

Switching transports is therefore a change to one block of firmware plus a
different host script — the payload, the evaluator, the database and the
dashboard stay the same. USB is first because it needs no Wi-Fi or broker at the
demo site.

## Payload contract

The firmware prints one `DATA {json}` line per reading. The bridge ignores every
other line on the port (the QA/QC table), so both can be watched at once. This is
the same payload the MQTT path would publish:

```json
DATA {"sensor_id":"b7e2c4a1-8d3f-4c6b-9a2e-5f1d8c3e7b90","temperature":28.4,"humidity":87.0,"movement":false,"soil_moisture":41,"rain":false,"uptime_ms":123456}
```

`sensor_id` is the node's registered UUID (`SENSOR_ID` in the sketch). A field is
`null` when its sensor could not be read, and the bridge inserts the null as-is.
`soil_moisture` is a percentage derived from the raw ADC value; `rain` is a
boolean taken from the rain board's `AO` threshold. The node has no clock, so it
sends device uptime and the bridge stamps `recorded_at` with the host's UTC time
when the line arrives.

## How it maps to the database

| Table | Written by | Columns used |
|---|---|---|
| `sensors` | `publisher.py` / `bridge.py` (upsert on `sensor_id`) | `sensor_id`, `gps_lat`, `gps_lng`, `install_date` |
| `sensor_readings` | `publisher.py` / `bridge.py` | `sensor_id`, `temperature`, `humidity`, `movement`, `soil_moisture`, `rain`, `recorded_at` |
| `alerts` | `evaluate.py` | `sensor_id`, `alert_type`, `severity`, `resolved` |

`soil_moisture` (`double precision`) and `rain` (`boolean`) are new **nullable**
columns on `sensor_readings`; a reading may still omit them, so the simulator and
older rows remain valid. The migration is applied with the other schema changes,
and the `/alerts` page renders them once present.

Both the simulator and the bridge write with the **service-role key**, which
bypasses Row Level Security. That is required because `sensors`,
`sensor_readings` and `alerts` deliberately have no insert policy for signed-in
users (see `backend/supabase/migrations/apply_project.sql`) — officers only ever
*read* these tables, in the web dashboard at `/alerts`.

Two fixed sensors are registered by the simulator (upserted on every run), and
the hardware node registers its own on the first bridge run:

| Sensor ID | Site | GPS |
|---|---|---|
| `6b1f0a2e-9c4d-4e8b-a7f3-2d5c8e1b4a10` | Microclimate station, Niah Great Cave approach | 3.8074, 113.7698 |
| `d47c9b21-5f6a-4a3e-9c88-71b6e3f05d2c` | Soil probe, trail-side monitoring plot | 3.7986, 113.7764 |
| `b7e2c4a1-8d3f-4c6b-9a2e-5f1d8c3e7b90` | Field node (ESP32 hardware node) | 3.7986, 113.7764 |

## Setup

Set the Supabase credentials in your shell first (values from Supabase Dashboard >
Project Settings > API Keys; see `backend/.env.example`). The scripts exit with a
clear message if either is missing. The service key is labelled `service_role` on
older projects or `sb_secret_…` on newer ones — either works as
`SUPABASE_SERVICE_ROLE_KEY`.

```powershell
$env:SUPABASE_URL = "https://<project-ref>.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "<service-role / sb_secret_ key>"
```

Then apply the schema and policies per the root README so the `sensors`,
`sensor_readings` and `alerts` tables exist.

### Simulator (no hardware)

A single pass is enough for a quick demo; it registers the sensors and pushes one
batch of readings:

```
python iot/publisher.py --once
```

Continuous mode pushes every 30 seconds (configurable):

```
python iot/publisher.py --interval 30
```

Each push prints one status line, e.g. `2026-10-08T09:15:00+00:00 pushed 2
reading(s): 6b1f0a2e 28.4°C 87.0% movement=no`. Use `--seed <n>` for a
reproducible demo run.

Then evaluate threat rules over the recent readings:

```
python iot/evaluate.py
```

It prints every alert it raised (or confirms that active conditions are still
inside the alert cooldown).

### Hardware node (USB)

1. Wire the node per the pin map and make each `#define` match the pin in use.
2. Flash `sketch_oct9a/sketch_oct9a.ino` (Arduino IDE, board ESP32 Dev Module).
   It prints a human-readable QA/QC table at 115200 baud and, after each row, a
   `DATA {json}` line for the bridge to pick up.
3. With the Supabase variables set, run the bridge against the node's port:

   ```
   python iot/bridge.py --port COM5
   ```

4. The bridge checks each successfully stored reading immediately for heat,
   low humidity, and movement, inserting alerts outside the cooldown. Run
   `python iot/evaluate.py` periodically as well to detect silent sensors and
   retry alert checks if a previous online evaluation failed. The two scripts
   cannot detect silence from incoming readings alone.

The bridge exclusively owns the COM port: close Arduino Serial Monitor before
running it. The node has no GPS or clock; the bridge uses host UTC time and
registers the sensor's fixed location. Pass `--gps-lat` and `--gps-lng` for its
actual installation location rather than using the demonstration defaults.

Run the local contract checks without hardware or Supabase:

```
python -m unittest discover -s iot -p 'test_*.py'
```

## Threat rules

`evaluate.py` reads the last `--window-hours` (default 6) of `sensor_readings` and
applies:

| `alert_type` | Condition | Severity |
|---|---|---|
| `heat_stress` | temperature ≥ 36 °C | `high` (`critical` at ≥ 40 °C) |
| `drought_stress` | humidity ≤ 40 % | `medium` (`high` at ≤ 25 %) |
| `unusual_movement` | `movement` flag set on a reading | `medium` |
| `sensor_silent` | no reading for `--silent-after-minutes` (default 30) | `high` |

Dedupe: before inserting, the evaluator loads alerts raised in the last
`--cooldown-hours` (default 6) and skips any sensor/rule pair already alerted
inside that window, so a persistently hot afternoon produces one alert per
cooldown period rather than one per reading.

The rules read temperature, humidity and movement only. The soil-moisture and
rain columns now carry data from the hardware node, so rules for them (e.g.
`soil_dry` when moisture stays below a threshold, or `rain_detected` as context)
are a natural next addition.

## Web dashboard

Officers see the output at `/alerts` in the web app: recent alerts, and the
latest reading per sensor (temperature, humidity, movement, and now soil moisture
and rain). The page is server-rendered and reads on load — **refresh it** to pick
up new readings (there is no realtime push). It reads with the ordinary signed-in
session under the officer RLS policies — no service key ever reaches the browser.

## Path to MQTT (and real deployment)

The USB bridge is the first real-hardware step. To go wireless:

1. Add Wi-Fi + an MQTT client to the firmware and publish the same JSON to a
   topic such as `plantiful/plants/<record_id>/telemetry`. The sensor-reading
   code does not change.
2. Add `iot/ingest.py`, which subscribes to the broker and inserts via
   `SupabaseRest` — the MQTT twin of `bridge.py`. `evaluate.py` and the dashboard
   need no changes; they only depend on the table schema.
3. A broker (Mosquitto) is required. This is the transport chosen in the System
   Proposal (Section 6.4.4); HTTP/REST polling was evaluated and rejected there.

For a genuinely remote site such as Niah, Wi-Fi will not reach the node, so a
production build would use a gateway or a LoRa/cellular link. The demo uses USB
(now) or Wi-Fi (later), and this limitation is noted in the report.
