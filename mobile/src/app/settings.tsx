import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Alert, Pressable } from '@/lib/interactionLog';
import { useTheme, useThemeStyles, type ThemePreference } from '@/lib/theme';
import type { ThemeColors, ThemeSurfaces } from '@/theme';
import { countUnsyncedRecords, deleteLocalRecord, getLocalRecords, openDatabase } from '@/db';

const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { preference, setPreference } = useTheme();
  const { colors, styles } = useThemeStyles(createStyles);

  async function clearAll() {
    const db = await openDatabase();
    const records = await getLocalRecords(db);
    for (const record of records) {
      await deleteLocalRecord(db, record.record_id);
    }
    Alert.alert('Cleared', `${records.length} local record(s) removed from this device.`);
  }

  async function confirmClear() {
    const db = await openDatabase();
    const unsynced = await countUnsyncedRecords(db);
    const warning = unsynced > 0
      ? `${unsynced} record(s) have not been synced and will be lost permanently. This cannot be undone.`
      : 'This cannot be undone.';
    Alert.alert('Clear all local records?', warning, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearAll },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.appearanceBox}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <Text style={styles.hint}>
          Choose a light or dark theme, or follow this device.
        </Text>
        <View style={styles.segment}>
          {themeOptions.map((option) => {
            const active = preference === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => setPreference(option.value)}
                style={[styles.segmentButton, active && styles.segmentButtonActive]}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.aboutBox}>
        <Text style={styles.aboutTitle}>Plantiful</Text>
        <Text style={styles.aboutText}>
          Smart ground-truthing and digital biodiversity system for plant species documentation at Niah
          National Park, Sarawak. Captures are stored on this device and pushed when you press Sync now.
        </Text>
        <Pressable style={styles.ghostButton} onPress={confirmClear} accessibilityRole="button">
          <Text style={styles.ghostButtonText}>Clear all local records</Text>
        </Pressable>
      </View>

      <Pressable style={styles.row} onPress={() => router.back()}>
        <Ionicons name="person-circle-outline" size={22} color={colors.pine} />
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>Back to profile</Text>
          <Text style={styles.rowHint}>Return to account</Text>
        </View>
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors, surfaces: ThemeSurfaces) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    padding: 16,
    gap: 12,
  },
  appearanceBox: {
    ...surfaces.card,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.pine,
  },
  hint: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 19,
  },
  segment: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cream,
  },
  segmentButtonActive: {
    borderColor: colors.emerald,
    backgroundColor: colors.emerald,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.pine,
  },
  segmentTextActive: {
    color: colors.white,
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
  aboutBox: {
    ...surfaces.card,
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  aboutTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.pine,
  },
  aboutText: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 19,
  },
  ghostButton: {
    marginTop: 8,
    backgroundColor: colors.sand,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  ghostButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
});
