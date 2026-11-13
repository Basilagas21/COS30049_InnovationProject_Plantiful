"""Threat-rule evaluator for the Plantiful IoT monitoring feature.

Reads recent rows from sensor_readings over the Supabase REST API, applies
simple threshold rules, and inserts a row into alerts for any condition that
has not already been alerted within the cooldown window.

Cooldown and escalation policy (#47 / S2-06, decided 2 November 2026):
  * A sensor/rule pair is alerted at most once per cooldown window (default 6h)
    at a given severity, so a persisting condition does not repeat every reading.
  * Escalation breaks through: if the condition worsens to a HIGHER severity
    than every same-type alert in the window (heat high -> critical, drought
    medium -> high), a new alert is raised immediately.
  * Resolved alerts still count toward the cooldown, so resolving an alert
    while the condition persists does not re-raise it on the next reading.

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

SEVERITY_RANK = {"low": 0, "medium": 1, "high": 2, "critical": 3}


def is_suppressed(severity, recent_severities):
    """True when a same-type alert of equal or higher severity is in the cooldown.

    An unrecognised stored severity is treated as the highest, so bad data can
    only suppress a repeat, never cause an alert storm.
    """
    rank = SEVERITY_RANK[severity]
    return any(SEVERITY_RANK.get(previous, len(SEVERITY_RANK)) >= rank
               for previous in recent_severities)


def severities_by_type(recent_alerts, key):
    grouped = {}
    for alert in recent_alerts:
        grouped.setdefault(key(alert), []).append(alert.get("severity"))
    return grouped


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
            key = (sensor_id, "heat_stress")
            if key not in findings or (severity == "critical" and findings[key][0] != "critical"):
                findings[key] = (severity, f"{temperature}°C")

        humidity = row.get("humidity")
        if humidity is not None and humidity <= DROUGHT_MEDIUM:
            severity = "high" if humidity <= DROUGHT_HIGH else "medium"
            key = (sensor_id, "drought_stress")
            if key not in findings or (severity == "high" and findings[key][0] != "high"):
                findings[key] = (severity, f"{humidity}% RH")

        if row.get("movement"):
            findings.setdefault((sensor_id, "unusual_movement"), ("medium", "movement detected"))

    cutoff = now_utc() - timedelta(minutes=silent_after_minutes)
    for sensor_id, last_seen in latest.items():
        if last_seen < cutoff:
            stale = int((now_utc() - last_seen).total_seconds() // 60)
            findings.setdefault((sensor_id, "sensor_silent"), ("high", f"silent for {stale} min"))

    return findings, latest


def evaluate_live_reading(client, row, cooldown_hours=6.0):
    """Check a newly inserted hardware reading immediately for active threats.

    The periodic evaluator remains useful for sensor_silent (no new reading can
    trigger this function) and for retrying a failed alert insertion.
    """
    # Silence is the periodic evaluator's job, judged from the newest stored
    # reading. A reading delivered late after an outage (#46) is old, not silent.
    findings = {key: value for key, value in evaluate_readings([row], 30)[0].items()
                if key[1] != "sensor_silent"}
    sensor_id = row["sensor_id"]
    cutoff = (now_utc() - timedelta(hours=cooldown_hours)).isoformat(timespec="seconds")
    recent = client.select("alerts", params={
        "select": "alert_type,severity,created_at",
        "sensor_id": f"eq.{sensor_id}",
        "created_at": f"gte.{cutoff}",
        "order": "created_at.desc",
        "limit": "100",
    }) if findings else []
    recent_by_type = severities_by_type(recent, lambda alert: alert["alert_type"])
    new_alerts = [{
        "sensor_id": sensor_id,
        "alert_type": kind,
        "severity": severity,
        "resolved": False,
    } for (_, kind), (severity, _) in findings.items()
        if not is_suppressed(severity, recent_by_type.get(kind, []))]
    if new_alerts:
        client.insert("alerts", new_alerts)
    return new_alerts


def main():
    parser = argparse.ArgumentParser(description="Plantiful IoT threat-rule evaluator")
    parser.add_argument("--window-hours", type=float, default=6.0,
                        help="how far back to read sensor_readings (default: 6)")
    parser.add_argument("--cooldown-hours", type=float, default=6.0,
                        help="min hours before repeating an alert for the same sensor/rule at the same "
                             "or lower severity; a higher severity escalates immediately (default: 6)")
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
            "select": "sensor_id,alert_type,severity,created_at",
            "created_at": f"gte.{alert_cutoff}",
            "order": "created_at.desc",
            "limit": "500",
        },
    )

    findings, latest = evaluate_readings(readings, args.silent_after_minutes)

    # recent_alerts is already limited to the cooldown window by created_at.
    already_alerted = severities_by_type(
        recent_alerts, lambda alert: (alert["sensor_id"], alert["alert_type"]))

    known_sensors = {row["sensor_id"] for row in sensors}
    for sensor_id in sorted({row["sensor_id"] for row in readings} - known_sensors):
        print(f"Skipping reading for unknown sensor {sensor_id} (register it via publisher.py).")
    for sensor_id in sorted(known_sensors - set(latest)):
        findings.setdefault((sensor_id, "sensor_silent"), ("high", "no readings in window"))

    fresh = []
    for (sensor_id, alert_type), (severity, detail) in sorted(findings.items()):
        if sensor_id not in known_sensors:
            continue
        if is_suppressed(severity, already_alerted.get((sensor_id, alert_type), [])):
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
