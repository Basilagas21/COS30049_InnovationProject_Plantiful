import assert from 'node:assert/strict';
import test from 'node:test';
import { rangeStart, readingStatus, overallStatus, STALE_AFTER_MS } from '@/lib/telemetry';
import { REPORT_TYPES, REPORT_FORMATS } from '@/lib/report-types';

// The proposal target is coverage of the backend API and mobile sync; these
// tests pin the web data-layer helpers that translate backend rows into the
// shapes every officer and visitor page renders.

test('rangeStart maps ranges to day windows and all to null', () => {
  const now = Date.parse('2026-11-02T12:00:00Z');
  assert.equal(rangeStart('1d', now), new Date(now - 86_400_000).toISOString());
  assert.equal(rangeStart('7d', now), new Date(now - 7 * 86_400_000).toISOString());
  assert.equal(rangeStart('all', now), null);
});

test('readingStatus classifies fresh, stale, warning and critical telemetry', () => {
  const now = Date.parse('2026-11-02T12:00:00Z');
  const at = (secondsAgo) => new Date(now - secondsAgo * 1000).toISOString();
  const base = { soil_moisture: null, rain: null };
  assert.equal(readingStatus(null, now), 'No data');
  assert.equal(
    readingStatus({ ...base, temperature: 25, humidity: 60, movement: false, recorded_at: at(10) }, now),
    'Normal'
  );
  assert.equal(
    readingStatus({ ...base, temperature: 25, humidity: 60, movement: false, recorded_at: at(STALE_AFTER_MS / 1000 + 5) }, now),
    'Stale'
  );
  assert.equal(
    readingStatus({ ...base, temperature: 41, humidity: 60, movement: false, recorded_at: at(10) }, now),
    'Critical'
  );
  assert.equal(
    readingStatus({ ...base, temperature: 30, humidity: 60, movement: true, recorded_at: at(10) }, now),
    'Warning'
  );
  assert.equal(
    readingStatus({ ...base, temperature: null, humidity: 60, movement: false, recorded_at: at(10) }, now),
    'Incomplete'
  );
  assert.equal(
    readingStatus({ ...base, temperature: 25, humidity: 60, movement: false, recorded_at: at(-3600) }, now),
    'Check clock'
  );
});

test('overallStatus escalates by severity order', () => {
  assert.equal(overallStatus([]), 'No data');
  assert.equal(overallStatus(['Normal', 'Normal']), 'Normal');
  assert.equal(overallStatus(['Normal', 'Warning']), 'Warning');
  assert.equal(overallStatus(['Warning', 'Stale']), 'Warning');
  assert.equal(overallStatus(['Stale', 'Normal']), 'Stale');
  assert.equal(overallStatus(['Normal', 'Critical']), 'Critical');
});

test('report catalogues expose stable values and labels', () => {
  assert.deepEqual(REPORT_TYPES.map((r) => r.value), ['observations', 'species-catalogue', 'conservation-status']);
  assert.deepEqual(REPORT_FORMATS.map((f) => f.value), ['csv', 'pdf']);
  for (const entry of [...REPORT_TYPES, ...REPORT_FORMATS]) {
    assert.ok(entry.value && entry.label, 'each catalogue entry needs a value and a label');
  }
});
