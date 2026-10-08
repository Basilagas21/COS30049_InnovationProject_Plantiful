import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { NavLogger } from '@/lib/interactionLog';
import { colors } from '@/theme';

export default function RootLayout() {
  const [session, setSession] = useState<unknown>(null);
  const [loading, setLoading] = useState(() => Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.emerald} size="large" />
      </View>
    );
  }

  const authed = !supabase || !!session;

  return (
    <>
      <StatusBar style="dark" />
      <NavLogger />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={authed}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="capture/new" options={{ headerShown: true, title: 'New capture' }} />
          <Stack.Screen name="capture/discover" options={{ headerShown: true, title: 'Tag a new plant' }} />
          <Stack.Screen name="record/[id]" options={{ headerShown: true, title: 'Record details' }} />
          <Stack.Screen name="record/edit/[id]" options={{ headerShown: true, title: 'Edit record' }} />
          <Stack.Screen name="species/[id]" options={{ headerShown: true, title: 'Species details' }} />
          <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
        </Stack.Protected>

        <Stack.Protected guard={!authed}>
          <Stack.Screen name="signin" />
          <Stack.Screen name="register" options={{ headerShown: true, title: 'Create account' }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream,
  },
});