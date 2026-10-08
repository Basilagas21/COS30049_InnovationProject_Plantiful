import { File } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'plantiful.db';
const SCHEMA_VERSION = 6;

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

  // Repair the species catalog on EVERY open (not version-gated): it is a
  // server-backed cache, so if a stale table from an older build lacks
  // species_id it is dropped and rebuilt so no query can prepare against a
  // mismatched schema.
  {
    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(species_catalog)');
    if (!columns.some((column) => column.name === 'species_id')) {
      await db.execAsync('DROP TABLE IF EXISTS species_catalog');
      await db.execAsync(`
CREATE TABLE species_catalog (
  species_id TEXT PRIMARY KEY NOT NULL,
  scientific_name TEXT NOT NULL,
  common_name TEXT,
  taxonomy TEXT,
  conservation_status TEXT,
  description TEXT,
  synced_at TEXT
);
`);
    }
  }

  if (currentDbVersion < 4) {
    // Repair stale local_records schemas left by older app builds.
    const recalc = async (table: string) => {
      const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(' + table + ')');
      return !columns.some((column) => column.name === 'species_id');
    };
    if (await recalc('local_records')) {
      await db.execAsync('DROP TABLE IF EXISTS local_photos');
      await db.execAsync('DROP TABLE IF EXISTS sync_queue');
      await db.execAsync('DROP TABLE IF EXISTS local_records');
      await db.execAsync(`
CREATE TABLE local_records (
  record_id TEXT PRIMARY KEY NOT NULL,
  species_id TEXT,
  qr_code TEXT,
  gps_lat REAL,
  gps_lng REAL,
  gps_accuracy_m REAL,
  height_cm REAL,
  morphology TEXT,
  notes TEXT,
  provisional_name TEXT,
  capture_ts TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  server_id TEXT,
  sync_error TEXT,
  created_at TEXT NOT NULL
);
`);
      await db.execAsync(`
CREATE TABLE local_photos (
  id TEXT PRIMARY KEY NOT NULL,
  record_id TEXT NOT NULL REFERENCES local_records(record_id) ON DELETE CASCADE,
  local_uri TEXT NOT NULL,
  capture_ts TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  server_url TEXT
);
`);
      await db.execAsync(`
CREATE TABLE sync_queue (
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
    currentDbVersion = 4;
  }

  if (currentDbVersion < 5) {
    currentDbVersion = 5;
  }

  if (currentDbVersion < 6) {
    // Species reference photos are a server-backed cache like the catalog, so
    // the table is created idempotently and its rows are replaced on every
    // photos pull in sync.tsx.
    await db.execAsync(`
CREATE TABLE IF NOT EXISTS local_species_photos (
  photo_id TEXT PRIMARY KEY NOT NULL,
  species_id TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  synced_at TEXT
);
`);
    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(local_records)');
    if (!columns.some((column) => column.name === 'approval_status')) {
      await db.execAsync('ALTER TABLE local_records ADD COLUMN approval_status TEXT');
    }
    if (!columns.some((column) => column.name === 'reviewed_at')) {
      await db.execAsync('ALTER TABLE local_records ADD COLUMN reviewed_at TEXT');
    }
    currentDbVersion = 6;
  }

  // `edited` marks a locally edited record so the next sync pushes an UPDATE to
  // the existing server row instead of creating a duplicate. Repaired on EVERY
  // open rather than version-gated, so a half-applied migration can never leave
  // the column missing and break saving.
  {
    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(local_records)');
    if (!columns.some((column) => column.name === 'edited')) {
      await db.execAsync('ALTER TABLE local_records ADD COLUMN edited INTEGER NOT NULL DEFAULT 0');
    }
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
  approval_status: string | null;
  reviewed_at: string | null;
  edited: number;
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

export type RemoteRecordImport = {
  record_id: string;
  species_id?: string | null;
  qr_code?: string | null;
  provisional_name?: string | null;
  gps_lat?: number | null;
  gps_lng?: number | null;
  gps_accuracy_m?: number | null;
  height_cm?: number | null;
  morphology?: string | null;
  notes?: string | null;
  approval_status?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
};

// Imports a record found via a central-database lookup by tag as a fully
// synced local copy: server_id is set, review fields are copied, and photos
// are stored as their remote URLs (not file paths) so the push loop never
// re-inserts the record and never treats its photos as local files.
export async function importRemoteRecord(
  db: SQLite.SQLiteDatabase,
  remote: RemoteRecordImport,
  photos: { photo_url: string; taken_at?: string | null }[]
): Promise<string> {
  const recordId = `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO local_records (
       record_id, species_id, qr_code, provisional_name, gps_lat, gps_lng, gps_accuracy_m, height_cm,
       morphology, notes, capture_ts, sync_status, server_id, approval_status, reviewed_at, edited, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', ?, ?, ?, 0, ?)`,
    recordId,
    remote.species_id ?? null,
    remote.qr_code ? remote.qr_code.trim().toUpperCase() : null,
    remote.provisional_name ?? null,
    remote.gps_lat ?? null,
    remote.gps_lng ?? null,
    remote.gps_accuracy_m ?? null,
    remote.height_cm ?? null,
    remote.morphology ?? null,
    remote.notes ?? null,
    remote.created_at ?? now,
    remote.record_id,
    remote.approval_status ?? null,
    remote.reviewed_at ?? null,
    now
  );
  for (const photo of photos) {
    await db.runAsync(
      `INSERT INTO local_photos (id, record_id, local_uri, capture_ts, sync_status, server_url)
       VALUES (?, ?, ?, ?, 'synced', ?)`,
      `ph-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      recordId,
      photo.photo_url,
      photo.taken_at ?? now,
      photo.photo_url
    );
  }
  return recordId;
}

export async function getLocalRecords(db: SQLite.SQLiteDatabase): Promise<LocalRecordWithPhoto[]> {
  return db.getAllAsync<LocalRecordWithPhoto>(
    `SELECT
       r.record_id, r.species_id, r.qr_code, r.provisional_name,
       r.gps_lat, r.gps_lng, r.gps_accuracy_m,
       r.height_cm, r.morphology, r.notes, r.capture_ts, r.sync_status, r.server_id,
       r.sync_error, r.approval_status, r.reviewed_at, r.created_at,
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
       r.sync_error, r.approval_status, r.reviewed_at, r.edited, r.created_at,
       COALESCE(s.common_name, s.scientific_name) AS species_name,
       (SELECT p.local_uri FROM local_photos p WHERE p.record_id = r.record_id ORDER BY p.capture_ts DESC LIMIT 1) AS photo_uri
     FROM local_records r
     LEFT JOIN species_catalog s ON s.species_id = r.species_id
     WHERE r.record_id = ?`,
    recordId
  );
}

// Records still to push: new captures plus earlier attempts that failed, so a
// lost connection mid-sync is retried on the next "Sync now".
export async function getPendingRecords(db: SQLite.SQLiteDatabase): Promise<LocalRecord[]> {
  return db.getAllAsync<LocalRecord>(
    `SELECT * FROM local_records WHERE sync_status IN ('pending', 'failed') ORDER BY capture_ts ASC`
  );
}

export async function getRecordsByStatus(db: SQLite.SQLiteDatabase, status: string): Promise<LocalRecord[]> {
  return db.getAllAsync<LocalRecord>(
    `SELECT * FROM local_records WHERE sync_status = ? ORDER BY capture_ts ASC`,
    [status]
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

export type SyncedPhoto = {
  id: string;
  record_id: string;
  server_id: string;
};

// Photos already flagged synced, joined to their server record id, so a sync
// can verify the storage object really exists before trusting the flag. Only
// device captures (file:// URIs) are verified: photos imported from the
// central database live as remote URLs in local_uri and have no local file to
// repair, so they must never re-enter the upload/repair pipeline.
export async function getSyncedPhotos(db: SQLite.SQLiteDatabase): Promise<SyncedPhoto[]> {
  return db.getAllAsync<SyncedPhoto>(
    `SELECT p.id, p.record_id, r.server_id
     FROM local_photos p
     JOIN local_records r ON r.record_id = p.record_id
     WHERE p.sync_status = 'synced' AND r.server_id IS NOT NULL AND p.local_uri LIKE 'file:%'`
  );
}

export async function markPhotoPending(db: SQLite.SQLiteDatabase, photoId: string) {
  await db.runAsync("UPDATE local_photos SET sync_status = 'pending' WHERE id = ?", photoId);
}

// Queues a record for re-upload after a repair WITHOUT touching `edited` —
// re-sending a photo must not reset officer approval on the server row.
export async function markRecordPendingForRepair(db: SQLite.SQLiteDatabase, recordId: string) {
  await db.runAsync(
    "UPDATE local_records SET sync_status = 'pending', sync_error = NULL WHERE record_id = ?",
    recordId
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
    "UPDATE local_records SET sync_status = 'synced', server_id = ?, sync_error = NULL, edited = 0 WHERE record_id = ?",
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

/** Finds a saved record by its plant tag, matching the stored normalised form. */
export async function getRecordByTag(
  db: SQLite.SQLiteDatabase,
  tag: string
): Promise<LocalRecordWithPhoto | null> {
  const normalized = tag.trim().toUpperCase();
  return db.getFirstAsync<LocalRecordWithPhoto>(
    `SELECT
       r.record_id, r.species_id, r.qr_code, r.provisional_name, r.gps_lat, r.gps_lng, r.gps_accuracy_m,
       r.height_cm, r.morphology, r.notes, r.capture_ts, r.sync_status, r.server_id,
       r.sync_error, r.approval_status, r.reviewed_at, r.edited, r.created_at,
       (SELECT p.local_uri FROM local_photos p WHERE p.record_id = r.record_id ORDER BY p.capture_ts DESC LIMIT 1) AS photo_uri
     FROM local_records r
     WHERE r.qr_code = ? LIMIT 1`,
    normalized
  );
}

/**
 * True when the tag is already used by another record on this device. Catches
 * clashes at save time instead of letting them surface as a sync failure.
 */
export async function isTagInUse(
  db: SQLite.SQLiteDatabase,
  tag: string,
  exceptRecordId?: string
): Promise<boolean> {
  const normalized = tag.trim().toUpperCase();
  const row = await db.getFirstAsync<{ record_id: string }>(
    'SELECT record_id FROM local_records WHERE qr_code = ? AND record_id != ? LIMIT 1',
    normalized,
    exceptRecordId ?? ''
  );
  return row !== null;
}

/**
 * Applies an edit to a saved record. Editing re-queues the record for sync so
 * the correction is pushed to the central database; if the record had already
 * been synced it is returned to 'pending' and flagged as edited so the next
 * sync updates the existing server row instead of duplicating it.
 */
export async function updateLocalRecord(
  db: SQLite.SQLiteDatabase,
  recordId: string,
  patch: {
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
) {
  await db.runAsync(
    `UPDATE local_records SET
       qr_code = ?,
       species_id = ?,
       provisional_name = ?,
       gps_lat = ?,
       gps_lng = ?,
       gps_accuracy_m = ?,
       height_cm = ?,
       morphology = ?,
       notes = ?,
       sync_status = 'pending',
       sync_error = NULL,
       edited = 1
     WHERE record_id = ?`,
    patch.qr_code ?? null,
    patch.species_id ?? null,
    patch.provisional_name ?? null,
    patch.gps_lat ?? null,
    patch.gps_lng ?? null,
    patch.gps_accuracy_m ?? null,
    patch.height_cm ?? null,
    patch.morphology ?? null,
    patch.notes ?? null,
    recordId
  );
}

export async function deleteLocalPhoto(db: SQLite.SQLiteDatabase, photoId: string) {
  await db.runAsync('DELETE FROM local_photos WHERE id = ?', photoId);
}

export type SpeciesOption = {
  species_id: string;
  scientific_name: string;
  common_name: string | null;
  conservation_status: string | null;
  taxonomy: string | null;
  description: string | null;
};

export type SpeciesReference = SpeciesOption;

export async function getSpeciesOptions(db: SQLite.SQLiteDatabase): Promise<SpeciesOption[]> {
  return db.getAllAsync<SpeciesOption>(
    `SELECT species_id, scientific_name, common_name, conservation_status, taxonomy, description
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
      `INSERT INTO species_catalog (species_id, scientific_name, common_name, conservation_status, taxonomy, description, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(species_id) DO UPDATE SET
         scientific_name = excluded.scientific_name,
         common_name = excluded.common_name,
         conservation_status = excluded.conservation_status,
         taxonomy = excluded.taxonomy,
         description = excluded.description,
         synced_at = excluded.synced_at`,
      s.species_id,
      s.scientific_name,
      s.common_name ?? null,
      s.conservation_status ?? null,
      s.taxonomy ?? null,
      s.description ?? null,
      now
    );
  }
}

export async function getSpeciesById(
  db: SQLite.SQLiteDatabase,
  speciesId: string
): Promise<SpeciesOption | null> {
  return db.getFirstAsync<SpeciesOption>(
    `SELECT species_id, scientific_name, common_name, conservation_status, taxonomy, description
     FROM species_catalog
     WHERE species_id = ?`,
    speciesId
  );
}

export type SpeciesLocalPhoto = {
  photo_id: string;
  species_id: string;
  photo_url: string;
  synced_at: string;
};

// The photos pull is an authoritative snapshot of a species' reference images,
// so each species' previous rows are dropped before the fresh batch is written.
export async function insertSpeciesPhotos(
  db: SQLite.SQLiteDatabase,
  rows: { photo_id: string; species_id: string; photo_url: string }[]
) {
  const now = new Date().toISOString();
  const touched = [...new Set(rows.map((row) => row.species_id))];
  for (const speciesId of touched) {
    await db.runAsync('DELETE FROM local_species_photos WHERE species_id = ?', speciesId);
  }
  for (const row of rows) {
    await db.runAsync(
      'INSERT INTO local_species_photos (photo_id, species_id, photo_url, synced_at) VALUES (?, ?, ?, ?)',
      row.photo_id,
      row.species_id,
      row.photo_url,
      now
    );
  }
}

export async function getSpeciesPhotos(
  db: SQLite.SQLiteDatabase,
  speciesId: string
): Promise<SpeciesLocalPhoto[]> {
  return db.getAllAsync<SpeciesLocalPhoto>(
    'SELECT photo_id, species_id, photo_url, synced_at FROM local_species_photos WHERE species_id = ? ORDER BY synced_at ASC',
    speciesId
  );
}

// Review outcomes are keyed by the server record id, which lives in server_id
// on the device row, so match on that rather than the generated local id.
export async function updateRecordReviewStatus(
  db: SQLite.SQLiteDatabase,
  recordId: string,
  approvalStatus: string | null,
  reviewedAt: string | null
) {
  await db.runAsync(
    'UPDATE local_records SET approval_status = ?, reviewed_at = ? WHERE server_id = ?',
    approvalStatus,
    reviewedAt,
    recordId
  );
}
