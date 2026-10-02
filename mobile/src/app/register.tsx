import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '@/theme';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  async function register() {
    if (!supabase) return;

    if (password.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Passwords do not match', 'Confirm your password again.');
      return;
    }

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim() || email.split('@')[0] },
      },
    });
    setBusy(false);

    if (error) {
      Alert.alert('Sign up failed', error.message);
      return;
    }

    if (!data.session) {
      Alert.alert(
        'Account created',
        'Check your inbox for a confirmation email, then sign in on the Profile tab.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
      return;
    }

    Alert.alert('Welcome to Plantiful', 'Your account is ready.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require('../../assets/plantiful_logo.jpg')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Plantiful logo"
        />

        <View style={styles.card}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.hint}>
            New botanists start here. You will need to confirm your email before signing in.
          </Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              autoCorrect={false}
            />
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
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor={colors.muted}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPassword}
            />
            <Pressable style={styles.button} onPress={register} disabled={busy}>
              {busy ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Create account</Text>
              )}
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="log-in-outline" size={20} color={colors.emerald} />
          <Text style={styles.backText}>Already have an account? Sign in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  logo: {
    width: 180,
    height: 130,
    alignSelf: 'center',
    marginTop: 16,
  },
  card: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.sprout,
    borderRadius: 20,
    padding: 24,
  },
  title: {
    fontSize: 18,
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
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.sand,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.pine,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
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