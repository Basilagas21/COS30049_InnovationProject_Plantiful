import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type SyncState = 'idle' | 'checking' | 'connected' | 'error';

export default function SyncScreen() {
  const [state, setState] = useState<SyncState>('idle');
  const [remoteCount, setRemoteCount] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const runCheck = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setState('error');
      setMessage('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to mobile/.env');
      return;
    }

    setState('checking');
    const { count, error } = await supabase
      .from('plant_records')
      .select('*', { count: 'exact', head: true });

    if (error) {
      setState('error');
      setMessage(`Connection failed: ${error.message}`);
      return;
    }

    setState('connected');
    setRemoteCount(count ?? 0);
    setMessage(`Connected to Supabase. ${count ?? 0} record(s) in the central database.`);
  }, []);

  const connected = state === 'connected';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons
          name={connected ? 'cloud-done-outline' : 'cloud-upload-outline'}
          size={40}
          color={connected ? colors.emerald : colors.pine}
        />
        <Text style={styles.title}>Sync centre</Text>
        <Text style={styles.hint}>
          {state === 'idle' && 'Connectivity check against your Supabase project.'}
          {state === 'checking' && 'Testing connection…'}
          {connected && 'Connected. Offline records will upload here from the field app.'}
          {state === 'error' && message}
        </Text>

        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{remoteCount ?? '–'}</Text>
            <Text style={styles.statLabel}>Remote records</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{connected ? 'Live' : '–'}</Text>
            <Text style={styles.statLabel}>Database</Text>
          </View>
        </View>

        <Pressable style={styles.primaryButton} onPress={runCheck} disabled={state === 'checking'}>
          <Text style={styles.primaryButtonText}>
            {state === 'checking' ? 'Checking…' : 'Check connection'}
          </Text>
        </Pressable>
        <Text style={styles.lastSync}>
          {connected ? 'Backed by Supabase (central database)' : 'Last check: never'}
        </Text>
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
  lastSync: {
    fontSize: 12,
    color: colors.muted,
  },
});