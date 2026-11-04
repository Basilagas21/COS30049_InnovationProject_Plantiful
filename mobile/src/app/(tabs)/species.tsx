import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { Pressable, TextInput } from '@/lib/interactionLog';
import { useTheme, useThemeStyles } from '@/lib/theme';
import type { ThemeColors, ThemeSurfaces } from '@/theme';
import { BotanicalBanner } from '@/components/botanical-banner';
import { openDatabase, getSpeciesOptions, type SpeciesOption } from '@/db';

function SpeciesCover({ uri, name }: { uri?: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const { colors } = useTheme();
  return uri && !failed ? (
    <Image source={{ uri }} accessibilityLabel={name} onError={() => setFailed(true)} style={{ width: '100%', aspectRatio: 1.8 }} resizeMode="cover" />
  ) : (
    <View style={{ padding: 18, backgroundColor: colors.sprout, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Ionicons name="leaf-outline" size={24} color={colors.emerald} />
      <Text style={{ color: colors.pine, flex: 1, fontSize: 12 }}>{uri ? 'Reference photo unavailable' : 'Reference photo not added yet'}</Text>
    </View>
  );
}

export default function SpeciesReferenceScreen() {
  const { colors, styles } = useThemeStyles(createStyles);
  const { scheme } = useTheme();
  const router = useRouter();
  const [species, setSpecies] = useState<SpeciesOption[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const db = await openDatabase();
      setSpecies(await getSpeciesOptions(db));
    } catch {
      setError('Could not read the saved catalogue. Pull down to retry.');
    } finally {
      setLoading(false);
    }
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
        <Ionicons name="search-outline" size={16} color={colors.muted} />
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
            <Ionicons name="close-circle-outline" size={16} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        key="species-two-columns"
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        ListHeaderComponent={<View style={{ gap: 12 }}>
          <BotanicalBanner title="The field guide." subtitle="Catalogue text is saved after sync. Photos may need a connection." />
          <Text accessibilityLiveRegion="polite" style={styles.meta}>{error ?? `${filtered.length} species${query ? ' matching your search' : ' in your field guide'}`}</Text>
        </View>}
        data={filtered}
        keyExtractor={(item) => item.species_id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        refreshing={loading}
        onRefresh={refresh}
        indicatorStyle={scheme === 'dark' ? 'white' : 'black'}
        ListEmptyComponent={
          loading ? <ActivityIndicator color={colors.emerald} style={{ marginTop: 24 }} /> : error ? <View style={styles.empty}>
            <Pressable onPress={refresh} style={styles.syncButton} accessibilityRole="button"><Text style={styles.syncButtonText}>Retry catalogue</Text></Pressable>
          </View> : <View style={styles.empty}>
            <Ionicons name="book-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyTitle}>
              {species.length === 0 ? 'No species reference yet' : 'No matches'}
            </Text>
            <Text style={styles.emptyHint}>
              {species.length === 0
                ? 'Run a Sync to download the latest plant species catalogue onto this device. You can browse the full list afterwards, or filter it by name.'
                : 'Try a different scientific or common name.'}
            </Text>
            {species.length === 0 && (
              <Pressable style={styles.syncButton} onPress={() => router.navigate('/sync')}>
                <Ionicons name="cloud-upload-outline" size={18} color={colors.onChartreuse} />
                <Text style={styles.syncButtonText}>Go to Sync</Text>
              </Pressable>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            accessibilityRole="button"
            accessibilityLabel={`${item.scientific_name}${item.common_name ? `, ${item.common_name}` : ''}. View species details`}
            onPress={() => router.push({ pathname: '/species/[id]', params: { id: item.species_id } })}
          >
            <SpeciesCover key={item.cover_photo ?? item.species_id} uri={item.cover_photo} name={item.scientific_name} />
            <View style={{ padding: 12, gap: 8 }}>
            <View style={styles.cardHeader}>
              <Text style={styles.sciName}>{item.scientific_name}</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.emerald} />
            </View>
            {item.common_name ? <Text style={styles.commonName}>{item.common_name}</Text> : null}
              {item.conservation_status ? (
                <View style={styles.pill}>
                  <Text style={styles.pillText}>Conservation: {item.conservation_status}</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors, surfaces: ThemeSurfaces) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.sand,
    backgroundColor: colors.white,
    height: 50,
  },
  search: {
    flex: 1,
    fontSize: 14,
    color: colors.pine,
  },
  list: {
    padding: 16,
    paddingTop: 0,
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
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.chartreuse,
  },
  syncButtonText: {
    color: colors.onChartreuse,
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    ...surfaces.card,
    width: '48%',
    padding: 0,
    overflow: 'hidden',
  },
  gridRow: {
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 4,
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
    alignSelf: 'flex-start',
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
