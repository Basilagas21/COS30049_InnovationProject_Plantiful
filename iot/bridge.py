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
ignored. Close Arduino Serial Monitor before running this script: only one
process can normally own the COM port at a time.

Requires pyserial (pip install pyserial).

Usage:
    python iot/bridge.py --port COM5
    python iot/bridge.py --port /dev/ttyUSB0 --baud 115200
"""

import argparse
import json
import math
import sys
from datetime import datetime, timezone

from supabase_rest import SupabaseError, SupabaseRest
from evaluate import evaluate_live_reading
from time import sleep as wait_seconds

from recovery import (DEFAULT_BUFFER_SIZE, Backoff, ReadingBuffer, SerialReconnector,
                      Uploader, UPLOAD_RETRY_INITIAL_S, UPLOAD_RETRY_MAX_S)

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

# Accepted range per numeric field (#45 / S2-04). Temperature allows the widest
# common DHT-family datasheet range so a genuine heat reading is never dropped;
# the DHT11 itself reports 0-50 C. Percentages are physical 0-100 bounds.
NUMERIC_BOUNDS = {
    "temperature": (-40.0, 80.0),
    "humidity": (0.0, 100.0),
    "soil_moisture": (0.0, 100.0),
}
BOOLEAN_FIELDS = ("movement", "rain")


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


def validate_payload(payload):
    """Raise ValueError unless every reading field is null/absent or valid.

    Missing-value policy: an absent or null field means the sensor could not
    be read (the firmware sends null on a failed read) and is stored as null.
    Anything else must have the right type and be in range; a single bad field
    rejects the whole line so no partial or corrected reading is ever stored.
    """
    for field, (low, high) in NUMERIC_BOUNDS.items():
        value = payload.get(field)
        if value is None:
            continue
        # bool is a subclass of int in Python, so exclude it explicitly.
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError(f"Invalid sensor reading type: {field} must be a number or null")
        if not math.isfinite(value):
            raise ValueError(f"Invalid sensor reading: {field} must be a finite number")
        if not low <= value <= high:
            raise ValueError(f"Invalid sensor reading: {field}={value} outside {low:g} to {high:g}")
    for field in BOOLEAN_FIELDS:
        value = payload.get(field)
        if value is not None and not isinstance(value, bool):
            raise ValueError(f"Invalid sensor reading type: {field} must be true, false or null")
    if all(payload.get(field) is None for field in READING_FIELDS):
        raise ValueError("Invalid sensor reading: no measurements in payload")


def build_row(payload, sensor_id, recorded_at):
    row = {"sensor_id": sensor_id, "recorded_at": recorded_at}
    for field in READING_FIELDS:
        row[field] = payload.get(field)
    return row


def process_line(client, raw, sensor_id, recorded_at):
    """Insert one valid node reading, then raise immediate alerts if needed."""
    payload = parse_line(raw)
    if payload is None:
        return None
    if payload.get("sensor_id", sensor_id) != sensor_id:
        raise ValueError("Node sensor_id does not match the registered sensor")
    # Reject before any insert or alert evaluation (#45 / S2-04).
    validate_payload(payload)
    # The node has no trusted clock; never use a timestamp supplied by serial.
    row = build_row(payload, sensor_id, recorded_at)
    client.insert("sensor_readings", [row])
    try:
        alerts = evaluate_live_reading(client, row)
    except SupabaseError as exc:
        # The reading has already been persisted; a later evaluate.py run can
        # retry the rule without losing the measurement.
        print(f"Alert evaluation failed ({exc}); retry with python iot/evaluate.py", file=sys.stderr)
        alerts = []
    return row, alerts


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
    parser.add_argument("--buffer-size", type=int, default=DEFAULT_BUFFER_SIZE,
                        help="readings held in memory while Supabase is unreachable "
                             f"(default: {DEFAULT_BUFFER_SIZE}, about 1 hour at 2 s)")
    args = parser.parse_args()
    if args.buffer_size < 1:
        parser.error("--buffer-size must be at least 1")

    if serial is None:
        sys.exit("pyserial is not installed. Run: pip install pyserial")

    client = SupabaseRest()
    register_sensor(client, args)

    def open_link():
        return serial.Serial(args.port, args.baud, timeout=5)

    try:
        link = open_link()
    except serial.SerialException as exc:
        # A port that never opened is a configuration problem, not an outage.
        sys.exit(f"Could not open serial port {args.port}: {exc}")

    uploader = Uploader(client, args.sensor_id, process_line, ReadingBuffer(args.buffer_size),
                        log=log)
    port = SerialReconnector(open_link, (serial.SerialException, OSError), link=link,
                             on_idle=uploader.flush, log=log)
    print(f"Listening on {args.port} at {args.baud} baud. Ctrl-C to stop.")

    try:
        while True:
            raw = port.readline()
            # Stamp after the read returns: readline can block for up to 5 s.
            recorded_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
            if parse_line(raw) is None:
                uploader.flush()  # idle line: still let pending retries run
                continue
            for row, alerts in uploader.submit(raw, recorded_at):
                print(f"{row['recorded_at']} {describe(row)} alerts={len(alerts)}", flush=True)
    except KeyboardInterrupt:
        pending = len(uploader.buffer)
        if pending:
            log(f"Stopped with {pending} reading(s) not yet stored; the buffer is in memory "
                "only, so they are lost.")
        print("Stopped.")
    finally:
        port.close()


def log(message):
    print(message, file=sys.stderr, flush=True)


def register_sensor(client, args, sleep=wait_seconds):
    """Upsert the node's sensors row, waiting out a Supabase outage at startup."""
    backoff = Backoff(UPLOAD_RETRY_INITIAL_S, UPLOAD_RETRY_MAX_S)
    while True:
        try:
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
        except SupabaseError as exc:
            if not exc.retryable:
                sys.exit(f"Supabase rejected the sensor registration: {exc}")
            wait = backoff.failed()
            log(f"Could not register the sensor ({exc}); retrying in {wait:g}s. Ctrl-C to stop.")
            sleep(wait)
            continue
        print(f"Registered sensor {args.sensor_id[:8]} "
              f"({args.gps_lat:.4f}, {args.gps_lng:.4f})")
        return

if __name__ == "__main__":
    main()
