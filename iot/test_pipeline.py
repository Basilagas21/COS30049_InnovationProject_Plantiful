"""Offline contract checks for the serial bridge and threat evaluator.

Run from the repository root: python -m unittest discover -s iot -p 'test_*.py'
"""

import json
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from bridge import DEFAULT_SENSOR_ID, process_line
from evaluate import evaluate_live_reading, evaluate_readings, main
from supabase_rest import SupabaseError


class FakeSupabase:
    def __init__(self):
        self.readings = []
        self.alerts = []

    def insert(self, table, rows, **_kwargs):
        if table == "alerts":
            self.alerts.extend({**row, "created_at": datetime.now(timezone.utc).isoformat()} for row in rows)
        elif table == "sensor_readings":
            self.readings.extend(rows)
        else:
            raise AssertionError(table)
        return rows

    def select(self, table, params=None):
        if table == "alerts":
            cutoff = datetime.fromisoformat(params["created_at"].removeprefix("gte."))
            return [row for row in self.alerts if row["sensor_id"] ==
                    params["sensor_id"].removeprefix("eq.") and
                    datetime.fromisoformat(row["created_at"]) >= cutoff]
        if table == "sensors":
            return [{"sensor_id": DEFAULT_SENSOR_ID}]
        if table == "sensor_readings":
            return self.readings
        raise AssertionError(table)


def node_line(**values):
    payload = {"sensor_id": DEFAULT_SENSOR_ID, "temperature": 28.4,
               "humidity": 87.0, "movement": False, "soil_moisture": 41,
               "rain": False}
    payload.update(values)
    return ("DATA " + json.dumps(payload)).encode()


class HardwarePipelineTests(unittest.TestCase):
    def setUp(self):
        self.client = FakeSupabase()
        self.timestamp = datetime.now(timezone.utc).isoformat()

    def test_serial_reading_creates_alert_once_and_uses_host_timestamp(self):
        line = node_line(temperature=40.2, movement=True, recorded_at="2000-01-01T00:00:00Z")
        row, alerts = process_line(self.client, line, DEFAULT_SENSOR_ID, self.timestamp)
        self.assertEqual(row["recorded_at"], self.timestamp)
        self.assertEqual(row["soil_moisture"], 41)
        self.assertEqual(row["rain"], False)
        self.assertEqual({a["alert_type"] for a in alerts}, {"heat_stress", "unusual_movement"})
        self.assertEqual(next(a for a in alerts if a["alert_type"] == "heat_stress")["severity"], "critical")
        _, repeated = process_line(self.client, line, DEFAULT_SENSOR_ID, self.timestamp)
        self.assertEqual(repeated, [])
        self.assertEqual(len(self.client.readings), 2)

    def test_invalid_or_foreign_node_line_does_not_insert(self):
        self.assertIsNone(process_line(self.client, b"QA/QC 40 C", DEFAULT_SENSOR_ID, self.timestamp))
        self.assertIsNone(process_line(self.client, b"DATA not-json", DEFAULT_SENSOR_ID, self.timestamp))
        with self.assertRaisesRegex(ValueError, "sensor_id"):
            process_line(self.client, node_line(sensor_id="different"), DEFAULT_SENSOR_ID, self.timestamp)
        with self.assertRaisesRegex(ValueError, "reading type"):
            process_line(self.client, node_line(temperature="forty"), DEFAULT_SENSOR_ID, self.timestamp)
        self.assertEqual(self.client.readings, [])

    def test_higher_severity_is_not_hidden_by_newer_milder_reading(self):
        rows = [
            {"sensor_id": DEFAULT_SENSOR_ID, "recorded_at": self.timestamp,
             "temperature": 36.2, "humidity": 39},
            {"sensor_id": DEFAULT_SENSOR_ID, "recorded_at": self.timestamp,
             "temperature": 40.5, "humidity": 23},
        ]
        findings, _ = evaluate_readings(rows, 30)
        self.assertEqual(findings[(DEFAULT_SENSOR_ID, "heat_stress")][0], "critical")
        self.assertEqual(findings[(DEFAULT_SENSOR_ID, "drought_stress")][0], "high")

    def test_registered_sensor_without_readings_still_reports_silence(self):
        with patch("evaluate.SupabaseRest", return_value=self.client), patch(
            "sys.argv", ["evaluate.py"]
        ):
            main()
        self.assertEqual([a["alert_type"] for a in self.client.alerts], ["sensor_silent"])

    def test_recent_alert_respects_cooldown(self):
        self.client.alerts.append({"sensor_id": DEFAULT_SENSOR_ID,
                                   "alert_type": "heat_stress",
                                   "created_at": self.timestamp})
        row = {"sensor_id": DEFAULT_SENSOR_ID, "recorded_at": self.timestamp,
               "temperature": 38, "humidity": 90, "movement": False}
        self.assertEqual(evaluate_live_reading(self.client, row), [])

    def test_expired_alert_is_reissued(self):
        self.client.alerts.append({"sensor_id": DEFAULT_SENSOR_ID,
                                   "alert_type": "heat_stress",
                                   "created_at": (datetime.now(timezone.utc) - timedelta(hours=7)).isoformat()})
        row = {"sensor_id": DEFAULT_SENSOR_ID, "recorded_at": self.timestamp,
               "temperature": 38, "humidity": 90, "movement": False}
        self.assertEqual([a["alert_type"] for a in evaluate_live_reading(self.client, row)], ["heat_stress"])

    def test_reading_survives_failed_alert_check_for_periodic_retry(self):
        with patch("bridge.evaluate_live_reading", side_effect=SupabaseError("offline")):
            row, alerts = process_line(self.client, node_line(movement=True),
                                       DEFAULT_SENSOR_ID, self.timestamp)
        self.assertEqual(len(self.client.readings), 1)
        self.assertEqual(row["movement"], True)
        self.assertEqual(alerts, [])


if __name__ == "__main__":
    unittest.main()
