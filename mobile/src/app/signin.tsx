import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Alert, Pressable, TextInput } from '@/lib/interactionLog';
import { useThemeStyles } from '@/lib/theme';
import type { ThemeColors, ThemeSurfaces } from '@/theme';
import { BotanicalBanner } from '@/components/botanical-banner';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function SignInScreen() {
  const { colors, styles } = useThemeStyles(createStyles);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  async function signIn() {
    if (!supabase) return;

    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password.');
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);

    if (error) {
      Alert.alert('Sign in failed', error.message);
      return;
    }

    router.replace('/');
  }

  if (!isSupabaseConfigured) {
    return (
      <View style={styles.container}>
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

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Image
          source={require('../../assets/plantiful_logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Plantiful logo"
        />

        <BotanicalBanner title="Closer to nature." subtitle="Your next discovery starts here. Capture, connect and conserve." />
        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.hint}>
            Authenticate to capture and sync plant observations as a botanist.
          </Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            </View>
            <Pressable style={styles.button} onPress={signIn} disabled={busy}>
              {busy ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Sign in</Text>
              )}
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.backRow} onPress={() => router.replace('/register')}>
          <Ionicons name="person-add-outline" size={20} color={colors.emerald} />
          <Text style={styles.backText}>New here? Create an account</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ThemeColors, surfaces: ThemeSurfaces) => StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  logo: {
    width: 200,
    height: 145,
    alignSelf: 'center',
  },
  card: {
    ...surfaces.card,
    alignItems: 'center',
    gap: 10,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.pine,
  },
  hint: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 19,
  },
  form: {
    alignSelf: 'stretch',
    gap: 10,
    marginTop: 6,
  },
  input: {
    ...surfaces.input,
    minHeight: 52,
    fontSize: 14,
    color: colors.pine,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  button: {
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
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  backText: {
    color: colors.emerald,
    fontSize: 14,
    fontWeight: '600',
  },
});
