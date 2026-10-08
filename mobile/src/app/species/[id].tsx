import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';
import {
  getSpeciesById,
  getSpeciesPhotos,
  openDatabase,
  type SpeciesLocalPhoto,
  type SpeciesOption,
} from '@/db';

export default function SpeciesDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [species, setSpecies] = useState<SpeciesOption | null | undefined>(undefined);
  const [photos, setPhotos] = useState<SpeciesLocalPhoto[]>([]);

  const refresh = useCallback(async () => {
    if (!id) return;
    const db = await openDatabase();
    setSpecies(await getSpeciesById(db, id));
    setPhotos(await getSpeciesPhotos(db, id));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  if (species === undefined) return <View style={styles.center} />;

  if (species === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Species not found</Text>
        <Text style={styles.hint}>Run a Sync to download the latest species catalogue.</Text>
      </View>
    );
  }

  const s = species;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {photos.length > 0 ? (
        <Image source={{ uri: photos[0].photo_url }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Ionicons name="leaf-outline" size={56} color={colors.sand} />
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.sciName}>{s.scientific_name}</Text>
          {s.conservation_status ? (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{s.conservation_status}</Text>
            </View>
          ) : null}
        </View>
        {s.common_name ? <Text style={styles.commonName}>{s.common_name}</Text> : null}
        <Text style={styles.meta}>Identification reference from the species catalogue</Text>

        {s.taxonomy ? (
          <Field icon="git-branch-outline" label="Taxonomy" value={s.taxonomy} />
        ) : null}

        <View style={styles.divider} />

        {s.description ? (
          <Field icon="document-text-outline" label="Description" value={s.description} last />
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.galleryTitle}>Photos</Text>
        {photos.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.gallery}
          >
            {photos.map((photo) => (
              <SpeciesPhoto key={photo.photo_id} uri={photo.photo_url} />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noPhotos}>
            <Ionicons name="images-outline" size={32} color={colors.sand} />
            <Text style={styles.noPhotosText}>
              No photos recorded for this species yet — they appear after the next sync.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function SpeciesPhoto({ uri }: { uri: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <View style={[styles.thumb, styles.thumbPlaceholder]}>
        <Ionicons name="image-outline" size={28} color={colors.sand} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={styles.thumb}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

function Field({
  icon,
  label,
  value,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.field, !last && styles.fieldBorder]}>
      <Ionicons name={icon} size={18} color={colors.emerald} />
      <View style={styles.fieldBody}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  center: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.pine,
  },
  hint: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 20,
    backgroundColor: colors.sand,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.sand,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  sciName: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: colors.pine,
    fontStyle: 'italic',
  },
  commonName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.emerald,
  },
  meta: {
    fontSize: 13,
    color: colors.muted,
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
  divider: {
    height: 1,
    backgroundColor: colors.sand,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  fieldBorder: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.sand,
  },
  fieldBody: {
    flex: 1,
    gap: 2,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.muted,
  },
  fieldValue: {
    fontSize: 14,
    color: colors.pine,
    lineHeight: 20,
  },
  galleryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.pine,
  },
  gallery: {
    gap: 10,
  },
  thumb: {
    width: 120,
    height: 120,
    borderRadius: 14,
    backgroundColor: colors.sand,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotos: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 20,
    backgroundColor: colors.cream,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  noPhotosText: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
});