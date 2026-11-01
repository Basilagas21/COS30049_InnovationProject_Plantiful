import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { Alert, Pressable } from '@/lib/interactionLog';
import { useTheme, useThemeStyles, type ThemePreference } from '@/lib/theme';
import type { ThemeColors, ThemeSurfaces } from '@/theme';
import { clearSpeciesCatalog, countUnsyncedRecords, deleteLocalRecord, getLocalRecords, getSpeciesOptions, openDatabase } from '@/db';
import { getCurrentUserId } from '@/lib/currentUser';

const themeOptions: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { preference, setPreference } = useTheme();
  const { colors, styles } = useThemeStyles(createStyles);
  const insets = useSafeAreaInsets();

  async function clearAll() {
    const db = await openDatabase();
    const records = await getLocalRecords(db, (await getCurrentUserId()) ?? undefined);
    for (const record of records) {
      await deleteLocalRecord(db, record.record_id);
    }
    Alert.alert('Cleared', `${records.length} local record(s) removed from this device.`);
  }

  async function clearCatalog() {
    const db = await openDatabase();
    await clearSpeciesCatalog(db);
    Alert.alert('Cleared', 'Species catalogue removed from this device. Press Sync now to download it again.');
  }

  async function confirmClearCatalog() {
    const db = await openDatabase();
    const species = await getSpeciesOptions(db);
    Alert.alert(
      'Clear species catalogue?',
      `${species.length} species entries and their photos will be removed from this device. Your captures and the central database are untouched. Press Sync now afterwards to download the catalogue again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: clearCatalog },
      ],
    );
  }

  async function confirmClear() {
    const db = await openDatabase();
    const unsynced = await countUnsyncedRecords(db, (await getCurrentUserId()) ?? undefined);
    const warning = unsynced > 0
      ? `${unsynced} record(s) have not been synced and will be lost permanently. This cannot be undone.`
      : 'This cannot be undone.';
    Alert.alert('Clear all local records?', warning, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearAll },
    ]);
  }

  return (
    <View style={[styles.container, { paddingBottom: 16 + insets.bottom }]}>
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
        <Pressable style={styles.ghostButton} onPress={confirmClearCatalog} accessibilityRole="button">
          <Text style={styles.ghostButtonText}>Clear species catalogue</Text>
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
    fontSize: 14,
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
    ...surfaces.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    alignSelf: 'stretch',
    backgroundColor: colors.sand,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ghostButtonText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
});
