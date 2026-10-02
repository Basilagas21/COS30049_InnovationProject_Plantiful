import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { colors } from '@/theme';
import { openDatabase, deleteLocalRecord, getLocalRecords } from '@/db';

export default function SettingsScreen() {
  const router = useRouter();
  const [offlineMode, setOfflineMode] = useState(true);
  const [autoScan, setAutoScan] = useState(true);

  async function clearAll() {
    const db = await openDatabase();
    const records = await getLocalRecords(db);
    for (const record of records) {
      await deleteLocalRecord(db, record.record_id);
    }
    Alert.alert('Cleared', `${records.length} local record(s) removed from this device.`);
  }

  function confirmClear() {
    Alert.alert('Clear all local records?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearAll },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Ionicons name="cloud-offline-outline" size={22} color={colors.pine} />
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>Offline-first capture</Text>
          <Text style={styles.rowHint}>Store records on device and sync later</Text>
        </View>
        <Switch
          value={offlineMode}
          onValueChange={setOfflineMode}
          trackColor={{ true: colors.emerald, false: colors.sand }}
        />
      </View>

      <View style={styles.row}>
        <Ionicons name="scan-outline" size={22} color={colors.pine} />
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>Auto-continue after scan</Text>
          <Text style={styles.rowHint}>Ready for the next tag once the record is saved</Text>
        </View>
        <Switch
          value={autoScan}
          onValueChange={setAutoScan}
          trackColor={{ true: colors.emerald, false: colors.sand }}
        />
      </View>

      <Pressable style={styles.aboutBox} onPress={confirmClear}>
        <Text style={styles.aboutTitle}>Plantiful</Text>
        <Text style={styles.aboutText}>
          Smart ground-truthing and digital biodiversity system for plant species documentation at Niah
          National Park, Sarawak.
        </Text>
        <Pressable style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>Clear all local records</Text>
        </Pressable>
      </Pressable>

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