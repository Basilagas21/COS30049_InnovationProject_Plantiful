import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Pressable, TextInput } from '@/lib/interactionLog';
import { colors } from '@/theme';
import { openDatabase, getSpeciesOptions, type SpeciesOption } from '@/db';

export default function SpeciesReferenceScreen() {
  const router = useRouter();
  const [species, setSpecies] = useState<SpeciesOption[]>([]);
  const [query, setQuery] = useState('');

  const refresh = useCallback(async () => {
    const db = await openDatabase();
    setSpecies(await getSpeciesOptions(db));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return species;
    return species.filter(
      (s) =>
        s.scientific_name.toLowerCase().includes(q) ||
        (s.common_name ?? '').toLowerCase().includes(q)
    );
  }, [species, query]);

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.muted} />
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by scientific or common name…"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
            <Ionicons name="close-circle-outline" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.species_id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={48} color={colors.sand} />
            <Text style={styles.emptyTitle}>
              {species.length === 0 ? 'No species reference yet' : 'No matches'}
            </Text>
            <Text style={styles.emptyHint}>
              {species.length === 0
                ? 'Run a Sync to download the latest plant species catalogue onto this device.'
                : 'Try a different scientific or common name.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push({ pathname: '/species/[id]', params: { id: item.species_id } })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.sciName}>{item.scientific_name}</Text>
              {item.conservation_status ? (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>{item.conservation_status}</Text>
                </View>
              ) : null}
            </View>
            {item.common_name ? <Text style={styles.commonName}>{item.common_name}</Text> : null}
            {item.taxonomy ? <Text style={styles.meta}>{item.taxonomy}</Text> : null}
            {item.description ? (
              <Text style={styles.description} numberOfLines={4}>
                {item.description}
              </Text>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    marginBottom: 4,
    paddingHorizontal: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.sand,
    backgroundColor: colors.white,
  },
  search: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: colors.pine,
  },
  list: {
    padding: 16,
    paddingTop: 12,
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
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.sand,
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
  sciName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.pine,
    fontStyle: 'italic',
  },
  commonName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.emerald,
  },
  meta: {
    fontSize: 12,
    color: colors.muted,
  },
  description: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
    marginTop: 4,
  },
  pill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: colors.sprout,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.emerald,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});