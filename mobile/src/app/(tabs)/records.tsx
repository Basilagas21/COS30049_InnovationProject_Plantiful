import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Alert, Pressable, TextInput } from '@/lib/interactionLog';
import { colors } from '@/theme';
import {
  deleteLocalRecord,
  getLocalRecords,
  openDatabase,
  type LocalRecordWithPhoto,
} from '@/db';

type SortKey = 'newest' | 'oldest';
type StatusFilter = 'all' | 'pending' | 'synced' | 'failed';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'synced', label: 'Synced' },
  { key: 'failed', label: 'Failed' },
];

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
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = records.filter((item) => {
      if (statusFilter !== 'all' && item.sync_status !== statusFilter) return false;
      if (!q) return true;
      const haystack = `${item.provisional_name ?? ''} ${item.species_name ?? ''} ${item.qr_code ?? ''}`;
      return haystack.toLowerCase().includes(q);
    });
    list.sort((a, b) =>
      sort === 'newest'
        ? b.capture_ts.localeCompare(a.capture_ts)
        : a.capture_ts.localeCompare(b.capture_ts)
    );
    return list;
  }, [records, search, sort, statusFilter]);

  const refresh = useCallback(async () => {
    const db = await openDatabase();
    setRecords(await getLocalRecords(db));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function removeRecord(recordId: string, label: string, syncStatus: string) {
    const warning = syncStatus === 'synced'
      ? `${label} will be removed from this device only.`
      : `${label} has not been synced yet. Deleting it loses it permanently.`;
    Alert.alert('Delete local record?', warning, [
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
      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name or tag…"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {search ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={16} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => setSort((value) => (value === 'newest' ? 'oldest' : 'newest'))}
          style={styles.sortButton}
          accessibilityLabel={`Sorted ${sort === 'newest' ? 'newest first' : 'oldest first'}`}
        >
          <Ionicons
            name={sort === 'newest' ? 'arrow-down' : 'arrow-up'}
            size={14}
            color={colors.emerald}
          />
          <Text style={styles.sortButtonText}>{sort === 'newest' ? 'Newest' : 'Oldest'}</Text>
        </Pressable>

        <View style={styles.chipRow}>
          {STATUS_FILTERS.map((option) => (
            <Pressable
              key={option.key}
              onPress={() => setStatusFilter(option.key)}
              style={[styles.chip, statusFilter === option.key && styles.chipActive]}
            >
              <Text
                style={[styles.chipText, statusFilter === option.key && styles.chipTextActive]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item.record_id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="leaf-outline" size={48} color={colors.sand} />
            <Text style={styles.emptyTitle}>
              {records.length === 0 ? 'No offline records' : 'No matches'}
            </Text>
            <Text style={styles.emptyHint}>
              {records.length === 0
                ? 'Scan a plant tag and save a capture — it will appear here.'
                : 'Try a different search term or clear the filters above.'}
            </Text>
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
                  <Text style={styles.cardTitle}>
                    {item.provisional_name ?? item.species_name ?? 'Unnamed plant'}
                  </Text>
                  {item.qr_code ? <Text style={styles.cardMeta}>Tag {item.qr_code}</Text> : null}
                  {!item.provisional_name && !item.species_name && item.species_id ? (
                    <Text style={styles.cardMeta}>Species {item.species_id}</Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => removeRecord(item.record_id, item.qr_code ?? 'This record', item.sync_status)}
                  hitSlop={8}
                  accessibilityLabel="Delete record"
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>

              <Text style={styles.cardMeta}>Captured: {new Date(item.capture_ts).toLocaleString()}</Text>
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
  toolbar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    gap: 10,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.sand,
    paddingHorizontal: 14,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.pine,
    paddingVertical: 0,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: colors.sprout,
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 34,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.emerald,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.sand,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    height: 32,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.emerald,
    borderColor: colors.emerald,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipTextActive: {
    color: colors.white,
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