"""#46 / S2-05 outage and recovery checks for the USB bridge.

Run from the repository root: python -m unittest discover -s iot -p 'test_*.py'
"""

import functools
import io
import unittest
import urllib.error
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import patch

import bridge
from bridge import DEFAULT_SENSOR_ID, process_line, register_sensor
from recovery import ReadingBuffer, SerialReconnector, Uploader
from supabase_rest import SupabaseError, SupabaseRest
from test_pipeline import FakeSupabase, node_line


class FakeClock:
    def __init__(self):
        self.now = 1000.0

    def __call__(self):
        return self.now

    def advance(self, seconds):
        self.now += seconds


class FlakySupabase(FakeSupabase):
    """FakeSupabase whose sensor_readings inserts fail while `down` is set."""

    def __init__(self):
        super().__init__()
        self.down = False
        self.reject_status = None
        self.attempts = 0

    def insert(self, table, rows, **kwargs):
        if table == "sensors":  # startup registration upsert
            return rows
        if table == "sensor_readings":
            self.attempts += 1
            if self.down:
                raise SupabaseError("POST sensor_readings -> timed out")
            if self.reject_status:
                status, self.reject_status = self.reject_status, None
                raise SupabaseError(f"POST sensor_readings -> HTTP {status}", status)
        return super().insert(table, rows, **kwargs)


def stamp(n):
    return f"2026-11-02T08:00:{n:02d}+00:00"


class UploaderTests(unittest.TestCase):
    def setUp(self):
        self.client = FlakySupabase()
        self.clock = FakeClock()
        self.logs = []
        self.uploader = Uploader(self.client, DEFAULT_SENSOR_ID, process_line,
                                 ReadingBuffer(1800), clock=self.clock, log=self.logs.append)

    def submit(self, n, **values):
        delivered = self.uploader.submit(node_line(**values), stamp(n))
        self.clock.advance(2)  # firmware reporting interval
        return delivered

    def test_outage_buffers_then_delivers_in_order_with_original_timestamps(self):
        self.assertEqual(len(self.submit(0)), 1)
        self.client.down = True
        for n in range(1, 31):  # one minute of readings during the outage
            self.assertEqual(self.submit(n), [])
        self.assertEqual(len(self.uploader.buffer), 30)
        self.client.down = False
        self.clock.advance(60)
        delivered = self.submit(31)
        self.assertEqual(len(delivered), 31)
        self.assertEqual([r["recorded_at"] for r in self.client.readings],
                         [stamp(n) for n in range(32)])
        self.assertEqual(len(self.uploader.buffer), 0)
        self.assertTrue(any("unavailable" in line for line in self.logs))
        self.assertTrue(any("reachable again: stored 31" in line for line in self.logs))

    def test_retries_back_off_exponentially_up_to_sixty_seconds(self):
        self.client.down = True
        attempt_times = []
        for _ in range(400):  # 400 s of 1-second polls
            before = self.client.attempts
            self.uploader.flush() if self.uploader.buffer else self.uploader.submit(node_line(), stamp(0))
            if self.client.attempts > before:
                attempt_times.append(self.clock())
            self.clock.advance(1)
        gaps = [b - a for a, b in zip(attempt_times, attempt_times[1:])]
        self.assertEqual(gaps[:6], [2, 4, 8, 16, 32, 60])
        self.assertTrue(all(gap == 60 for gap in gaps[5:]))

    def test_full_buffer_drops_oldest_and_reports_the_loss(self):
        self.uploader = Uploader(self.client, DEFAULT_SENSOR_ID, process_line, ReadingBuffer(3),
                                 clock=self.clock, log=self.logs.append)
        self.client.down = True
        for n in range(6):
            self.submit(n)
        self.assertEqual(self.uploader.buffer.dropped, 3)
        self.assertEqual(sum("Buffer full" in line for line in self.logs), 1)
        self.client.down = False
        self.clock.advance(60)
        self.uploader.flush()
        self.assertEqual([r["recorded_at"] for r in self.client.readings], [stamp(3), stamp(4), stamp(5)])
        self.assertTrue(any("3 oldest reading(s) were dropped" in line for line in self.logs))

    def test_permanently_rejected_reading_is_skipped_without_blocking(self):
        self.client.reject_status = 400
        self.assertEqual(self.submit(0), [])
        self.assertEqual(len(self.submit(1)), 1)
        self.assertEqual([r["recorded_at"] for r in self.client.readings], [stamp(1)])
        self.assertEqual(self.uploader.rejected, 1)
        self.assertIsNone(self.uploader.outage_since)

    def test_invalid_line_is_dropped_without_blocking(self):
        self.client.down = True
        self.submit(0, sensor_id="some-other-node")
        self.submit(1)
        self.client.down = False
        self.clock.advance(60)
        self.uploader.flush()
        self.assertEqual([r["recorded_at"] for r in self.client.readings], [stamp(1)])
        self.assertTrue(any("Rejected node line" in line for line in self.logs))

    def test_buffered_readings_still_raise_alerts_on_delivery(self):
        self.client.down = True
        self.submit(0, temperature=41.0)
        self.client.down = False
        self.clock.advance(60)
        (row, alerts), = self.uploader.flush()
        self.assertEqual(row["recorded_at"], stamp(0))
        self.assertEqual([(a["alert_type"], a["severity"]) for a in alerts], [("heat_stress", "critical")])

    def test_late_delivery_after_long_outage_is_not_reported_as_silence(self):
        late = (datetime.now(timezone.utc) - timedelta(minutes=45)).isoformat(timespec="seconds")
        self.client.down = True
        self.uploader.submit(node_line(), late)
        self.client.down = False
        self.clock.advance(60)
        (row, alerts), = self.uploader.flush()
        self.assertEqual(row["recorded_at"], late)
        self.assertEqual(alerts, [])
        self.assertEqual(self.client.alerts, [])

    def test_second_outage_is_reported_separately(self):
        self.client.down = True
        self.submit(0)
        self.client.down = False
        self.clock.advance(60)
        self.uploader.flush()
        self.client.down = True
        self.submit(1)
        self.assertEqual(sum("Supabase unavailable" in line for line in self.logs), 2)


