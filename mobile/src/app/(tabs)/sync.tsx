import { Ionicons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/lib/interactionLog';
import { useThemeStyles } from '@/lib/theme';
import type { ThemeColors, ThemeSurfaces } from '@/theme';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { EditConflict, pushEditedRecord } from '@/lib/sync-edit';
import {
  getPendingRecords,
  bindRecordServerId,
  getAcceptanceMeasurements,
  getPhotosForRecord,
  getSyncedPhotos,
  markPhotoPending,
  markPhotoSynced,
  getRecordsByStatus,
  logAcceptanceMeasurement,
  markRecordFailed,
  markRecordConflict,
  markRecordPendingForRepair,
  markRecordSynced,
  openDatabase,
  setRecordServerId,
  insertSpeciesPhotos,
  updateRecordReviewStatus,
  upsertSpeciesCatalog,
  type LocalRecord,
  type AcceptanceMeasurement,
} from '@/db';

type SyncState = 'idle' | 'syncing' | 'done' | 'error';

// Must match the Supabase Storage bucket created for record photos.
const PHOTO_BUCKET = process.env.EXPO_PUBLIC_SUPABASE_PHOTO_BUCKET || 'record-photos';

/**
 * Turns a Supabase/PostgREST failure into something a botanist can act on.
 * The plant_tags uniqueness clash is the common case: tags are generated on
 * the device while offline, so two devices can mint the same code and the
 * central database rejects the second one.
 */
function describeSyncError(error: unknown, tag: string | null): string {
  // Supabase returns plain objects, not Error instances, so read .message
  // directly instead of printing "[object Object]".
  const message = (error as { message?: unknown } | null)?.message;
  const raw = typeof message === 'string' ? message : String(error);
  const code = (error as { code?: string } | null)?.code ?? '';
  const status = (error as { status?: number; statusCode?: number } | null) ?? {};
  const details = (error as { details?: string } | null)?.details ?? '';
  const tagText = tag ? ` (${tag})` : '';

  if (code === '23505' && raw.toLowerCase().includes('qr_code')) {
    return `Plant tag${tagText} is already registered on the central database. Edit the record and use a different tag.`;
  }
  if (code === '23505') {
    return `Duplicate value rejected by the central database${tagText}.`;
  }

  // An expired refresh token fails every write with a 401, which otherwise
  // looks like a permissions problem.
  const httpStatus = status.status ?? status.statusCode ?? 0;
  if (httpStatus === 401 || /jwt|not authenticated|invalid authentication/i.test(raw)) {
    return 'Your session has expired. Sign in again on the Profile tab, then press Sync now.';
  }

  if (code === '42501' || /row-level security/i.test(raw)) {
    // Storage writes fail the same way as table writes, but the remedy is a
    // migration rather than a permissions problem on the record itself.
    if (/storage|already exists|upsert|bucket|object/i.test(`${raw} ${details}`)) {
      return `The photo bucket rejected the upload${tagText}. Run apply_project.sql in the Supabase SQL editor, then press Sync now again.`;
    }
    return 'The central database rejected this write under its access rules.';
  }

  return details ? `${raw} (${details})` : raw;
}

// 'healthy' only when the object exists and is a plausible image. Earlier
// builds uploaded a 14-byte "File not found" text page instead of photo bytes,
// so size is checked before a photo is trusted as synced. 'unknown' means the
// bucket could not be checked (e.g. no signal), which is not proof of damage.
async function checkRemotePhoto(
  folder: string,
  name: string
): Promise<'healthy' | 'broken' | 'unknown'> {
  try {
    const { data, error } = await supabase!.storage
      .from(PHOTO_BUCKET)
      .list(folder, { search: name });
    if (error) return 'unknown';
    const object = data?.find((entry) => entry.name === name);
    const size = object?.metadata?.size;
    return object && typeof size === 'number' && size >= 1024 ? 'healthy' : 'broken';
  } catch {
    return 'unknown';
  }
}

// Reads the captured file from disk and uploads its bytes directly. Never use
// fetch() on a file URI here: it happily resolves to an error page and stores
// that as the "photo".
async function uploadPhoto(
  userId: string,
  recordId: string,
  photo: { id: string; local_uri: string }
): Promise<string> {
  if (!photo.local_uri.startsWith('file:')) {
    throw new Error('Photo is not stored on this device — open the record and attach the photo again.');
  }

  const file = new File(photo.local_uri);
  if (!file.exists || (file.size ?? 0) < 1024) {
    throw new Error('Photo file is missing on this device — open the record and attach the photo again.');
  }

  const bytes = await file.bytes();
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
  if (!isJpeg && !isPng) {
    throw new Error('Stored photo is not a valid image — attach the photo again.');
  }

  const contentType = isPng ? 'image/png' : 'image/jpeg';
  const path = `${userId}/${recordId}/${photo.id}.jpg`;
  // Pass the Uint8Array straight through: React Native's Blob constructor
  // rejects binary parts ("creating blobs from ArrayBuffer... not supported"),
  // while RN's request layer converts ArrayBufferView bodies natively.
  const { data, error } = await supabase!.storage
    .from(PHOTO_BUCKET)
    .upload(path, bytes, { contentType, upsert: true });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  return supabase!.storage.from(PHOTO_BUCKET).getPublicUrl(data.path).data.publicUrl;
}

export default function SyncScreen() {
  const { colors, styles } = useThemeStyles(createStyles);
  const router = useRouter();
  const [state, setState] = useState<SyncState>('idle');
  const [pending, setPending] = useState(0);
  const [synced, setSynced] = useState(0);
  const [failed, setFailed] = useState(0);
  const [message, setMessage] = useState('');
  const [needsAuth, setNeedsAuth] = useState(false);
  const [pendingList, setPendingList] = useState<LocalRecord[]>([]);
  const [failedList, setFailedList] = useState<LocalRecord[]>([]);
  const [conflictList, setConflictList] = useState<LocalRecord[]>([]);
  const [syncedList, setSyncedList] = useState<LocalRecord[]>([]);
  const [measurements, setMeasurements] = useState<AcceptanceMeasurement[]>([]);

  const loadCounts = useCallback(async () => {
    const db = await openDatabase();
    const [pendingRows, failedRows, conflictRows, syncedRows] = await Promise.all([
      getRecordsByStatus(db, 'pending'),
      getRecordsByStatus(db, 'failed'),
      getRecordsByStatus(db, 'conflict'),
      getRecordsByStatus(db, 'synced'),
    ]);
    setPendingList(pendingRows);
    setFailedList(failedRows);
    setConflictList(conflictRows);
    setSyncedList(syncedRows);
    setPending(pendingRows.length);
    setFailed(failedRows.length);
    setSynced(syncedRows.length);
    setMeasurements(await getAcceptanceMeasurements(db));
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        if (!cancelled) await loadCounts();
      })();
      return () => {
        cancelled = true;
      };
    }, [loadCounts])
  );

  const runSync = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setState('error');
      setMessage('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to mobile/.env');
      return;
    }

    const db = await openDatabase();

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      setState('error');
      setNeedsAuth(true);
      setMessage('Sign in on the Profile tab to unlock syncing.');
      return;
    }

    const { data: species } = await supabase
      .from('species')
      .select('species_id, scientific_name, common_name, conservation_status, taxonomy, description');
    if (species && species.length > 0) {
      await upsertSpeciesCatalog(db, species);
    }

    // Photos are best-effort: a failed pull must not fail the sync, the same
    // way the photo repair scan below swallows its errors.
    try {
      const { data: speciesPhotos } = await supabase
        .from('species_photos')
        .select('photo_id, species_id, photo_url');
      if (speciesPhotos && speciesPhotos.length > 0) {
        await insertSpeciesPhotos(db, speciesPhotos);
      }
    } catch (e) {
      console.warn('[sync] species photos pull failed:', e instanceof Error ? e.message : e);
    }

    // Pull own records' approval outcome so the botanist sees the officer's
    // review on the record detail screen. Matching is done in db.ts against
    // the server record id stored in server_id.
    const pullReviewOutcomes = async () => {
      try {
        const { data: reviews } = await supabase!
          .from('plant_records')
          .select('record_id, approval_status, reviewed_at, rejection_reason')
          .eq('botanist_id', session.session.user.id);
        if (reviews && reviews.length > 0) {
          for (const review of reviews) {
            await updateRecordReviewStatus(
              db,
              review.record_id,
              review.approval_status,
              review.reviewed_at,
              review.rejection_reason
            );
          }
        }
      } catch (e) {
        console.warn('[sync] approval pull failed:', e instanceof Error ? e.message : e);
      }
    };

    setState('syncing');
    setSynced(0);
    setFailed(0);

    // Self-heal pass: check photos already flagged synced against the bucket.
    // A missing or truncated object (older builds uploaded an error page
    // instead of image bytes) re-queues its record so the loop below
    // re-uploads the real photo bytes with upsert.
    try {
      const syncedPhotos = await getSyncedPhotos(db);
      for (const photo of syncedPhotos) {
        const folder = `${session.session.user.id}/${photo.server_id}`;
        // Only re-queue on a confirmed bad object; offline, every check fails
        // and would wrongly push already-synced records back into the queue.
        if ((await checkRemotePhoto(folder, `${photo.id}.jpg`)) !== 'broken') continue;
        await markPhotoPending(db, photo.id);
        await markRecordPendingForRepair(db, photo.record_id);
      }
    } catch (e) {
      console.warn('[sync] photo repair scan failed:', e instanceof Error ? e.message : e);
    }

    const rows = await getPendingRecords(db);
    if (rows.length === 0) {
      await pullReviewOutcomes();
      setState('done');
      setMessage('Nothing to sync. Captures made offline appear here as pending.');
      return;
    }

    // Count locally: the synced/failed state values are stale inside this callback.
    let syncedCount = 0;
    let failedCount = 0;

    for (const row of rows) {
      const startedAt = Date.now();
      try {
        const observation = {
          species_id: row.species_id,
          provisional_name: row.provisional_name,
          qr_code: row.qr_code ? row.qr_code.trim().toUpperCase() : null,
          gps_lat: row.gps_lat,
          gps_lng: row.gps_lng,
          gps_accuracy_m: row.gps_accuracy_m,
          height_cm: row.height_cm,
          dbh_cm: row.dbh_cm,
          taxonomy: row.taxonomy,
          phenology: row.phenology,
          morphology: row.morphology,
          notes: row.notes,
        };

        // Idempotent push: a failed retry may already have inserted the row
        // server-side (e.g. upload succeeded then a photo failed), so match on
        // device_id before inserting to avoid duplicates.
        const { data: existing, error: lookupError } = await supabase
          .from('plant_records')
          .select('record_id, version, botanist_id')
          .eq('device_id', row.record_id)
          .eq('botanist_id', session.session.user.id)
          .maybeSingle();
        if (lookupError) throw lookupError;

        // A previously known server row must not be recreated if it is now
        // invisible (deleted or access changed).
        if (row.server_id && existing && row.server_id !== existing.record_id) {
          throw new EditConflict('The server record differs from the saved copy. Review before retrying.');
        }
        if (existing && !row.server_id && row.edited) {
          // An interrupted earlier insert can already exist remotely. Keep
          // the local edit and bind its identity without inventing a revision.
          await bindRecordServerId(db, row.record_id, existing.record_id);
        }

        let serverRecordId = existing?.record_id ?? row.server_id ?? null;
        let serverVersion = row.server_version ?? existing?.version ?? null;

        // Locally edited after syncing: push the correction to the same
        // record and reset it for officer re-review, because the approved
        // data no longer matches what was reviewed.
        const pushEdit = async (serverId: string) => {
          serverVersion = await pushEditedRecord(
            supabase!, serverId, session.session.user.id, row.server_version, observation
          );
          // An upload may fail afterwards; retrying must not repeat this edit.
          await setRecordServerId(db, row.record_id, serverId, serverVersion);
        };

        if (serverRecordId && row.edited) {
          await pushEdit(serverRecordId);
        } else if (!serverRecordId) {
          const { data: inserted, error } = await supabase
            .from('plant_records')
            .insert({
              botanist_id: session.session.user.id,
              ...observation,
              status: 'submitted',
              approval_status: 'pending',
              device_id: row.record_id,
            })
            .select('record_id, version')
            .single();

          if (error) {
            throw error;
          } else {
            serverRecordId = inserted.record_id;
            serverVersion = inserted.version;
            await setRecordServerId(db, row.record_id, serverRecordId, serverVersion);
          }
        }

        const photos = await getPhotosForRecord(db, row.record_id);
        const photoFolder = `${session.session.user.id}/${serverRecordId!}`;
        for (const photo of photos) {
          if (photo.sync_status === 'synced') continue;

          const photoName = `${photo.id}.jpg`;
          const expectedUrl = supabase!.storage
            .from(PHOTO_BUCKET)
            .getPublicUrl(`${photoFolder}/${photoName}`).data.publicUrl;

          const existingPhoto = await supabase
            .from('plant_record_photos')
            .select('photo_id')
            .eq('record_id', serverRecordId!)
            .eq('photo_url', expectedUrl)
            .maybeSingle();

          const remoteHealthy = (await checkRemotePhoto(photoFolder, photoName)) === 'healthy';
          if (existingPhoto.data && remoteHealthy) {
            await markPhotoSynced(db, photo.id, expectedUrl);
            continue;
          }

          // Upload the real file bytes; upsert overwrites a broken object.
          const photoUrl = await uploadPhoto(session.session.user.id, serverRecordId!, photo);
          if (!existingPhoto.data) {
            const { error: photoError } = await supabase.from('plant_record_photos').insert({
              record_id: serverRecordId!,
              photo_url: photoUrl,
            });
            if (photoError) throw photoError;
          }
          await markPhotoSynced(db, photo.id, photoUrl);
        }

        await markRecordSynced(db, row.record_id, serverRecordId!, serverVersion!);
        await logAcceptanceMeasurement(db, 'sync_record', 'synced', startedAt, row.record_id);

        syncedCount += 1;
        setSynced(syncedCount);
      } catch (e) {
        const msg = describeSyncError(e, row.qr_code);
        if (e instanceof EditConflict) await markRecordConflict(db, row.record_id, e.message);
        else await markRecordFailed(db, row.record_id, msg);
        await logAcceptanceMeasurement(db, 'sync_record', e instanceof EditConflict ? 'conflict' : 'failed', startedAt, row.record_id);
        failedCount += 1;
        setFailed(failedCount);
      }
    }

    const remaining = await getPendingRecords(db);
    setPending(remaining.length);
    await pullReviewOutcomes();
    await loadCounts();
    setState(failedCount > 0 ? 'error' : 'done');
    setMessage(failedCount > 0
      ? `Synced ${syncedCount}, ${failedCount} need attention. Conflicts require review; other failures retry when you press Sync now.`
      : `All done — ${syncedCount} record(s) pushed to the central database as submitted.`);
  }, [loadCounts]);

  const connected = isSupabaseConfigured && supabase !== null;
  const attempts = measurements.filter((m) => m.operation === 'sync_record');
  const localLookups = measurements.filter((m) => m.operation === 'qr_lookup' && m.outcome === 'local_found');
  const successfulAttempts = attempts.filter((m) => m.outcome === 'synced').length;
  const fastLookups = localLookups.filter((m) => m.duration_ms < 5000).length;
  const averageLocalLookupMs = localLookups.length
    ? Math.round(localLookups.reduce((sum, m) => sum + m.duration_ms, 0) / localLookups.length)
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons
          name={state === 'error' && needsAuth ? 'lock-closed-outline' : 'cloud-done-outline'}
          size={40}
          color={state === 'error' && needsAuth ? colors.danger : colors.emerald}
        />
        <Text style={styles.title}>Sync centre</Text>
        <Text style={styles.hint}>
          Offline captures are pushed to the central Supabase database as submitted records, ready for an officer to review.
        </Text>

        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{synced}</Text>
            <Text style={styles.statLabel}>Synced</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{failed}</Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
        </View>

        <Pressable
          style={[styles.primaryButton, state === 'syncing' && styles.buttonBusy]}
          onPress={runSync}
          disabled={state === 'syncing'}
        >
          <Text style={styles.primaryButtonText}>
            {state === 'syncing' ? 'Syncing…' : 'Sync now'}
          </Text>
        </Pressable>

        {needsAuth ? (
          <Pressable style={styles.ghostButton} onPress={() => router.navigate('/profile')}>
            <Text style={styles.ghostButtonText}>Go to Profile to sign in</Text>
          </Pressable>
        ) : null}

        {pendingList.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending ({pendingList.length})</Text>
            {pendingList.map((r) => (
              <Text key={r.record_id} style={styles.listItem}>
                • {r.provisional_name || r.species_id || 'Unknown'} — {new Date(r.capture_ts).toLocaleString()}
              </Text>
            ))}
          </View>
        ) : null}

        {failedList.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Failed ({failedList.length})</Text>
            {failedList.map((r) => (
              <View key={r.record_id} style={styles.listBlock}>
                <Text style={styles.listItem}>
                  • {r.provisional_name || r.species_id || 'Unknown'} — {new Date(r.capture_ts).toLocaleString()}
                </Text>
                {r.sync_error ? <Text style={styles.errorText}>{r.sync_error}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {conflictList.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conflicts ({conflictList.length}) — review before retrying</Text>
            {conflictList.map((r) => (
              <Pressable key={r.record_id} onPress={() => router.push(`/record/${r.record_id}`)}>
                <Text style={styles.listItem}>• {r.provisional_name || r.qr_code || 'Unknown'} — Open record</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {syncedList.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Synced ({syncedList.length})</Text>
            {syncedList.map((r) => (
              <Text key={r.record_id} style={styles.listItem}>
                • {r.provisional_name || r.species_id || 'Unknown'} — {new Date(r.capture_ts).toLocaleString()}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acceptance measurements (latest 1,000 events)</Text>
          <Text style={styles.listItem}>
            Sync success: {successfulAttempts}/{attempts.length} attempts
            {attempts.length ? ` (${(100 * successfulAttempts / attempts.length).toFixed(1)}%)` : ''}
          </Text>
          <Text style={styles.listItem}>
            Cached QR lookup: {averageLocalLookupMs == null ? 'no samples' : `${averageLocalLookupMs} ms average`}; {fastLookups}/{localLookups.length} under 5 seconds
          </Text>
          <Text style={styles.listItem}>
            Starts at QR decoder callback / record push; includes SQLite lookup or upload, not camera recognition or user navigation. Conflicts and failed attempts count against sync success; retries count as new attempts. Raw dated rows remain in local SQLite acceptance_measurements.
          </Text>
        </View>

        {message || state === 'idle' ? (
          <Text style={styles.lastSync}>
            {message || 'Last sync: never'}
          </Text>
        ) : null}
        {!connected ? (
          <Text style={styles.lastSync}>Supabase not configured — add env vars to mobile/.env</Text>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors, surfaces: ThemeSurfaces) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    padding: 16,
  },
  card: {
    ...surfaces.card,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.pine,
  },
  hint: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  statRow: {
    flexDirection: 'row',
    gap: 24,
    marginVertical: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.emerald,
  },
  statLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  primaryButton: {
    alignSelf: 'stretch',
    backgroundColor: colors.emerald,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  ghostButton: {
    alignSelf: 'stretch',
    backgroundColor: colors.sand,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ghostButtonText: {
    color: colors.pine,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonBusy: {
    opacity: 0.6,
  },
  lastSync: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
  },
  section: {
    alignSelf: 'stretch',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.muted,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.pine,
  },
  listItem: {
    fontSize: 12,
    color: colors.pine,
  },
  listBlock: {
    gap: 2,
  },
  errorText: {
    fontSize: 11,
    color: colors.danger,
  },
});
