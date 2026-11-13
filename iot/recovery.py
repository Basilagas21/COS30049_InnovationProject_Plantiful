"""Outage recovery for the USB-serial bridge (#46 / S2-05).

Policy, decided 2 November 2026 and documented in iot/README.md:

* Supabase unreachable: readings keep being read and stamped with the host's
  arrival time, held in a bounded in-memory buffer, and retried oldest-first
  with exponential backoff (2 s doubling to 60 s). When Supabase answers again
  the backlog is inserted in order, then alert rules run on each row as usual.
* Buffer full: the oldest buffered reading is dropped to make room, and the
  number dropped is logged when the outage ends. The default capacity (1800)
  holds about one hour at the firmware's 2-second reporting interval.
* A reading the database rejects outright (HTTP 400/409/422) is logged and
  skipped, so one bad row cannot block the readings behind it.
* USB/serial link lost: the bridge keeps the process alive and reopens the port
  with backoff (2 s doubling to 30 s), still retrying buffered uploads while it
  waits. The node has no storage, so readings during the gap are not captured;
  the dashboard shows the sensor as stale and evaluate.py raises sensor_silent
  after 30 minutes.
* Bridge process stopped: the buffer lives in memory only, so anything still
  pending is lost; the count is printed on exit.
"""

import time
from collections import deque

from supabase_rest import SupabaseError

DEFAULT_BUFFER_SIZE = 1800
UPLOAD_RETRY_INITIAL_S = 2.0
UPLOAD_RETRY_MAX_S = 60.0
SERIAL_RETRY_INITIAL_S = 2.0
SERIAL_RETRY_MAX_S = 30.0


class Backoff:
    """Exponential retry delay measured on a monotonic clock."""

    def __init__(self, initial, maximum, clock=time.monotonic):
        self.initial = initial
        self.maximum = maximum
        self.clock = clock
        self.delay = initial
        self.next_at = None

    def ready(self):
        return self.next_at is None or self.clock() >= self.next_at

    def failed(self):
        """Schedule the next attempt; returns the wait in seconds."""
        wait = self.delay
        self.next_at = self.clock() + wait
        self.delay = min(self.delay * 2, self.maximum)
        return wait

    def succeeded(self):
        self.delay = self.initial
        self.next_at = None


class ReadingBuffer:
    """Bounded FIFO of (raw_line, recorded_at) waiting to be inserted."""

    def __init__(self, capacity=DEFAULT_BUFFER_SIZE):
        if capacity < 1:
            raise ValueError("buffer capacity must be at least 1")
        self.capacity = capacity
        self._items = deque()
        self.dropped = 0

    def add(self, raw, recorded_at):
        """Append a reading; returns True if the oldest one had to be dropped."""
        dropped = len(self._items) >= self.capacity
        if dropped:
            self._items.popleft()
            self.dropped += 1
        self._items.append((raw, recorded_at))
        return dropped

    def peek(self):
        return self._items[0]

    def pop(self):
        return self._items.popleft()

    def __len__(self):
        return len(self._items)


class Uploader:
    """Delivers buffered readings oldest-first, backing off while Supabase is down.

    `process` is bridge.process_line: it validates, inserts and evaluates one
    line, raising ValueError for an invalid line and SupabaseError when the
    insert fails (nothing is stored in that case, so retrying is safe).
    """

    def __init__(self, client, sensor_id, process, buffer=None, clock=time.monotonic, log=print):
        self.client = client
        self.sensor_id = sensor_id
        self.process = process
        self.buffer = buffer if buffer is not None else ReadingBuffer()
        self.backoff = Backoff(UPLOAD_RETRY_INITIAL_S, UPLOAD_RETRY_MAX_S, clock)
        self.log = log
        self.outage_since = None
        self._outage_delivered = 0
        self._dropped_at_outage_start = 0
        self.rejected = 0

    def submit(self, raw, recorded_at):
        """Queue one node line, then try to deliver. Returns delivered (row, alerts)."""
        if self.buffer.add(raw, recorded_at) and self.buffer.dropped - self._dropped_at_outage_start == 1:
            self.log(f"Buffer full ({self.buffer.capacity} readings): dropping the oldest "
                     "until Supabase is reachable again.")
        return self.flush()

    def flush(self):
        """Insert as much of the backlog as possible, oldest first."""
        delivered = []
        if not self.buffer or not self.backoff.ready():
            return delivered
        while self.buffer:
            raw, recorded_at = self.buffer.peek()
            try:
                result = self.process(self.client, raw, self.sensor_id, recorded_at)
            except ValueError as exc:
                self.buffer.pop()
                self.log(f"Rejected node line: {exc}")
                continue
            except SupabaseError as exc:
                if not exc.retryable:
                    self.buffer.pop()
                    self.rejected += 1
                    self.log(f"Database rejected the reading from {recorded_at}; skipped: {exc}")
                    continue
                self._record_failure(exc, recorded_at)
                return delivered
            self.buffer.pop()
            if result is not None:
                delivered.append(result)
        self._record_recovery(len(delivered))
        return delivered

    def _record_failure(self, exc, recorded_at):
        wait = self.backoff.failed()
        if self.outage_since is None:
            self.outage_since = recorded_at
            self._dropped_at_outage_start = self.buffer.dropped
            self.log(f"Supabase unavailable ({exc}). Buffering readings in memory "
                     f"(capacity {self.buffer.capacity}); retrying in {wait:g}s.")
        else:
            self.log(f"Supabase still unavailable; {len(self.buffer)} reading(s) waiting, "
                     f"next retry in {wait:g}s.")

    def _record_recovery(self, delivered):
        self.backoff.succeeded()
        if self.outage_since is None:
            return
        dropped = self.buffer.dropped - self._dropped_at_outage_start
        message = (f"Supabase reachable again: stored {delivered} buffered reading(s) "
                   f"from the outage that began {self.outage_since}.")
        if dropped:
            message += f" {dropped} oldest reading(s) were dropped because the buffer was full."
        self.log(message)
        self.outage_since = None


class SerialReconnector:
    """Reads lines from the serial port, reopening it after the link drops.

    `open_link` returns an open port object with readline() and close().
    `errors` are the exception types that mean the link was lost. While the
    port is down `on_idle` is called between attempts so buffered uploads can
    still be retried.
    """

    def __init__(self, open_link, errors, link=None, on_idle=None,
                 clock=time.monotonic, sleep=time.sleep, log=print):
        self.open_link = open_link
        self.errors = errors
        self.link = link
        self.on_idle = on_idle or (lambda: None)
        self.clock = clock
        self.sleep = sleep
        self.log = log
        self.reconnects = 0

    def readline(self):
        while True:
            if self.link is None:
                self._reconnect()
            try:
                return self.link.readline()
            except self.errors as exc:
                self.log(f"Serial connection lost ({exc}). Readings during the gap cannot be "
                         "captured; reconnecting.")
                self.close()

    def close(self):
        if self.link is not None:
            try:
                self.link.close()
            except self.errors:
                pass
            self.link = None

    def _reconnect(self):
        started = self.clock()
        backoff = Backoff(SERIAL_RETRY_INITIAL_S, SERIAL_RETRY_MAX_S, self.clock)
        while True:
            try:
                self.link = self.open_link()
            except self.errors as exc:
                wait = backoff.failed()
                self.log(f"Serial port unavailable ({exc}); retrying in {wait:g}s.")
                self.on_idle()
                self.sleep(wait)
                continue
            self.reconnects += 1
            self.log(f"Serial link restored after {self.clock() - started:.0f}s.")
            return
