import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { NavLogger } from '@/lib/interactionLog';
import { RoleProvider, useRole } from '@/lib/role';
import { ThemeProvider, useTheme } from '@/lib/theme';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RoleProvider>
        <RootNavigator />
      </RoleProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { loading: roleLoading, canCapture } = useRole();
  const { colors, scheme } = useTheme();
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

  if (loading || roleLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator color={colors.emerald} size="large" />
      </View>
    );
  }

  const authed = !supabase || !!session;

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <NavLogger />
      <Stack screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.cream },
        headerTintColor: colors.pine,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.cream },
      }}>
        <Stack.Protected guard={authed}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="record/[id]" options={{ headerShown: true, title: 'Record details' }} />
          <Stack.Screen name="species/[id]" options={{ headerShown: true, title: 'Species details' }} />
          <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
        </Stack.Protected>

        <Stack.Protected guard={authed && canCapture}>
          <Stack.Screen name="capture/new" options={{ headerShown: true, title: 'New capture' }} />
          <Stack.Screen name="capture/discover" options={{ headerShown: true, title: 'Tag a new plant' }} />
          <Stack.Screen name="record/edit/[id]" options={{ headerShown: true, title: 'Edit record' }} />
        </Stack.Protected>

        <Stack.Protected guard={!authed}>
          <Stack.Screen name="signin" />
          <Stack.Screen name="register" options={{ headerShown: true, title: 'Create account' }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}
