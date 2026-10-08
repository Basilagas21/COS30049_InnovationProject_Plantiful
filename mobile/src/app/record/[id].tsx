import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Alert, Pressable } from '@/lib/interactionLog';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '@/theme';
import { deleteLocalRecord, getLocalRecord, openDatabase, type LocalRecordWithPhoto } from '@/db';
import { TAG_LABEL } from '@/lib/tags';

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

function approvalLabel(status: string | null) {
  switch (status) {
    case 'approved':
      return { text: 'Approved', bg: colors.emerald, fg: colors.white };
    case 'rejected':
      return { text: 'Rejected', bg: colors.danger, fg: colors.white };
    case 'pending':
      return { text: 'Pending review', bg: colors.chartreuse, fg: colors.pine };
    default:
      return { text: 'Not synced yet', bg: colors.muted, fg: colors.white };
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
  const approval = approvalLabel(rec.approval_status);

  function confirmDelete() {
    Alert.alert(
      'Delete local record?',
      rec.sync_status === 'synced'
        ? `${rec.qr_code ?? rec.provisional_name ?? 'This record'} will be removed from this device only.`
        : `${rec.qr_code ?? rec.provisional_name ?? 'This record'} has not been synced yet. Deleting it loses it permanently.`,
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
            <Text style={styles.title}>{rec.provisional_name ?? 'Unnamed plant'}</Text>
            <View style={styles.pillStack}>
              <View style={[styles.syncPill, { backgroundColor: pill.color }]}>
                <Text style={styles.syncPillText}>{pill.text}</Text>
              </View>
              <View style={[styles.syncPill, { backgroundColor: approval.bg }]}>
                <Text style={[styles.syncPillText, { color: approval.fg }]}>{approval.text}</Text>
              </View>
            </View>
          </View>

          {rec.provisional_name ? (
            <Text style={styles.meta}>Provisional name — awaiting species confirmation</Text>
          ) : null}
        {rec.species_name ? <Text style={styles.meta}>Species: {rec.species_name}</Text> : null}
        <Text style={styles.meta}>Captured {formatTimestamp(rec.capture_ts)}</Text>

        {rec.qr_code ? (
            <View style={styles.qrCard}>
              <View style={styles.tagRow}>
                <Ionicons name="pricetag-outline" size={18} color={colors.pine} />
                <View>
                  <Text style={styles.qrLabel}>{TAG_LABEL}</Text>
                  <Text style={styles.qrCode}>{rec.qr_code}</Text>
                </View>
              </View>
              <QRCode value={rec.qr_code} size={132} color={colors.pine} backgroundColor={colors.white} />
              <Text style={styles.qrHint}>Scan this on the Capture tab to reopen the record.</Text>
            </View>
          ) : (
            <View style={styles.qrCard}>
              <Text style={styles.qrHint}>No plant tag recorded for this plant.</Text>
            </View>
          )}

        <View style={styles.divider} />

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

        <Pressable style={styles.editButton} onPress={() => router.push(`/record/edit/${rec.record_id}`)}>
          <Ionicons name="create-outline" size={18} color={colors.pine} />
          <Text style={styles.editText}>Edit record</Text>
        </Pressable>
        {rec.sync_status === 'synced' ? (
          <Text style={styles.editHint}>
            Editing keeps the record on this device and re-queues it — press Sync now to push the
            correction. An approved record returns to pending for officer re-review.
          </Text>
        ) : null}

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
  pillStack: {
    alignItems: 'flex-end',
    gap: 6,
  },
  syncPill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    alignSelf: 'stretch',
  },
  qrCard: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cream,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  qrLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.muted,
  },
  qrCode: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.pine,
  },
  qrHint: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
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
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.pine,
    marginTop: 4,
  },
  editText: {
    color: colors.pine,
    fontSize: 15,
    fontWeight: '600',
  },
  editHint: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 17,
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