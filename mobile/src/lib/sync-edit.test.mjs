import assert from 'node:assert/strict';
import test from 'node:test';
import { EditConflict, pushEditedRecord } from './sync-edit.ts';

// A minimal atomic PostgREST stand-in: one device can win the version race.
function recordClient(record) {
  const writes = [];
  return {
    writes,
    from(table) {
      assert.equal(table, 'plant_records');
      const filters = {};
      let patch;
      const query = {
        update(values) { patch = values; return query; },
        eq(key, value) { filters[key] = value; return query; },
        select(columns) { assert.equal(columns, 'version'); return query; },
        async maybeSingle() {
          if (record.record_id !== filters.record_id ||
              record.botanist_id !== filters.botanist_id ||
              record.version !== filters.version) return { data: null, error: null };
          writes.push({ filters: { ...filters }, patch: { ...patch } });
          Object.assign(record, patch);
          return { data: { version: record.version }, error: null };
        },
      };
      return query;
    },
  };
}

test('simultaneous owner devices preserve the first edit and stop the stale edit', async () => {
  const row = { record_id: 'record-a', botanist_id: 'owner-a', version: 1, notes: 'original' };
  const client = recordClient(row);
  const result = await pushEditedRecord(client, 'record-a', 'owner-a', 1, { notes: 'device one' });
  assert.equal(result, 2);
  assert.equal(row.notes, 'device one');
  assert.equal(client.writes[0].patch.approval_status, 'pending');
  await assert.rejects(pushEditedRecord(client, 'record-a', 'owner-a', 1, { notes: 'device two' }), EditConflict);
  assert.equal(row.notes, 'device one');
  assert.equal(client.writes.length, 1);
  // Following a deliberate review, the second device can use the new revision.
  assert.equal(await pushEditedRecord(client, 'record-a', 'owner-a', 2, { notes: 'reviewed edit' }), 3);
});

test('an unknown revision or another owner cannot overwrite the server', async () => {
  const row = { record_id: 'record-a', botanist_id: 'owner-a', version: 5, notes: 'safe' };
  const client = recordClient(row);
  await assert.rejects(pushEditedRecord(client, 'record-a', 'owner-a', null, { notes: 'legacy' }), EditConflict);
  await assert.rejects(pushEditedRecord(client, 'record-a', 'owner-b', 5, { notes: 'not mine' }), EditConflict);
  assert.equal(row.notes, 'safe');
  assert.equal(client.writes.length, 0);
});

test('database errors surface without treating the row as synced', async () => {
  const error = new Error('network timeout');
  const client = { from: () => ({ update: () => ({ eq() { return this; }, select() { return this; },
    maybeSingle: async () => ({ data: null, error }) }) }) };
  await assert.rejects(pushEditedRecord(client, 'record-a', 'owner-a', 1, { notes: 'edit' }), error);
});

test('resubmitting a rejected record clears the stored rejection reason', async () => {
  const row = {
    record_id: 'record-b',
    botanist_id: 'owner-b',
    version: 2,
    approval_status: 'rejected',
    rejection_reason: 'Photo too blurred to verify',
    notes: 'original',
  };
  const client = recordClient(row);
  const result = await pushEditedRecord(client, 'record-b', 'owner-b', 2, { notes: 'corrected' });
  assert.equal(result, 3);
  assert.equal(row.version, 3);
  assert.equal(row.rejection_reason, null);
  assert.equal(row.approval_status, 'pending');
});
