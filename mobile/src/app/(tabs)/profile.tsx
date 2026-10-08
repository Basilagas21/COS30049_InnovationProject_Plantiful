import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { Alert, Pressable } from '@/lib/interactionLog';
import { colors } from '@/theme';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { countUnsyncedRecords, openDatabase } from '@/db';

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(supabase ? true : false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  async function confirmSignOut() {
    const db = await openDatabase();
    const unsynced = await countUnsyncedRecords(db);
    const message = unsynced > 0
      ? `${unsynced} record(s) on this device are not synced yet. Sync them first: whoever signs in next would upload them under their account.`
      : 'You will need to sign in again to sync records.';
    Alert.alert('Sign out?', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }

  if (!isSupabaseConfigured) {
    return (
      <View style={styles.container}>
        <Image
          source={require('../../../assets/plantiful_logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Plantiful logo"
        />
        <View style={styles.card}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.muted} />
          <Text style={styles.title}>No connection configured</Text>
          <Text style={styles.hint}>
            Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to mobile/.env to enable account features.
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.emerald} />
      </View>
    );
  }

  if (!userEmail) {
    return (
      <View style={styles.container}>
        <Image
          source={require('../../../assets/plantiful_logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Plantiful logo"
        />
        <View style={styles.card}>
          <Ionicons name="person-circle-outline" size={40} color={colors.emerald} />
          <Text style={styles.title}>Sign in to sync</Text>
          <Text style={styles.hint}>
            Authenticate to push offline captures to the central database as a botanist.
          </Text>
          <Pressable style={styles.button} onPress={() => router.replace('/signin')}>
            <Text style={styles.buttonText}>Sign in</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/plantiful_logo.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Plantiful logo"
      />

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={28} color={colors.white} />
        </View>
        <Text style={styles.title}>Signed in</Text>
        <Text style={styles.email}>{userEmail}</Text>
        <Pressable style={[styles.button, styles.ghost]} onPress={confirmSignOut}>
          <Text style={styles.ghostText}>Sign out</Text>
        </Pressable>
      </View>

      <Pressable style={styles.row} onPress={() => router.push('/settings')}>
        <Ionicons name="settings-outline" size={22} color={colors.pine} />
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>Settings</Text>
          <Text style={styles.rowHint}>Offline capture, clears local records</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.hint}>
          Records you sync are stamped with your botanist account so officers can verify them.
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
    gap: 12,
  },
  logo: {
    width: 140,
    height: 101,
    alignSelf: 'center',
    marginTop: 8,
  },
  card: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.sprout,
    borderRadius: 20,
    padding: 24,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.pine,
  },
  email: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.emerald,
  },
  hint: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 19,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.sand,
    padding: 16,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.pine,
  },
  rowHint: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  button: {
    alignSelf: 'stretch',
    backgroundColor: colors.emerald,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  ghost: {
    backgroundColor: colors.sand,
  },
  ghostText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
});