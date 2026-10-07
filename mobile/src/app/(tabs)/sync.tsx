import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/lib/interactionLog';
import { colors } from '@/theme';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  getPendingRecords,
  getPhotosForRecord,
  markPhotoSynced,
  getRecordsByStatus,
  markRecordFailed,
  markRecordSynced,
  openDatabase,
  setRecordServerId,
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
  const tagText = tag ? ` (${tag})` : '';

  if (code === '23505' && raw.toLowerCase().includes('qr_code')) {
    return `Plant tag${tagText} is already registered on the central database. Edit the record and use a different tag.`;
  }
  if (code === '23505') {
    return `Duplicate value rejected by the central database${tagText}.`;
  }
  if (code === '42501' || raw.toLowerCase().includes('row-level security')) {
    return 'The central database rejected this write under its access rules.';
  }
  return raw;
}

async function uploadPhoto(
  userId: string,
  recordId: string,
  photo: { id: string; local_uri: string }
): Promise<string | null> {
  try {
    const response = await fetch(photo.local_uri);
    const blob = await response.blob();
    const path = `${userId}/${recordId}/${photo.id}.jpg`;
    const { data, error } = await supabase!.storage
      .from(PHOTO_BUCKET)
      .upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: true });
    if (error) throw error;
    return supabase!.storage.from(PHOTO_BUCKET).getPublicUrl(data.path).data.publicUrl;
  } catch (e) {
    const detail = e instanceof Error ? e.message : 'unknown error';
    console.warn(`[sync] photo upload failed for ${recordId}: ${detail}`);
    return null;
  }
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

    const rows = await getPendingRecords(db);
    if (rows.length === 0) {
      setState('done');
      setMessage('Nothing to sync. Captures made offline appear here as pending.');
      return;
    }

    setState('syncing');
    setSynced(0);
    setFailed(0);

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

        if (serverRecordId && row.edited) {
          // Locally edited after syncing: push the correction to the same
          // record and reset it for officer re-review, because the approved
          // data no longer matches what was reviewed.
          const { error: updateError } = await supabase
            .from('plant_records')
            .update({
              ...observation,
              status: 'submitted',
              approval_status: 'pending',
            })
            .eq('record_id', serverRecordId);
          if (updateError) throw updateError;
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

          if (error) throw error;
          serverRecordId = inserted.record_id;
          await setRecordServerId(db, row.record_id, serverRecordId);
        }

        const photos = await getPhotosForRecord(db, row.record_id);
        for (const photo of photos) {
          if (photo.sync_status === 'synced') continue;

          const expectedPath = `${session.session.user.id}/${serverRecordId}/${photo.id}.jpg`;
          const expectedUrl = supabase!.storage
            .from(PHOTO_BUCKET)
            .getPublicUrl(expectedPath).data.publicUrl;

          const existingPhoto = await supabase
            .from('plant_record_photos')
            .select('photo_id')
            .eq('record_id', serverRecordId!)
            .eq('photo_url', expectedUrl)
            .maybeSingle();

          if (existingPhoto.data) continue;

          const photoUrl = await uploadPhoto(session.session.user.id, serverRecordId!, photo);
          if (!photoUrl) {
            throw new Error('Photo upload failed — check your connection and try again.');
          }
          const { error: photoError } = await supabase.from('plant_record_photos').insert({
            record_id: serverRecordId!,
            photo_url: photoUrl,
          });
          if (photoError) throw photoError;
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