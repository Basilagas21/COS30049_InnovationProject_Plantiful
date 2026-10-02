import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';
import { deleteLocalRecord, getLocalRecord, openDatabase, type LocalRecordWithPhoto } from '@/db';

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

export default function RecordDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [record, setRecord] = useState<LocalRecordWithPhoto | null | undefined>(undefined);

  const refresh = useCallback(async () => {
    if (!id) return;
    const db = await openDatabase();
    setRecord(await getLocalRecord(db, id));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  if (record === undefined) return <View style={styles.center} />;

  if (record === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Record not found</Text>
        <Text style={styles.hint}>It may have been deleted from this device.</Text>
      </View>
    );
  }

  const rec = record;
  const pill = syncLabel(rec.sync_status);

  function confirmDelete() {
    Alert.alert(
      'Delete local record?',
      `${rec.qr_code ?? 'This record'} will be removed from this device only.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const db = await openDatabase();
            await deleteLocalRecord(db, rec.record_id);
            router.back();
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {rec.photo_uri ? (
        <Image source={{ uri: rec.photo_uri }} style={styles.photo} resizeMode="cover" />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Ionicons name="leaf-outline" size={56} color={colors.sand} />
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{rec.qr_code ?? 'Untagged'}</Text>
          <View style={[styles.syncPill, { backgroundColor: pill.color }]}>
            <Text style={styles.syncPillText}>{pill.text}</Text>
          </View>
        </View>

        {rec.provisional_name ? (
          <>
            <Text style={styles.provisionalName}>{rec.provisional_name}</Text>
            <Text style={styles.meta}>Provisional name — awaiting species confirmation</Text>
          </>
        ) : null}
        {rec.species_id && <Text style={styles.meta}>species: {rec.species_id}</Text>}

        <View style={styles.divider} />

        <Field icon="time-outline" label="Captured" value={formatTimestamp(rec.capture_ts)} />
        {rec.gps_lat != null && rec.gps_lng != null && (
          <Field
            icon="location-outline"
            label="Location"
            value={`${rec.gps_lat.toFixed(5)}, ${rec.gps_lng.toFixed(5)}`}
          />
        )}
        {rec.gps_accuracy_m != null && (
          <Field icon="navigate-outline" label="Accuracy" value={`±${rec.gps_accuracy_m} m`} />
        )}
        {rec.height_cm != null && (
          <Field icon="resize-outline" label="Height" value={`${rec.height_cm} cm`} />
        )}
        {rec.morphology && <Field icon="leaf-outline" label="Morphology" value={rec.morphology} />}

        <Field icon="document-text-outline" label="Notes" value={rec.notes || '—'} last />

        {rec.sync_error ? <Text style={styles.syncError}>Sync error: {rec.sync_error}</Text> : null}

        <Pressable style={styles.deleteButton} onPress={confirmDelete}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
          <Text style={styles.deleteText}>Delete local record</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
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
    flexShrink: 1,
  },
  hint: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
  },
  meta: {
    fontSize: 13,
    color: colors.muted,
  },
  provisionalName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.pine,
    fontStyle: 'italic',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
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
  syncError: {
    fontSize: 12,
    color: colors.danger,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.danger,
    marginTop: 4,
  },
  deleteText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '600',
  },
});