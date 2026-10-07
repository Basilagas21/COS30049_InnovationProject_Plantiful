import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Alert, Pressable } from '@/lib/interactionLog';
import { colors } from '@/theme';
import { countUnsyncedRecords, deleteLocalRecord, getLocalRecords, openDatabase } from '@/db';

export default function SettingsScreen() {
  const router = useRouter();

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    padding: 16,
    gap: 12,
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
    backgroundColor: colors.sprout,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  aboutTitle: {
    fontSize: 18,
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