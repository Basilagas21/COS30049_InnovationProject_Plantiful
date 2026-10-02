import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';
import {
  deleteTestRecords,
  getTestRecords,
  insertTestRecord,
  openDatabase,
  type TestRecord,
} from '@/db';

export default function RecordsScreen() {
  const [records, setRecords] = useState<TestRecord[]>([]);

  const refresh = useCallback(async () => {
    const db = await openDatabase();
    setRecords(await getTestRecords(db));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function addRecord() {
    const db = await openDatabase();
    await insertTestRecord(db);
    await refresh();
  }

  async function clearRecords() {
    const db = await openDatabase();
    await deleteTestRecords(db);
    await refresh();
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No records yet</Text>
            <Text style={styles.emptyHint}>Capture a plant in the field or add a test record below.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardName}>{item.species_name}</Text>
            <Text style={styles.cardMeta}>ID: {item.id}</Text>
            <Text style={styles.cardMeta}>Captured: {item.capture_ts}</Text>
            <View style={styles.syncPill}>
              <Text style={styles.syncPillText}>{item.sync_status}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={addRecord}>
          <Text style={styles.primaryButtonText}>Add test record</Text>
        </Pressable>
        <Pressable style={styles.ghostButton} onPress={clearRecords}>
          <Text style={styles.ghostButtonText}>Clear</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  empty: {
    alignItems: 'center',
    padding: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.pine,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.sprout,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.pine,
    fontStyle: 'italic',
  },
  cardMeta: {
    fontSize: 12,
    color: colors.muted,
  },
  syncPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.chartreuse,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 6,
  },
  syncPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.pine,
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  primaryButton: {
    flex: 1,
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
  ghostButton: {
    backgroundColor: colors.sand,
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  ghostButtonText: {
    color: colors.pine,
    fontSize: 16,
    fontWeight: '600',
  },
});