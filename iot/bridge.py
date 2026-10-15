"""USB-serial bridge for the real Plantiful sensor node.

Reads one JSON line per reading from the ESP32 over USB serial and inserts it
into Supabase as a sensor_readings row. This is the wired twin of the
simulator (publisher.py): once the firmware joins Wi-Fi, iot/ingest.py can take
over without any change to the database or the dashboard.

The node has no real-time clock, so this bridge stamps recorded_at with the
host's UTC time as each line arrives.

The firmware prints its human-readable QA/QC table and, after each row, a line
of the form:

    DATA {"sensor_id":"...","temperature":28.4,"humidity":87.0,
          "movement":false,"soil_moisture":41,"rain":false,"uptime_ms":12345}

Only the "DATA " lines are parsed; everything else on the serial port is
ignored, so the QA/QC table can be watched in the Arduino serial monitor at the
same time.

Requires pyserial (pip install pyserial).

Usage:
    python iot/bridge.py --port COM5
    python iot/bridge.py --port /dev/ttyUSB0 --baud 115200
"""

import argparse
import json
import sys
from datetime import datetime, timezone

from supabase_rest import SupabaseError, SupabaseRest

try:
    import serial
except ImportError:  # handled with a clear message in main()
    serial = None

DATA_PREFIX = "DATA "

# Matches SENSOR_ID in sketch_oct9a.ino, so the node is registered on first run
# even before the first reading arrives.
DEFAULT_SENSOR_ID = "b7e2c4a1-8d3f-4c6b-9a2e-5f1d8c3e7b90"
DEFAULT_GPS_LAT = 3.7986
DEFAULT_GPS_LNG = 113.7764
DEFAULT_INSTALL_DATE = "2026-10-15"

READING_FIELDS = ("temperature", "humidity", "movement", "soil_moisture", "rain")


def parse_line(raw):
    """Return the payload dict for a 'DATA {...}' line, or None to ignore it."""
    try:
        text = raw.decode("utf-8", "replace").strip()
    except AttributeError:
        text = str(raw).strip()

    if not text.startswith(DATA_PREFIX):
        return None

    try:
        payload = json.loads(text[len(DATA_PREFIX):])
    except json.JSONDecodeError:
        return None

    return payload if isinstance(payload, dict) else None


def build_row(payload, sensor_id, recorded_at):
    row = {"sensor_id": sensor_id, "recorded_at": recorded_at}
    for field in READING_FIELDS:
        row[field] = payload.get(field)
    return row


def describe(row):
    def number(value, suffix="", digits=1):
        if value is None:
            return "—"
        return f"{value:.{digits}f}{suffix}"

    movement = "yes" if row["movement"] else "no" if row["movement"] is not None else "—"
    soil = "—" if row["soil_moisture"] is None else f"{row['soil_moisture']}%"
    rain = "yes" if row["rain"] else "no" if row["rain"] is not None else "—"

    return (
        f"{row['sensor_id'][:8]} {number(row['temperature'], '°C')} "
        f"{number(row['humidity'], '%', digits=0)} movement={movement} "
        f"soil={soil} rain={rain}"
    )


def main():
    parser = argparse.ArgumentParser(description="Plantiful USB-serial bridge")
    parser.add_argument("--port", required=True,
                        help="serial port of the node, e.g. COM5 or /dev/ttyUSB0")
    parser.add_argument("--baud", type=int, default=115200,
                        help="serial baud rate (default: 115200)")
    parser.add_argument("--sensor-id", default=DEFAULT_SENSOR_ID,
                        help="sensors row to attach readings to when the node omits one")
    parser.add_argument("--gps-lat", type=float, default=DEFAULT_GPS_LAT,
                        help="latitude registered for the node sensor")
    parser.add_argument("--gps-lng", type=float, default=DEFAULT_GPS_LNG,
                        help="longitude registered for the node sensor")
    parser.add_argument("--install-date", default=DEFAULT_INSTALL_DATE,
                        help="install date registered for the node sensor")
    args = parser.parse_args()

    if serial is None:
        sys.exit("pyserial is not installed. Run: pip install pyserial")

    client = SupabaseRest()

    client.insert(
        "sensors",
        [{
            "sensor_id": args.sensor_id,
            "gps_lat": args.gps_lat,
            "gps_lng": args.gps_lng,
            "install_date": args.install_date,
        }],
        on_conflict="sensor_id",
    )
    print(f"Registered sensor {args.sensor_id[:8]} "
          f"({args.gps_lat:.4f}, {args.gps_lng:.4f})")

    try:
        link = serial.Serial(args.port, args.baud, timeout=5)
    except serial.SerialException as exc:
        sys.exit(f"Could not open serial port {args.port}: {exc}")

    print(f"Listening on {args.port} at {args.baud} baud. Ctrl-C to stop.")

    try:
        with link:
            while True:
                payload = parse_line(link.readline())
                if payload is None:
                    continue

                sensor_id = payload.get("sensor_id") or args.sensor_id
                recorded_at = payload.get("recorded_at") or datetime.now(
                    timezone.utc
                ).isoformat(timespec="seconds")
                row = build_row(payload, sensor_id, recorded_at)

                client.insert("sensor_readings", [row])
                print(f"{recorded_at} {describe(row)}")
    except KeyboardInterrupt:
        print("Stopped.")
    except serial.SerialException as exc:
        sys.exit(f"Serial connection lost: {exc}")
    except SupabaseError as exc:
        sys.exit(f"Supabase error: {exc}")


if __name__ == "__main__":
    main()
