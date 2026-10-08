import { Ionicons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/lib/interactionLog';
import { colors } from '@/theme';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  getPendingRecords,
  getPhotosForRecord,
  getSyncedPhotos,
  markPhotoPending,
  markPhotoSynced,
  getRecordsByStatus,
  markRecordFailed,
  markRecordPendingForRepair,
  markRecordSynced,
  openDatabase,
  setRecordServerId,
  insertSpeciesPhotos,
  updateRecordReviewStatus,
  upsertSpeciesCatalog,
  type LocalRecord,
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
  const raw = error instanceof Error ? error.message : String(error);
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
      return `The photo bucket rejected the upload${tagText}. Run 005_record_photo_sync.sql in the Supabase SQL editor, then press Sync now again.`;
    }
    return 'The central database rejected this write under its access rules.';
  }

  return details ? `${raw} (${details})` : raw;
}

// True only when the object exists and is a plausible image. Earlier builds
// uploaded a 14-byte "File not found" text page instead of photo bytes, so
// size is checked before a photo is trusted as synced.
async function isRemotePhotoHealthy(folder: string, name: string): Promise<boolean> {
  try {
    const { data, error } = await supabase!.storage
      .from(PHOTO_BUCKET)
      .list(folder, { search: name });
    if (error) return false;
    const object = data?.find((entry) => entry.name === name);
    const size = object?.metadata?.size;
    return Boolean(object) && typeof size === 'number' && size >= 1024;
  } catch {
    return false;
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
  const router = useRouter();
  const [state, setState] = useState<SyncState>('idle');
  const [pending, setPending] = useState(0);
  const [synced, setSynced] = useState(0);
  const [failed, setFailed] = useState(0);
  const [message, setMessage] = useState('');
  const [needsAuth, setNeedsAuth] = useState(false);
  const [pendingList, setPendingList] = useState<LocalRecord[]>([]);
  const [failedList, setFailedList] = useState<LocalRecord[]>([]);
  const [syncedList, setSyncedList] = useState<LocalRecord[]>([]);

  const loadCounts = useCallback(async () => {
    const db = await openDatabase();
    const [pendingRows, failedRows, syncedRows] = await Promise.all([
      getRecordsByStatus(db, 'pending'),
      getRecordsByStatus(db, 'failed'),
      getRecordsByStatus(db, 'synced'),
    ]);
    setPendingList(pendingRows);
    setFailedList(failedRows);
    setSyncedList(syncedRows);
    setPending(pendingRows.length);
    setFailed(failedRows.length);
    setSynced(syncedRows.length);
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
          .select('record_id, approval_status, reviewed_at')
          .eq('botanist_id', session.session.user.id);
        if (reviews && reviews.length > 0) {
          for (const review of reviews) {
            await updateRecordReviewStatus(
              db,
              review.record_id,
              review.approval_status,
              review.reviewed_at
            );
          }
        }
      } catch (e) {
        console.warn('[sync] approval pull failed:', e instanceof Error ? e.message : e);
      }
    };

    // A qr_code clash means the tag was already registered from another
    // device. Adopt that row instead of failing as a duplicate: remember the
    // server id (so this record is never pushed as an insert again) and copy
    // the officer's review outcome. Null when the clash isn't about the plant
    // tag or the remote row isn't visible under this session's access rules.
    const adoptDuplicateByTag = async (error: unknown, row: LocalRecord): Promise<string | null> => {
      const code = (error as { code?: string } | null)?.code ?? '';
      const raw = error instanceof Error ? error.message : String(error);
      const details = (error as { details?: string } | null)?.details ?? '';
      if (code !== '23505' || !row.qr_code || !`${raw} ${details}`.toLowerCase().includes('qr_code')) {
        return null;
      }
      try {
        const { data: remote } = await supabase!
          .from('plant_records')
          .select('record_id, approval_status, reviewed_at')
          .eq('qr_code', row.qr_code)
          .maybeSingle();
        if (!remote) return null;
        await setRecordServerId(db, row.record_id, remote.record_id);
        await updateRecordReviewStatus(db, remote.record_id, remote.approval_status, remote.reviewed_at);
        return remote.record_id;
      } catch (e) {
        console.warn('[sync] duplicate adoption failed:', e instanceof Error ? e.message : e);
        return null;
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
        if (await isRemotePhotoHealthy(folder, `${photo.id}.jpg`)) continue;
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
      try {
        const observation = {
          species_id: row.species_id,
          provisional_name: row.provisional_name,
          qr_code: row.qr_code ? row.qr_code.trim().toUpperCase() : null,
          gps_lat: row.gps_lat,
          gps_lng: row.gps_lng,
          gps_accuracy_m: row.gps_accuracy_m,
          height_cm: row.height_cm,
          morphology: row.morphology,
          notes: row.notes,
        };

        // Idempotent push: a failed retry may already have inserted the row
        // server-side (e.g. upload succeeded then a photo failed), so match on
        // device_id before inserting to avoid duplicates.
        const { data: existing } = await supabase
          .from('plant_records')
          .select('record_id')
          .eq('device_id', row.record_id)
          .maybeSingle();

        let serverRecordId = existing?.record_id ?? row.server_id ?? null;

        // Locally edited after syncing: push the correction to the same
        // record and reset it for officer re-review, because the approved
        // data no longer matches what was reviewed.
        const pushEdit = async (serverId: string) => {
          const { error: updateError } = await supabase!
            .from('plant_records')
            .update({
              ...observation,
              status: 'submitted',
              approval_status: 'pending',
            })
            .eq('record_id', serverId);
          if (updateError) throw updateError;
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
            .select('record_id')
            .single();

          if (error) {
            const adoptedId = await adoptDuplicateByTag(error, row);
            if (!adoptedId) throw error;
            serverRecordId = adoptedId;
            if (row.edited) await pushEdit(serverRecordId);
          } else {
            serverRecordId = inserted.record_id;
            await setRecordServerId(db, row.record_id, serverRecordId);
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

          const remoteHealthy = await isRemotePhotoHealthy(photoFolder, photoName);
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

        await markRecordSynced(db, row.record_id, serverRecordId!);

        syncedCount += 1;
        setSynced(syncedCount);
      } catch (e) {
        const msg = describeSyncError(e, row.qr_code);
        await markRecordFailed(db, row.record_id, msg);
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
      ? `Synced ${syncedCount}, ${failedCount} failed. Failed records retry next time you press Sync now; tap one in Records for the reason.`
      : `All done — ${syncedCount} record(s) pushed to the central database as submitted.`);
  }, [loadCounts]);

  const connected = isSupabaseConfigured && supabase !== null;

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    padding: 16,
  },
  card: {
    backgroundColor: colors.sprout,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
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
    fontSize: 24,
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