import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  getPendingRecords,
  getPhotosForRecord,
  markRecordFailed,
  markRecordSynced,
  openDatabase,
} from '@/db';

type SyncState = 'idle' | 'syncing' | 'done' | 'error';

export default function SyncScreen() {
  const router = useRouter();
  const [state, setState] = useState<SyncState>('idle');
  const [pending, setPending] = useState(0);
  const [synced, setSynced] = useState(0);
  const [failed, setFailed] = useState(0);
  const [message, setMessage] = useState('');
  const [needsAuth, setNeedsAuth] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const db = await openDatabase();
      const rows = await getPendingRecords(db);
      if (!cancelled) setPending(rows.length);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const runSync = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setState('error');
      setMessage('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to mobile/.env');
      return;
    }

    const db = await openDatabase();
    const rows = await getPendingRecords(db);
    if (rows.length === 0) {
      setState('done');
      setMessage('Nothing to sync. Captures made offline appear here as pending.');
      return;
    }

    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      setState('error');
      setNeedsAuth(true);
      setMessage('Sign in on the Profile tab to unlock syncing.');
      return;
    }

    setState('syncing');
    setSynced(0);
    setFailed(0);

    for (const row of rows) {
      try {
        const { data: inserted, error } = await supabase
          .from('plant_records')
          .insert({
            botanist_id: session.session.user.id,
            species_id: row.species_id,
            qr_code: row.qr_code,
            gps_lat: row.gps_lat,
            gps_lng: row.gps_lng,
            gps_accuracy_m: row.gps_accuracy_m,
            height_cm: row.height_cm,
            morphology: row.morphology,
            notes: row.notes,
            status: 'submitted',
            approval_status: 'pending',
            device_id: row.record_id,
          })
          .select('record_id')
          .single();

        if (error) throw error;

        await markRecordSynced(db, row.record_id, inserted.record_id);

        const photos = await getPhotosForRecord(db, row.record_id);
        for (const photo of photos) {
          await supabase.from('plant_record_photos').insert({
            record_id: inserted.record_id,
            photo_url: photo.local_uri,
          });
        }

        setSynced((n) => n + 1);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown sync error';
        await markRecordFailed(db, row.record_id, msg);
        setFailed((n) => n + 1);
      }
    }

    const remaining = await getPendingRecords(db);
    setPending(remaining.length);
    setState(failed > 0 ? 'error' : 'done');
    setMessage(failed > 0
      ? `Synced ${synced}, ${failed} failed. Tap a failed record in Records for the reason.`
      : `All done — ${synced} record(s) pushed to the central database as submitted.`);
  }, [synced, failed]);

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
});