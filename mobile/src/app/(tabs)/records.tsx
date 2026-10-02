import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';
import {
  deleteLocalRecord,
  getLocalRecords,
  openDatabase,
  type LocalRecordWithPhoto,
} from '@/db';

function syncLabel(status: string) {
  switch (status) {
    case 'synced':
      return { text: 'Synced', color: colors.emerald };
    case 'failed':
      return { text: 'Failed', color: colors.danger };
    default:
      return { text: 'Pending', color: colors.pine };
  }
}

export default function RecordsScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<LocalRecordWithPhoto[]>([]);

  const refresh = useCallback(async () => {
    const db = await openDatabase();
    setRecords(await getLocalRecords(db));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function removeRecord(recordId: string, species: string) {
    Alert.alert('Delete local record?', `${species} will be removed from this device only.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const db = await openDatabase();
          await deleteLocalRecord(db, recordId);
          await refresh();
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={records}
        keyExtractor={(item) => item.record_id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="leaf-outline" size={48} color={colors.sand} />
            <Text style={styles.emptyTitle}>No offline records</Text>
            <Text style={styles.emptyHint}>Scan a plant tag and save a capture — it will appear here.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const pill = syncLabel(item.sync_status);
          return (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => router.push({ pathname: '/record/[id]', params: { id: item.record_id } })}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleWrap}>
                  <Text style={styles.cardTitle}>{item.qr_code ?? 'Untagged'}</Text>
                  {item.species_id && <Text style={styles.cardMeta}>species: {item.species_id}</Text>}
                </View>
                <Pressable
                  onPress={() => removeRecord(item.record_id, item.qr_code ?? 'record')}
                  hitSlop={8}
                  accessibilityLabel="Delete record"
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>

              <Text style={styles.cardMeta}>Captured: {item.capture_ts}</Text>
              {item.gps_lat != null && item.gps_lng != null && (
                <Text style={styles.cardMeta}>
                  {item.gps_lat.toFixed(5)}, {item.gps_lng.toFixed(5)}
                </Text>
              )}
              {item.height_cm != null && <Text style={styles.cardMeta}>{item.height_cm} cm</Text>}
              {item.morphology ? <Text style={styles.cardMeta}>{item.morphology}</Text> : null}

              <View style={styles.cardFooter}>
                <View style={[styles.syncPill, { backgroundColor: pill.color }]}>
                  <Text style={styles.syncPillText}>{pill.text}</Text>
                </View>
                {item.sync_error ? (
                  <Text numberOfLines={1} style={styles.syncError}>{item.sync_error}</Text>
                ) : null}
              </View>
            </Pressable>
          );
        }}
      />
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
    justifyContent: 'center',
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
  cardPressed: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitleWrap: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.pine,
    letterSpacing: 0.3,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.muted,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  syncPill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  syncPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
    textTransform: 'uppercase',
  },
  syncError: {
    flex: 1,
    fontSize: 11,
    color: colors.danger,
  },
});