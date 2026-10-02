import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'plantiful.db';
const SCHEMA_VERSION = 1;

async function migrateDbIfNeeded(db: SQLite.SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion >= SCHEMA_VERSION) {
    return;
  }

  if (currentDbVersion === 0) {
    await db.execAsync(`
PRAGMA journal_mode = 'wal';
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS plants (
  id TEXT PRIMARY KEY NOT NULL,
  species_name TEXT NOT NULL,
  taxonomy TEXT,
  morphology TEXT,
  height_cm REAL,
  gps_lat REAL,
  gps_lng REAL,
  gps_accuracy_m REAL,
  capture_ts TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  server_id TEXT
);

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY NOT NULL,
  plant_id TEXT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  local_uri TEXT NOT NULL,
  capture_ts TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS species_catalog (
  id TEXT PRIMARY KEY NOT NULL,
  scientific_name TEXT NOT NULL,
  common_name TEXT,
  conservation_status TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error TEXT,
  created_ts TEXT NOT NULL
);
`);
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

export async function openDatabase() {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await migrateDbIfNeeded(db);
  return db;
}

export type TestRecord = {
  id: string;
  species_name: string;
  capture_ts: string;
  sync_status: string;
};

export async function insertTestRecord(db: SQLite.SQLiteDatabase) {
  const payload: TestRecord = {
    id: `test-${Date.now()}`,
    species_name: 'Rafflesia arnoldii',
    capture_ts: new Date().toISOString(),
    sync_status: 'pending',
  };
  await db.runAsync(
    'INSERT INTO plants (id, species_name, capture_ts, sync_status) VALUES (?, ?, ?, ?)',
    payload.id,
    payload.species_name,
    payload.capture_ts,
    payload.sync_status
  );
  return payload;
}

export async function getTestRecords(db: SQLite.SQLiteDatabase) {
  return db.getAllAsync<TestRecord>(
    "SELECT id, species_name, capture_ts, sync_status FROM plants WHERE id LIKE 'test-%' ORDER BY capture_ts DESC"
  );
}

export async function deleteTestRecords(db: SQLite.SQLiteDatabase) {
  await db.runAsync("DELETE FROM plants WHERE id LIKE 'test-%'");
}