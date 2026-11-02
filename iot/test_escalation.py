"""#47 / S2-06 alert escalation and cooldown policy checks.

Run from the repository root: python -m unittest discover -s iot -p 'test_*.py'
"""

import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from bridge import DEFAULT_SENSOR_ID
from evaluate import evaluate_live_reading, main
from test_pipeline import FakeSupabase


class EscalationPolicyTests(unittest.TestCase):
    """#47 / S2-06: worse conditions escalate through the cooldown; repeats do not."""

    def setUp(self):
        self.client = FakeSupabase()
        self.timestamp = datetime.now(timezone.utc).isoformat()

    def prior_alert(self, alert_type, severity, hours_ago=1, resolved=False):
        self.client.alerts.append({
            "sensor_id": DEFAULT_SENSOR_ID, "alert_type": alert_type,
            "severity": severity, "resolved": resolved,
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=hours_ago)).isoformat()})

    def live(self, temperature=30.0, humidity=90.0):
        row = {"sensor_id": DEFAULT_SENSOR_ID, "recorded_at": self.timestamp,
               "temperature": temperature, "humidity": humidity, "movement": False}
        return [(a["alert_type"], a["severity"]) for a in evaluate_live_reading(self.client, row)]

    def test_heat_escalates_from_high_to_critical_inside_cooldown(self):
        self.assertEqual(self.live(temperature=36.5), [("heat_stress", "high")])
        self.assertEqual(self.live(temperature=41.0), [("heat_stress", "critical")])

    def test_drought_escalates_from_medium_to_high_inside_cooldown(self):
        self.assertEqual(self.live(humidity=38), [("drought_stress", "medium")])
        self.assertEqual(self.live(humidity=20), [("drought_stress", "high")])

    def test_same_or_lower_severity_stays_suppressed(self):
        self.assertEqual(self.live(temperature=41.0), [("heat_stress", "critical")])
        self.assertEqual(self.live(temperature=42.0), [])   # same severity
        self.assertEqual(self.live(temperature=37.0), [])   # de-escalation
        self.assertEqual(len(self.client.alerts), 1)

    def test_escalation_happens_once_not_every_reading(self):
        self.prior_alert("heat_stress", "high")
        self.assertEqual(self.live(temperature=40.5), [("heat_stress", "critical")])
        for _ in range(5):
            self.assertEqual(self.live(temperature=40.5), [])
        self.assertEqual(len(self.client.alerts), 2)

    def test_resolved_alert_still_counts_toward_cooldown(self):
        self.prior_alert("heat_stress", "high", resolved=True)
        self.assertEqual(self.live(temperature=37.0), [])
        # ...but a resolved lower-severity alert does not block escalation.
        self.assertEqual(self.live(temperature=40.0), [("heat_stress", "critical")])

    def test_alert_outside_cooldown_does_not_suppress(self):
        self.prior_alert("heat_stress", "critical", hours_ago=7)
        self.assertEqual(self.live(temperature=36.5), [("heat_stress", "high")])

    def test_rules_escalate_independently(self):
        self.prior_alert("heat_stress", "critical")
        self.assertEqual(self.live(temperature=41.0, humidity=20),
                         [("drought_stress", "high")])

    def test_periodic_evaluator_applies_the_same_policy(self):
        self.prior_alert("heat_stress", "high")
        self.prior_alert("drought_stress", "high")
        self.client.readings.append({"sensor_id": DEFAULT_SENSOR_ID, "recorded_at": self.timestamp,
                                     "temperature": 40.8, "humidity": 22, "movement": False})
        with patch("evaluate.SupabaseRest", return_value=self.client), patch(
            "sys.argv", ["evaluate.py"]
        ):
            main()
            main()  # second run must not repeat the escalation
        raised = [(a["alert_type"], a["severity"]) for a in self.client.alerts[2:]]
        self.assertEqual(raised, [("heat_stress", "critical")])



if __name__ == "__main__":
    unittest.main()
