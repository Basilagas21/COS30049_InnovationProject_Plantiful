import { File } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'plantiful.db';
const SCHEMA_VERSION = 3;

async function migrateDbIfNeeded(db: SQLite.SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion < 2) {
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
    currentDbVersion = 2;
  }

  if (currentDbVersion < 3) {
    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(local_records)');
    const hasProvisional = columns.some((column) => column.name === 'provisional_name');
    if (!hasProvisional) {
      await db.execAsync('ALTER TABLE local_records ADD COLUMN provisional_name TEXT');
    }
    currentDbVersion = 3;
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
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
  provisional_name: string | null;
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

export type LocalRecordWithPhoto = LocalRecord & {
  photo_uri: string | null;
  species_name: string | null;
};

export async function insertLocalRecord(
  db: SQLite.SQLiteDatabase,
  input: {
    qr_code?: string | null;
    species_id?: string | null;
    provisional_name?: string | null;
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
      record_id, species_id, qr_code, provisional_name, gps_lat, gps_lng, gps_accuracy_m, height_cm,
      morphology, notes, capture_ts, sync_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    recordId,
    input.species_id ?? null,
    input.qr_code ?? null,
    input.provisional_name ?? null,
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
       r.record_id, r.species_id, r.qr_code, r.provisional_name,
       r.gps_lat, r.gps_lng, r.gps_accuracy_m,
       r.height_cm, r.morphology, r.notes, r.capture_ts, r.sync_status, r.server_id,
       r.sync_error, r.created_at,
       COALESCE(s.common_name, s.scientific_name) AS species_name,
       (SELECT p.local_uri FROM local_photos p WHERE p.record_id = r.record_id ORDER BY p.capture_ts DESC LIMIT 1) AS photo_uri
     FROM local_records r
     LEFT JOIN species_catalog s ON s.species_id = r.species_id
     ORDER BY r.capture_ts DESC`
  );
}

export async function getLocalRecord(
  db: SQLite.SQLiteDatabase,
  recordId: string
): Promise<LocalRecordWithPhoto | null> {
  return db.getFirstAsync<LocalRecordWithPhoto>(
    `SELECT
       r.record_id, r.species_id, r.qr_code, r.provisional_name, r.gps_lat, r.gps_lng, r.gps_accuracy_m,
       r.height_cm, r.morphology, r.notes, r.capture_ts, r.sync_status, r.server_id,
       r.sync_error, r.created_at,
       COALESCE(s.common_name, s.scientific_name) AS species_name,
       (SELECT p.local_uri FROM local_photos p WHERE p.record_id = r.record_id ORDER BY p.capture_ts DESC LIMIT 1) AS photo_uri
     FROM local_records r
     LEFT JOIN species_catalog s ON s.species_id = r.species_id
     WHERE r.record_id = ?`,
    recordId
  );
}

export async function getLocalRecordByQR(
  db: SQLite.SQLiteDatabase,
  qrCode: string
): Promise<LocalRecordWithPhoto | null> {
  return db.getFirstAsync<LocalRecordWithPhoto>(
    `SELECT
       r.record_id, r.species_id, r.qr_code, r.provisional_name, r.gps_lat, r.gps_lng, r.gps_accuracy_m,
       r.height_cm, r.morphology, r.notes, r.capture_ts, r.sync_status, r.server_id,
       r.sync_error, r.created_at,
       COALESCE(s.common_name, s.scientific_name) AS species_name,
       (SELECT p.local_uri FROM local_photos p WHERE p.record_id = r.record_id ORDER BY p.capture_ts DESC LIMIT 1) AS photo_uri
     FROM local_records r
     LEFT JOIN species_catalog s ON s.species_id = r.species_id
     WHERE r.qr_code = ?`,
    qrCode
  );
}

// Records still to push: new captures plus earlier attempts that failed, so a
// lost connection mid-sync is retried on the next "Sync now".
export async function getPendingRecords(db: SQLite.SQLiteDatabase): Promise<LocalRecord[]> {
  return db.getAllAsync<LocalRecord>(
    `SELECT * FROM local_records WHERE sync_status IN ('pending', 'failed') ORDER BY capture_ts ASC`
  );
}

export async function countUnsyncedRecords(db: SQLite.SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>(
    "SELECT COUNT(*) AS n FROM local_records WHERE sync_status != 'synced'"
  );
  return row?.n ?? 0;
}

export async function getPhotosForRecord(
  db: SQLite.SQLiteDatabase,
  recordId: string
): Promise<{ id: string; local_uri: string; capture_ts: string; sync_status: string }[]> {
  return db.getAllAsync(
    'SELECT id, local_uri, capture_ts, sync_status FROM local_photos WHERE record_id = ? ORDER BY capture_ts ASC',
    recordId
  );
}

export async function markPhotoSynced(db: SQLite.SQLiteDatabase, photoId: string, serverUrl: string) {
  await db.runAsync(
    "UPDATE local_photos SET sync_status = 'synced', server_url = ? WHERE id = ?",
    serverUrl,
    photoId
  );
}

// Remember the server row as soon as it exists, so a retry after a failed photo
// upload reuses it instead of inserting a duplicate record.
export async function setRecordServerId(db: SQLite.SQLiteDatabase, recordId: string, serverId: string) {
  await db.runAsync('UPDATE local_records SET server_id = ? WHERE record_id = ?', serverId, recordId);
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
  const photos = await db.getAllAsync<{ local_uri: string }>(
    'SELECT local_uri FROM local_photos WHERE record_id = ?',
    recordId
  );
  for (const photo of photos) {
    try {
      const file = new File(photo.local_uri);
      if (file.exists) file.delete();
    } catch {
      // A missing or unreadable file shouldn't block deleting the record.
    }
  }
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
