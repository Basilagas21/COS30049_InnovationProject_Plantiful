import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type CameraCapturedPicture } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Alert, Pressable, TextInput } from '@/lib/interactionLog';
import { colors } from '@/theme';
import {
  addLocalPhoto,
  deleteLocalPhoto,
  getLocalRecord,
  getPhotosForRecord,
  getSpeciesOptions,
  isTagInUse,
  openDatabase,
  updateLocalRecord,
  type SpeciesOption,
} from '@/db';
import { getCurrentPosition, persistCapturedPhoto, type LocationFix } from '@/lib/location';
import { generateTag, isValidTag, normalizeTag, TAG_LABEL } from '@/lib/tags';

type PhotoRow = { id: string; local_uri: string };

export default function EditRecordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const recordId = typeof params.id === 'string' ? params.id : undefined;

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<'form' | 'camera'>('form');
  const [alreadyTagged, setAlreadyTagged] = useState<'yes' | 'no'>('yes');
  const [tagCode, setTagCode] = useState('');
  const [provisionalName, setProvisionalName] = useState('');
  const [speciesOptions, setSpeciesOptions] = useState<SpeciesOption[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesOption | null>(null);
  const [morphology, setMorphology] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState<LocationFix | null>(null);
  const [locating, setLocating] = useState(false);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!recordId) {
        setLoading(false);
        return;
      }
      try {
        const db = await openDatabase();
        const [rec, options, photoRows] = await Promise.all([
          getLocalRecord(db, recordId),
          getSpeciesOptions(db),
          getPhotosForRecord(db, recordId),
        ]);
        if (!active) return;
        if (rec) {
          setTagCode(rec.qr_code ?? '');
          setAlreadyTagged(rec.qr_code ? 'yes' : 'no');
          setProvisionalName(rec.provisional_name ?? '');
          setMorphology(rec.morphology ?? '');
          setHeightCm(rec.height_cm != null ? String(rec.height_cm) : '');
          setNotes(rec.notes ?? '');
          if (rec.gps_lat != null && rec.gps_lng != null) {
            setLocation({
              lat: rec.gps_lat,
              lng: rec.gps_lng,
              accuracyM: rec.gps_accuracy_m,
            });
          }
          const match = options.find((option) => option.species_id === rec.species_id);
          setSelectedSpecies(match ?? null);
        }
        setSpeciesOptions(options);
        setPhotos(photoRows.map((p) => ({ id: p.id, local_uri: p.local_uri })));
      } catch {
        if (active) Alert.alert('Load failed', 'Could not open this record for editing.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [recordId]);

  const captureLocation = useCallback(async () => {
    setLocating(true);
    try {
      const fix = await getCurrentPosition();
      if (fix) {
        setLocation(fix);
      } else {
        Alert.alert('Location unavailable', 'Location permission was not granted.');
      }
    } catch {
      Alert.alert('Location unavailable', 'Could not get a GPS fix right now.');
    } finally {
      setLocating(false);
    }
  }, []);

  const attachPhoto = useCallback(async (uri: string) => {
    const db = await openDatabase();
    if (!recordId) return;
    const photoId = await addLocalPhoto(db, recordId, uri);
    setPhotos((prev) => [...prev, { id: photoId, local_uri: uri }]);
  }, [recordId]);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    setCapturing(true);
    try {
      const pic: CameraCapturedPicture = await cameraRef.current.takePictureAsync({ quality: 0.6 });
      const permanentUri = await persistCapturedPhoto(pic.uri);
      await attachPhoto(permanentUri);
      setStage('form');
    } catch {
      Alert.alert('Photo failed', 'Could not capture the photo. Please try again.');
    } finally {
      setCapturing(false);
    }
  }, [attachPhoto]);

  const openLibrary = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      allowsEditing: false,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset?.uri) return;
    try {
      const permanentUri = await persistCapturedPhoto(asset.uri);
      await attachPhoto(permanentUri);
    } catch {
      Alert.alert('Photo failed', 'Could not attach the photo. Please try again.');
    }
  }, [attachPhoto]);

  const choosePhotoSource = useCallback(() => {
    Alert.alert('Add a photo', 'How do you want to attach a photo of this plant?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Choose from gallery', onPress: openLibrary },
      { text: 'Take a photo', onPress: () => setStage('camera') },
    ]);
  }, [openLibrary]);

  const removePhoto = useCallback((photoId: string) => {
    Alert.alert('Remove photo?', 'It will be removed from this record.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const db = await openDatabase();
          await deleteLocalPhoto(db, photoId);
          setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
        },
      },
    ]);
  }, []);

  const save = useCallback(async () => {
    if (!recordId) return;

    let tag: string;
    if (alreadyTagged === 'yes') {
      tag = normalizeTag(tagCode);
      if (!isValidTag(tag)) {
        Alert.alert('Check the tag', 'Enter the code printed on the plant tag, for example PLT-7F3K92.');
        return;
      }
    } else {
      const db = await openDatabase();
      tag = generateTag();
      for (let attempt = 0; attempt < 5 && (await isTagInUse(db, tag, recordId)); attempt += 1) {
        tag = generateTag();
      }
    }

    if (await isTagInUse(await openDatabase(), tag, recordId)) {
      Alert.alert('Tag already used', `${tag} is already recorded on this device. Pick a different tag.`);
      return;
    }

    setSaving(true);
    try {
      const db = await openDatabase();
      const height = heightCm.trim();
      await updateLocalRecord(db, recordId, {
        qr_code: tag,
        species_id: selectedSpecies?.species_id ?? null,
        provisional_name: provisionalName.trim() || null,
        gps_lat: location?.lat ?? null,
        gps_lng: location?.lng ?? null,
        gps_accuracy_m: location?.accuracyM ?? null,
        height_cm: height ? Number(height) : null,
        morphology: morphology.trim() || null,
        notes: notes.trim() || null,
      });
      Alert.alert(
        'Record updated',
        'Saved on this device. Press Sync now to push the correction to the central database.',
        [{ text: 'Done', onPress: () => router.back() }]
      );
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'unknown error';
      console.warn(`[edit] save failed for ${recordId}: ${detail}`);
      Alert.alert('Save failed', detail);
    } finally {
      setSaving(false);
    }
  }, [recordId, alreadyTagged, tagCode, selectedSpecies, provisionalName, location, heightCm, morphology, notes, router]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.hint}>Loading camera permission…</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.hint}>Loading record…</Text>
      </View>
    );
  }

  if (stage === 'camera') {
    return (
      <View style={styles.cameraWrap}>
        {permission.granted ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" active />
        ) : (
          <View style={styles.center}>
            <Ionicons name="camera-outline" size={56} color={colors.emerald} />
            <Text style={styles.title}>Camera access needed</Text>
            <Text style={styles.hint}>Plantiful uses the camera to photograph the plant.</Text>
            <Pressable style={styles.primaryButton} onPress={requestPermission}>
              <Text style={styles.primaryButtonText}>Grant camera access</Text>
            </Pressable>
          </View>
        )}

        {permission.granted && (
          <View style={styles.cameraHud}>
            <Pressable style={styles.hudGhost} onPress={() => setStage('form')}>
              <Ionicons name="close" size={28} color={colors.white} />
            </Pressable>
            <Pressable style={styles.shutter} onPress={takePhoto} disabled={capturing}>
              <View style={[styles.shutterInner, capturing && styles.shutterBusy]} />
            </Pressable>
            <View style={styles.hudSpacer} />
          </View>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{TAG_LABEL.toUpperCase()}</Text>

          <View style={styles.choiceRow}>
            <Pressable
              style={[styles.choice, alreadyTagged === 'yes' && styles.choiceSelected]}
              onPress={() => setAlreadyTagged('yes')}
            >
              <Ionicons
                name="qr-code-outline"
                size={18}
                color={alreadyTagged === 'yes' ? colors.emerald : colors.pine}
              />
              <Text style={[styles.choiceText, alreadyTagged === 'yes' && styles.choiceTextSelected]}>
                Already tagged
              </Text>
            </Pressable>
            <Pressable
              style={[styles.choice, alreadyTagged === 'no' && styles.choiceSelected]}
              onPress={() => setAlreadyTagged('no')}
            >
              <Ionicons
                name="pricetag-outline"
                size={18}
                color={alreadyTagged === 'no' ? colors.emerald : colors.pine}
              />
              <Text style={[styles.choiceText, alreadyTagged === 'no' && styles.choiceTextSelected]}>
                Generate new tag
              </Text>
            </Pressable>
          </View>

          {alreadyTagged === 'yes' ? (
            <TextInput
              style={styles.input}
              placeholder="Tag code printed on the plant tag"
              value={tagCode}
              onChangeText={setTagCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          ) : (
            <Text style={styles.tagHint}>
              A different tag will be generated for this plant when you save, and pushed to the
              central database on the next sync.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>PROVISIONAL NAME</Text>
          <TextInput
            style={styles.input}
            placeholder="Name used before species confirmation"
            value={provisionalName}
            onChangeText={setProvisionalName}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>SPECIES</Text>
          <Pressable style={styles.ghostButton} onPress={() => setPickerOpen(true)}>
            <Ionicons name="leaf-outline" size={18} color={colors.pine} />
            <Text style={[styles.ghostButtonText, selectedSpecies && styles.speciesSelected]}>
              {selectedSpecies
                ? `${selectedSpecies.common_name ?? selectedSpecies.scientific_name} (${selectedSpecies.scientific_name})`
                : speciesOptions.length === 0
                  ? 'No species catalog — sync once while signed in'
                  : 'Select species…'}
            </Text>
          </Pressable>
          {selectedSpecies?.conservation_status && (
            <Text style={styles.locationMeta}>
              Conservation status: {selectedSpecies.conservation_status}
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>LOCATION</Text>
          {location ? (
            <View style={styles.locationRow}>
              <Ionicons name="checkmark-circle" size={20} color={colors.emerald} />
              <Text style={styles.locationText}>
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </Text>
              {location.accuracyM != null && (
                <Text style={styles.locationMeta}>±{Math.round(location.accuracyM)} m</Text>
              )}
            </View>
          ) : (
            <Text style={styles.hint}>No GPS fix recorded. Tap below to capture this spot.</Text>
          )}
          <Pressable style={styles.ghostButton} onPress={captureLocation} disabled={locating}>
            <Ionicons name="locate-outline" size={18} color={colors.pine} />
            <Text style={styles.ghostButtonText}>{locating ? 'Locating…' : location ? 'Update location' : 'Capture GPS'}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>DETAILS</Text>
          <TextInput
            style={styles.input}
            placeholder="Morphology (e.g. leathery leaves, 3 m canopy)"
            value={morphology}
            onChangeText={setMorphology}
          />
          <TextInput
            style={styles.input}
            placeholder="Height (cm)"
            value={heightCm}
            onChangeText={setHeightCm}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="Notes"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>PHOTOS ({photos.length})</Text>
          {photos.map((photo) => (
            <View key={photo.id} style={styles.photoRow}>
              <Image source={{ uri: photo.local_uri }} style={styles.photoThumb} />
              <Pressable style={styles.removePhoto} onPress={() => removePhoto(photo.id)}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <Text style={styles.removePhotoText}>Remove</Text>
              </Pressable>
            </View>
          ))}
          <Pressable style={styles.ghostButton} onPress={choosePhotoSource}>
            <Ionicons name="camera-outline" size={18} color={colors.pine} />
            <Text style={styles.ghostButtonText}>Add photo</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.primaryButton, saving && styles.buttonBusy]}
          onPress={save}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Save changes'}</Text>
        </Pressable>
        <Pressable style={styles.cancelButton} onPress={() => router.back()} disabled={saving}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.offlineNote}>
          Saving keeps the record on this device and re-queues it for sync. Press Sync now to push the
          correction; an already approved record returns to pending for officer re-review.
        </Text>
      </ScrollView>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select species</Text>
              <Pressable onPress={() => setPickerOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalList}>
              {speciesOptions.length === 0 ? (
                <Text style={styles.hint}>
                  The species catalog is empty. Open Sync and press Sync now while signed in to download it.
                </Text>
              ) : (
                speciesOptions.map((species) => (
                  <Pressable
                    key={species.species_id}
                    style={[styles.speciesRow, selectedSpecies?.species_id === species.species_id && styles.speciesRowSelected]}
                    onPress={() => {
                      setSelectedSpecies(species);
                      setPickerOpen(false);
                    }}
                  >
                    <Text style={styles.speciesRowName}>{species.scientific_name}</Text>
                    {species.common_name ? (
                      <Text style={styles.speciesRowCommon}>{species.common_name}</Text>
                    ) : null}
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scroll: {
    padding: 16,
    gap: 12,
  },
  center: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.pine,
  },
  hint: {
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.sprout,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 1.2,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.sand,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.pine,
  },
  tagHint: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 17,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  choice: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.sand,
    paddingVertical: 12,
  },
  choiceSelected: {
    borderColor: colors.emerald,
    backgroundColor: colors.sprout,
  },
  choiceText: {
    color: colors.pine,
    fontSize: 13,
    fontWeight: '700',
  },
  choiceTextSelected: {
    color: colors.emerald,
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.pine,
    flexShrink: 1,
  },
  locationMeta: {
    fontSize: 12,
    color: colors.muted,
  },
  ghostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.sand,
    paddingVertical: 12,
  },
  ghostButtonText: {
    color: colors.pine,
    fontSize: 14,
    fontWeight: '700',
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.sand,
    padding: 8,
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: colors.sand,
  },
  removePhoto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  removePhotoText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.emerald,
    borderRadius: 24,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonBusy: {
    opacity: 0.6,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    color: colors.pine,
    fontSize: 15,
    fontWeight: '600',
  },
  offlineNote: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 17,
    paddingBottom: 8,
  },
  cameraWrap: {
    flex: 1,
    backgroundColor: colors.pine,
  },
  cameraHud: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 28,
    paddingBottom: 40,
  },
  hudGhost: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hudSpacer: {
    width: 48,
  },
  shutter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.white,
  },
  shutterBusy: {
    opacity: 0.4,
  },
  speciesSelected: {
    color: colors.emerald,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.sand,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.pine,
  },
  modalList: {
    padding: 12,
  },
  speciesRow: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.sand,
    padding: 14,
    marginBottom: 8,
    gap: 2,
  },
  speciesRowSelected: {
    borderColor: colors.emerald,
    backgroundColor: colors.sprout,
  },
  speciesRowName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.pine,
    fontStyle: 'italic',
  },
  speciesRowCommon: {
    fontSize: 13,
    color: colors.muted,
  },
});
