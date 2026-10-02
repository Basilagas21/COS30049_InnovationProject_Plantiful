import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'plantiful.db';
const SCHEMA_VERSION = 2;

async function migrateDbIfNeeded(db: SQLite.SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion < SCHEMA_VERSION) {
    await db.execAsync(`
PRAGMA journal_mode = 'wal';
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS species_catalog (
  species_id TEXT PRIMARY KEY NOT NULL,
  scientific_name TEXT NOT NULL,
  common_name TEXT,
  taxonomy TEXT,
  conservation_status TEXT,
  description TEXT,
  synced_at TEXT
);

CREATE TABLE IF NOT EXISTS local_records (
  record_id TEXT PRIMARY KEY NOT NULL,
  species_id TEXT,
  qr_code TEXT,
  gps_lat REAL,
  gps_lng REAL,
  gps_accuracy_m REAL,
  height_cm REAL,
  morphology TEXT,
  notes TEXT,
  capture_ts TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  server_id TEXT,
  sync_error TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_photos (
  id TEXT PRIMARY KEY NOT NULL,
  record_id TEXT NOT NULL REFERENCES local_records(record_id) ON DELETE CASCADE,
  local_uri TEXT NOT NULL,
  capture_ts TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  server_url TEXT
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
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }
}

let openDatabasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!openDatabasePromise) {
    openDatabasePromise = openDatabaseWithRecovery().catch((error) => {
      openDatabasePromise = null;
      throw error;
    });
  }
  return openDatabasePromise;
}

async function openDatabaseWithRecovery(): Promise<SQLite.SQLiteDatabase> {
  try {
    return await openDatabaseRaw(false);
  } catch (error) {
    if (!isPoisonedConnectionError(error)) {
      throw error;
    }
    // Known expo-sqlite Android bug: after a runtime teardown the shared native
    // connection is poisoned and every prepareAsync/getFirstAsync fails with a bare
    // NullPointerException. A plain reopen returns the same dead handle, so force a
    // brand-new connection to recover.
    return await openDatabaseRaw(true);
  }
}

async function openDatabaseRaw(useNewConnection: boolean): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(
    DATABASE_NAME,
    useNewConnection ? { useNewConnection } : undefined
  );
  await migrateDbIfNeeded(db);
  return db;
}

function isPoisonedConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message;
  return (
    (message.includes('NativeDatabase') || message.includes('NativeStatement')) &&
    message.includes('NullPointerException')
  );
}

export type LocalRecord = {
  record_id: string;
  species_id: string | null;
  qr_code: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  gps_accuracy_m: number | null;
  height_cm: number | null;
  morphology: string | null;
  notes: string | null;
  capture_ts: string;
  sync_status: string;
  server_id: string | null;
  sync_error: string | null;
  created_at: string;
};

export type LocalRecordWithPhoto = LocalRecord & { photo_uri: string | null };

export async function insertLocalRecord(
  db: SQLite.SQLiteDatabase,
  input: {
    qr_code?: string | null;
    species_id?: string | null;
    gps_lat?: number | null;
    gps_lng?: number | null;
    gps_accuracy_m?: number | null;
    height_cm?: number | null;
    morphology?: string | null;
    notes?: string | null;
  }
): Promise<string> {
  const recordId = `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO local_records (
      record_id, species_id, qr_code, gps_lat, gps_lng, gps_accuracy_m, height_cm,
      morphology, notes, capture_ts, sync_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    recordId,
    input.species_id ?? null,
    input.qr_code ?? null,
    input.gps_lat ?? null,
    input.gps_lng ?? null,
    input.gps_accuracy_m ?? null,
    input.height_cm ?? null,
    input.morphology ?? null,
    input.notes ?? null,
    now,
    now
  );
  return recordId;
}

export async function addLocalPhoto(
  db: SQLite.SQLiteDatabase,
  recordId: string,
  localUri: string
): Promise<string> {
  const photoId = `ph-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO local_photos (id, record_id, local_uri, capture_ts, sync_status) VALUES (?, ?, ?, ?, \'pending\')',
    photoId,
    recordId,
    localUri,
    now
  );
  return photoId;
}

export async function getLocalRecords(db: SQLite.SQLiteDatabase): Promise<LocalRecordWithPhoto[]> {
  return db.getAllAsync<LocalRecordWithPhoto>(
    `SELECT
       r.record_id, r.species_id, r.qr_code, r.gps_lat, r.gps_lng, r.gps_accuracy_m,
       r.height_cm, r.morphology, r.notes, r.capture_ts, r.sync_status, r.server_id,
       r.sync_error, r.created_at,
       (SELECT p.local_uri FROM local_photos p WHERE p.record_id = r.record_id ORDER BY p.capture_ts DESC LIMIT 1) AS photo_uri
     FROM local_records r
     ORDER BY r.capture_ts DESC`
  );
}

export async function getPendingRecords(db: SQLite.SQLiteDatabase): Promise<LocalRecord[]> {
  return db.getAllAsync<LocalRecord>(
    `SELECT * FROM local_records WHERE sync_status = 'pending' ORDER BY capture_ts ASC`
  );
}

export async function getPhotosForRecord(
  db: SQLite.SQLiteDatabase,
  recordId: string
): Promise<{ id: string; local_uri: string; capture_ts: string }[]> {
  return db.getAllAsync(
    'SELECT id, local_uri, capture_ts FROM local_photos WHERE record_id = ? ORDER BY capture_ts ASC',
    recordId
  );
}

export async function markRecordSynced(
  db: SQLite.SQLiteDatabase,
  recordId: string,
  serverId: string
) {
  await db.runAsync(
    "UPDATE local_records SET sync_status = 'synced', server_id = ?, sync_error = NULL WHERE record_id = ?",
    serverId,
    recordId
  );
}

export async function markRecordFailed(db: SQLite.SQLiteDatabase, recordId: string, error: string) {
  await db.runAsync(
    "UPDATE local_records SET sync_status = 'failed', sync_error = ? WHERE record_id = ?",
    error,
    recordId
  );
}

export async function deleteLocalRecord(db: SQLite.SQLiteDatabase, recordId: string) {
  await db.runAsync('DELETE FROM local_photos WHERE record_id = ?', recordId);
  await db.runAsync('DELETE FROM local_records WHERE record_id = ?', recordId);
}

export type SpeciesOption = {
  species_id: string;
  scientific_name: string;
  common_name: string | null;
  conservation_status: string | null;
};

export async function getSpeciesOptions(db: SQLite.SQLiteDatabase): Promise<SpeciesOption[]> {
  return db.getAllAsync<SpeciesOption>(
    `SELECT species_id, scientific_name, common_name, conservation_status
     FROM species_catalog
     ORDER BY scientific_name ASC`
  );
}

export async function upsertSpeciesCatalog(
  db: SQLite.SQLiteDatabase,
  species: SpeciesOption[]
) {
  const now = new Date().toISOString();
  for (const s of species) {
    await db.runAsync(
      `INSERT INTO species_catalog (species_id, scientific_name, common_name, conservation_status, synced_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(species_id) DO UPDATE SET
         scientific_name = excluded.scientific_name,
         common_name = excluded.common_name,
         conservation_status = excluded.conservation_status,
         synced_at = excluded.synced_at`,
      s.species_id,
      s.scientific_name,
      s.common_name ?? null,
      s.conservation_status ?? null,
      now
    );
  }
}

// Keep for compatibility with the old in-progress UI until fully replaced.
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
    'INSERT INTO species_catalog (species_id, scientific_name) VALUES (?, ?)',
    payload.id,
    payload.species_name
  );
  return payload;
}

export async function getTestRecords(db: SQLite.SQLiteDatabase) {
  return db.getAllAsync<TestRecord>(
    "SELECT species_id AS id, scientific_name AS species_name, created_at AS capture_ts, 'pending' AS sync_status FROM species_catalog WHERE species_id LIKE 'test-%' ORDER BY created_at DESC"
  );
}

export async function deleteTestRecords(db: SQLite.SQLiteDatabase) {
  await db.runAsync("DELETE FROM species_catalog WHERE species_id LIKE 'test-%'");
}