class FakePort:
    def __init__(self, lines):
        self.lines = list(lines)
        self.closed = False

    def readline(self):
        if not self.lines:
            raise OSError("device disconnected")
        item = self.lines.pop(0)
        if isinstance(item, Exception):
            raise item
        return item

    def close(self):
        self.closed = True


class SerialReconnectorTests(unittest.TestCase):
    def test_lost_link_is_reopened_with_backoff_and_idle_retries(self):
        clock, sleeps, idle, logs = FakeClock(), [], [], []
        first = FakePort([b"DATA one", OSError("USB unplugged")])
        replacement = FakePort([b"DATA two"])
        opens = [OSError("port busy"), OSError("port busy"), replacement]

        def open_link():
            outcome = opens.pop(0)
            if isinstance(outcome, Exception):
                raise outcome
            return outcome

        def sleep(seconds):
            sleeps.append(seconds)
            clock.advance(seconds)

        port = SerialReconnector(open_link, (OSError,), link=first, on_idle=lambda: idle.append(1),
                                 clock=clock, sleep=sleep, log=logs.append)
        self.assertEqual(port.readline(), b"DATA one")
        self.assertEqual(port.readline(), b"DATA two")
        self.assertTrue(first.closed)
        self.assertEqual(sleeps, [2, 4])
        self.assertEqual(len(idle), 2)
        self.assertEqual(port.reconnects, 1)
        self.assertTrue(any("Serial connection lost" in line for line in logs))
        self.assertTrue(any("restored after 6s" in line for line in logs))


