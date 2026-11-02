import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';

// Behaviour tests for the owner-scoped local store queries. The SQL mirrors
// src/db.ts exactly; db.ts itself cannot be imported outside Expo because it
// loads the native expo-sqlite binding, so these tests pin the query
// semantics the app relies on: pushes, lists, counts and legacy adoption are
// all scoped to the signed-in account.

function freshDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE app_meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
    CREATE TABLE local_records (
      record_id TEXT PRIMARY KEY NOT NULL,
      qr_code TEXT,
      provisional_name TEXT,
      capture_ts TEXT NOT NULL,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      server_id TEXT,
      server_version INTEGER,
      edited INTEGER NOT NULL DEFAULT 0,
      owner_user_id TEXT,
      created_at TEXT NOT NULL
    );
  `);
  return db;
}

const A = 'aaaa0000-0000-0000-0000-000000000000';
const B = 'bbbb0000-0000-0000-0000-000000000000';
const NOW = '2026-11-01T00:00:00Z';

function insert(db, id, status, owner) {
  db.prepare(
    'INSERT INTO local_records (record_id, sync_status, owner_user_id, created_at, capture_ts) VALUES (?, ?, ?, ?, ?)'
  ).run(id, status, owner, NOW, NOW);
}

// Mirrors getPendingRecords(db, owner). The push queue walks oldest-first;
// the display lists (getRecordsByStatus) are newest-first, tested via the
// count helpers below since both share the owner predicate.
function getPendingRecords(db, owner) {
  return db.prepare(
    `SELECT * FROM local_records WHERE sync_status IN ('pending', 'failed') AND owner_user_id = ? ORDER BY capture_ts ASC`
  ).all(owner);
}

// Mirrors countUnsyncedRecords(db, owner)
function countUnsynced(db, owner) {
  return db.prepare(
    "SELECT COUNT(*) AS n FROM local_records WHERE sync_status != 'synced' AND owner_user_id = ?"
  ).get(owner).n;
}

// Mirrors adoptLegacyUnownedRecords(db, owner)
function adoptLegacy(db, owner) {
  const claimer = db.prepare("SELECT value FROM app_meta WHERE key = 'legacy_owner_claim'").get();
  if (claimer) {
    if (claimer.value !== owner) return;
  } else {
    db.prepare("INSERT INTO app_meta (key, value) VALUES ('legacy_owner_claim', ?)").run(owner);
  }
  db.prepare('UPDATE local_records SET owner_user_id = ? WHERE owner_user_id IS NULL').run(owner);
}

test('pending push only returns the signed-in owner rows', () => {
  const db = freshDb();
  insert(db, 'r-a', 'pending', A);
  insert(db, 'r-b', 'pending', B);
  insert(db, 'r-a-failed', 'failed', A);
  assert.deepEqual(getPendingRecords(db, A).map((r) => r.record_id).sort(), ['r-a', 'r-a-failed']);
  assert.deepEqual(getPendingRecords(db, B).map((r) => r.record_id), ['r-b']);
});

test('synced rows are never pushed', () => {
  const db = freshDb();
  insert(db, 'r-done', 'synced', A);
  assert.equal(getPendingRecords(db, A).length, 0);
});

test('push queue walks oldest capture first', () => {
  const db = freshDb();
  db.prepare(
    'INSERT INTO local_records (record_id, sync_status, owner_user_id, created_at, capture_ts) VALUES (?, ?, ?, ?, ?)'
  ).run('r-new', 'pending', A, NOW, '2026-11-02T00:00:00Z');
  db.prepare(
    'INSERT INTO local_records (record_id, sync_status, owner_user_id, created_at, capture_ts) VALUES (?, ?, ?, ?, ?)'
  ).run('r-old', 'pending', A, NOW, '2026-11-01T00:00:00Z');
  assert.deepEqual(getPendingRecords(db, A).map((r) => r.record_id), ['r-old', 'r-new']);
});

test('unsynced count is scoped to the owner', () => {
  const db = freshDb();
  insert(db, 'r-a', 'pending', A);
  insert(db, 'r-b', 'pending', B);
  insert(db, 'r-b2', 'failed', B);
  assert.equal(countUnsynced(db, A), 1);
  assert.equal(countUnsynced(db, B), 2);
});

test('first account adopts legacy unowned rows once', () => {
  const db = freshDb();
  insert(db, 'legacy', 'pending', null);
  adoptLegacy(db, A);
  assert.equal(getPendingRecords(db, A).map((r) => r.record_id).includes('legacy'), true);
});

test('second account cannot steal unowned rows after adoption', () => {
  const db = freshDb();
  insert(db, 'legacy', 'pending', null);
  adoptLegacy(db, A);
  insert(db, 'late-unowned', 'pending', null);
  adoptLegacy(db, B);
  assert.equal(getPendingRecords(db, B).length, 0);
  assert.equal(
    db.prepare('SELECT owner_user_id FROM local_records WHERE record_id = ?').get('late-unowned').owner_user_id,
    null
  );
});

test('adoption never reassigns rows that already have an owner', () => {
  const db = freshDb();
  insert(db, 'owned-b', 'pending', B);
  adoptLegacy(db, A);
  assert.equal(
    db.prepare('SELECT owner_user_id FROM local_records WHERE record_id = ?').get('owned-b').owner_user_id,
    B
  );
});
