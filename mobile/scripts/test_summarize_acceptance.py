"""Contract checks for the exported acceptance denominators."""

import unittest

from summarize_acceptance import summarize


class AcceptanceSummaryTests(unittest.TestCase):
    def test_retries_are_attempts_and_only_cached_qr_counts_toward_offline_average(self):
        rows = [
            {"measured_at": "2026-10-01T00:00:00Z", "operation": "sync_record", "outcome": "failed", "duration_ms": 100},
            {"measured_at": "2026-10-01T00:00:01Z", "operation": "sync_record", "outcome": "synced", "duration_ms": 200},
            {"measured_at": "2026-10-01T00:00:02Z", "operation": "sync_record", "outcome": "conflict", "duration_ms": 100},
            {"measured_at": "2026-10-01T00:00:03Z", "operation": "qr_lookup", "outcome": "local_found", "duration_ms": 1000},
            {"measured_at": "2026-10-01T00:00:04Z", "operation": "qr_lookup", "outcome": "local_found", "duration_ms": 6000},
            {"measured_at": "2026-10-01T00:00:05Z", "operation": "qr_lookup", "outcome": "remote_found", "duration_ms": 9000},
        ]
        result = summarize(rows)
        self.assertEqual(result["sync_attempts"], 3)
        self.assertEqual(result["sync_success_percent"], 33.33)
        self.assertEqual(result["cached_qr_average_ms"], 3500)
        self.assertEqual(result["cached_qr_under_5000ms"], 1)

    def test_no_samples_does_not_claim_success(self):
        result = summarize([])
        self.assertIsNone(result["sync_success_percent"])
        self.assertIsNone(result["cached_qr_average_ms"])


if __name__ == "__main__":
    unittest.main()