class SupabaseErrorClassificationTests(unittest.TestCase):
    def setUp(self):
        self.client = SupabaseRest("https://example.supabase.co", "test-key")

    def request_with(self, error):
        with patch("urllib.request.urlopen", side_effect=error):
            with self.assertRaises(SupabaseError) as caught:
                self.client.insert("sensor_readings", [{}])
        return caught.exception

    def http_error(self, status):
        return urllib.error.HTTPError("https://example", status, "x", {}, io.BytesIO(b"{}"))

    def test_network_failures_become_retryable_errors(self):
        for error in (TimeoutError("read timed out"), ConnectionResetError("reset"),
                      urllib.error.URLError("no route")):
            with self.subTest(error):
                self.assertTrue(self.request_with(error).retryable)

    def test_http_status_decides_whether_to_retry(self):
        for status, retryable in ((400, False), (409, False), (422, False),
                                  (401, True), (429, True), (500, True), (503, True)):
            with self.subTest(status):
                error = self.request_with(self.http_error(status))
                self.assertEqual((error.status, error.retryable), (status, retryable))


class RegisterSensorTests(unittest.TestCase):
    args = SimpleNamespace(sensor_id=DEFAULT_SENSOR_ID, gps_lat=3.8, gps_lng=113.8,
                           install_date="2026-10-15")

    def test_startup_registration_waits_out_an_outage(self):
        client = FlakySupabase()
        failures = [SupabaseError("down"), SupabaseError("down")]

        def insert(table, rows, **kwargs):
            if failures:
                raise failures.pop(0)
            return rows

        client.insert = insert
        sleeps = []
        with patch("sys.stderr", io.StringIO()), patch("sys.stdout", io.StringIO()):
            register_sensor(client, self.args, sleep=sleeps.append)
        self.assertEqual(sleeps, [2, 4])

    def test_startup_registration_stops_on_a_permanent_error(self):
        client = FlakySupabase()
        client.insert = lambda *a, **k: (_ for _ in ()).throw(SupabaseError("bad", 400))
        with self.assertRaises(SystemExit):
            register_sensor(client, self.args, sleep=lambda s: None)



class FakeSerialException(OSError):
    pass


class BridgeEndToEndTests(unittest.TestCase):
    """Runs bridge.main() through a Supabase outage and a USB unplug."""

    def test_bridge_survives_database_outage_and_usb_unplug(self):
        client, clock = FlakySupabase(), FakeClock()

        def act(fn):
            return ("act", fn)

        def outage_over():
            client.down = False
            clock.advance(60)

        first = [node_line(temperature=28.0), b"QA/QC table row", act(lambda: setattr(client, "down", True)),
                 node_line(temperature=29.0), node_line(temperature=41.0),
                 FakeSerialException("USB unplugged")]
        second = [act(outage_over), node_line(temperature=30.0), KeyboardInterrupt()]
        opens = [first, FakeSerialException("port busy"), second]

        class Port:
            def __init__(self, items):
                self.items = items

            def readline(self):
                while True:
                    item = self.items.pop(0)
                    if isinstance(item, tuple):
                        item[1]()
                        continue
                    if isinstance(item, BaseException):
                        raise item
                    return item

            def close(self):
                pass

        def open_serial(*_args, **_kwargs):
            outcome = opens.pop(0)
            if isinstance(outcome, BaseException):
                raise outcome
            return Port(outcome)

        fake_serial = SimpleNamespace(Serial=open_serial, SerialException=FakeSerialException)
        stderr = io.StringIO()
        with patch.object(bridge, "serial", fake_serial), \
                patch.object(bridge, "SupabaseRest", return_value=client), \
                patch.object(bridge, "Uploader", functools.partial(Uploader, clock=clock)), \
                patch.object(bridge, "SerialReconnector",
                             functools.partial(SerialReconnector, clock=clock, sleep=clock.advance)), \
                patch("sys.argv", ["bridge.py", "--port", "COM5"]), \
                patch("sys.stdout", io.StringIO()), patch("sys.stderr", stderr):
            bridge.main()  # returns normally on Ctrl-C instead of exiting on an error

        self.assertEqual([r["temperature"] for r in client.readings], [28.0, 29.0, 41.0, 30.0])
        self.assertEqual([(a["alert_type"], a["severity"]) for a in client.alerts],
                         [("heat_stress", "critical")])
        log = stderr.getvalue()
        for expected in ("Supabase unavailable", "Serial connection lost",
                         "Serial link restored", "Supabase reachable again: stored 3"):
            self.assertIn(expected, log)
        self.assertNotIn("not yet stored", log)


if __name__ == "__main__":
    unittest.main()
