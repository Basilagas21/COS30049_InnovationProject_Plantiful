"""Threat-rule evaluator for the Plantiful IoT monitoring feature.

Reads recent rows from sensor_readings over the Supabase REST API, applies
simple threshold rules, and inserts a row into alerts for any condition that
has not already been alerted within the cooldown window.

Usage:
    python iot/evaluate.py
    python iot/evaluate.py --cooldown-hours 3
"""

import argparse
from datetime import datetime, timedelta, timezone

from supabase_rest import SupabaseRest

HEAT_HIGH = 36.0
HEAT_CRITICAL = 40.0
DROUGHT_MEDIUM = 40.0
DROUGHT_HIGH = 25.0


def now_utc():
    return datetime.now(timezone.utc)


def parse_ts(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def evaluate_readings(readings, silent_after_minutes):
    findings = {}
    latest = {}

    for row in readings:
        sensor_id = row["sensor_id"]
        recorded_at = parse_ts(row["recorded_at"])
        latest[sensor_id] = max(latest.get(sensor_id, recorded_at), recorded_at)

        temperature = row.get("temperature")
        if temperature is not None and temperature >= HEAT_HIGH:
            severity = "critical" if temperature >= HEAT_CRITICAL else "high"
            findings.setdefault((sensor_id, "heat_stress"), (severity, f"{temperature}°C"))

        humidity = row.get("humidity")
        if humidity is not None and humidity <= DROUGHT_MEDIUM:
            severity = "high" if humidity <= DROUGHT_HIGH else "medium"
            findings.setdefault((sensor_id, "drought_stress"), (severity, f"{humidity}% RH"))

        if row.get("movement"):
            findings.setdefault((sensor_id, "unusual_movement"), ("medium", "movement detected"))

    cutoff = now_utc() - timedelta(minutes=silent_after_minutes)
    for sensor_id, last_seen in latest.items():
        if last_seen < cutoff:
            stale = int((now_utc() - last_seen).total_seconds() // 60)
            findings.setdefault((sensor_id, "sensor_silent"), ("high", f"silent for {stale} min"))

    return findings, latest


def main():
    parser = argparse.ArgumentParser(description="Plantiful IoT threat-rule evaluator")
    parser.add_argument("--window-hours", type=float, default=6.0,
                        help="how far back to read sensor_readings (default: 6)")
    parser.add_argument("--cooldown-hours", type=float, default=6.0,
                        help="min hours before repeating an alert for the same sensor/rule (default: 6)")
    parser.add_argument("--silent-after-minutes", type=float, default=30.0,
                        help="flag a sensor with no reading for this long (default: 30)")
    args = parser.parse_args()

    client = SupabaseRest()
    since = (now_utc() - timedelta(hours=args.window_hours)).isoformat(timespec="seconds")
    alert_cutoff = (now_utc() - timedelta(hours=args.cooldown_hours)).isoformat(timespec="seconds")

    sensors = client.select("sensors", params={"select": "sensor_id"})
    readings = client.select(
        "sensor_readings",
        params={
            "select": "sensor_id,temperature,humidity,movement,recorded_at",
            "recorded_at": f"gte.{since}",
            "order": "recorded_at.desc",
            "limit": "5000",
        },
    )
    recent_alerts = client.select(
        "alerts",
        params={
            "select": "sensor_id,alert_type,created_at",
            "created_at": f"gte.{alert_cutoff}",
            "order": "created_at.desc",
            "limit": "500",
        },
    )

    if not readings:
        print(f"No readings in the last {args.window_hours:g}h — run python iot/publisher.py first.")
        return

    findings, latest = evaluate_readings(readings, args.silent_after_minutes)

    already_alerted = {
        (row["sensor_id"], row["alert_type"]): parse_ts(row["created_at"])
        for row in recent_alerts
    }

    known_sensors = {row["sensor_id"] for row in sensors}
    for sensor_id in sorted({row["sensor_id"] for row in readings} - known_sensors):
        print(f"Skipping reading for unknown sensor {sensor_id} (register it via publisher.py).")
    for sensor_id in sorted(known_sensors - set(latest)):
        findings.setdefault((sensor_id, "sensor_silent"), ("high", "no readings in window"))

    cooldown = timedelta(hours=args.cooldown_hours)
    fresh = []
    for (sensor_id, alert_type), (severity, detail) in sorted(findings.items()):
        if sensor_id not in known_sensors:
            continue
        last = already_alerted.get((sensor_id, alert_type))
        if last is not None and now_utc() - last < cooldown:
            continue
        fresh.append((sensor_id, alert_type, severity, detail))

    if not fresh:
        print(
            f"Checked {len(readings)} reading(s) from {len(latest)} sensor(s): "
            f"{len(findings)} condition(s) active, none outside the "
            f"{args.cooldown_hours:g}h alert cooldown. No alerts raised."
        )
        return

    rows = [
        {
            "sensor_id": sensor_id,
            "alert_type": alert_type,
            "severity": severity,
            "resolved": False,
        }
        for sensor_id, alert_type, severity, _ in fresh
    ]
    client.insert("alerts", rows)

    for sensor_id, alert_type, severity, detail in fresh:
        last_seen = latest.get(sensor_id)
        seen = last_seen.isoformat(timespec="seconds") if last_seen else "none in window"
        print(
            f"Raised {alert_type} [{severity}] for sensor {sensor_id[:8]} "
            f"({detail}, last reading {seen})"
        )


if __name__ == "__main__":
    main()
