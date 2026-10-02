import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type CameraCapturedPicture } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '@/theme';
import { openDatabase, insertLocalRecord, addLocalPhoto, getSpeciesOptions, type SpeciesOption } from '@/db';
import { getCurrentPosition, persistCapturedPhoto, type LocationFix } from '@/lib/location';

export default function NewCaptureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ qr?: string }>();
  const qr = typeof params.qr === 'string' ? params.qr : undefined;

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [stage, setStage] = useState<'form' | 'camera'>('form');
  const [qrCode, setQrCode] = useState(qr ?? '');
  const [speciesOptions, setSpeciesOptions] = useState<SpeciesOption[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesOption | null>(null);
  const [morphology, setMorphology] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState<LocationFix | null>(null);
  const [locating, setLocating] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const db = await openDatabase();
        const options = await getSpeciesOptions(db);
        if (active) setSpeciesOptions(options);
      } catch {
        if (active) setSpeciesOptions([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

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

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current) return;
    setCapturing(true);
    try {
      const pic: CameraCapturedPicture = await cameraRef.current.takePictureAsync({
        quality: 0.6,
      });
      const permanentUri = await persistCapturedPhoto(pic.uri);
      setPhotoUri(permanentUri);
      setStage('form');
    } catch {
      Alert.alert('Photo failed', 'Could not capture the photo. Please try again.');
    } finally {
      setCapturing(false);
    }
  }, []);

  const saveDraft = useCallback(async () => {
    const db = await openDatabase();
    const height = heightCm.trim();
    setSaving(true);
    try {
      const recordId = await insertLocalRecord(db, {
        qr_code: qrCode.trim() || null,
        species_id: selectedSpecies?.species_id ?? null,
        gps_lat: location?.lat ?? null,
        gps_lng: location?.lng ?? null,
        gps_accuracy_m: location?.accuracyM ?? null,
        height_cm: height ? Number(height) : null,
        morphology: morphology.trim() || null,
        notes: notes.trim() || null,
      });
      if (photoUri) {
        await addLocalPhoto(db, recordId, photoUri);
      }
      Alert.alert('Saved offline', 'Record stored on this device. It will sync when you press Sync now.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Save failed', 'Could not save the record locally.');
    } finally {
      setSaving(false);
    }
  }, [qrCode, selectedSpecies, morphology, heightCm, notes, location, photoUri, router]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.hint}>Loading camera permission…</Text>
      </View>
    );
  }

  if (stage === 'camera') {
    return (
      <View style={styles.cameraWrap}>
        {permission.granted ? (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            active
          />
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
          <>
            <View style={styles.cameraHud}>
              <Pressable style={styles.hudGhost} onPress={() => setStage('form')}>
                <Ionicons name="close" size={28} color={colors.white} />
              </Pressable>
              <Pressable
                style={styles.shutter}
                onPress={takePhoto}
                disabled={capturing}
              >
                <View style={[styles.shutterInner, capturing && styles.shutterBusy]} />
              </Pressable>
              <View style={styles.hudSpacer} />
            </View>
          </>
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
          <Text style={styles.sectionLabel}>TAG</Text>
          <TextInput
            style={styles.input}
            placeholder="QR code"
            value={qrCode}
            onChangeText={setQrCode}
            autoCapitalize="characters"
            autoCorrect={false}
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
            <Text style={styles.hint}>No GPS fix yet. Tap below to record this spot.</Text>
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
          <Text style={styles.sectionLabel}>PHOTO</Text>
          {photoUri ? (
            <Pressable style={styles.photoPreviewBtn} onPress={() => setStage('camera')}>
              <Ionicons name="image" size={18} color={colors.pine} />
              <Text style={styles.ghostButtonText}>Photo attached — replace</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.ghostButton} onPress={() => setStage('camera')}>
              <Ionicons name="camera-outline" size={18} color={colors.pine} />
              <Text style={styles.ghostButtonText}>Take photo</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          style={[styles.primaryButton, saving && styles.buttonBusy]}
          onPress={saveDraft}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Save offline record'}</Text>
        </Pressable>
        <Text style={styles.offlineNote}>
          Saved as a draft on this device and synced to the central database when you press Sync now.
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
  photoPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.chartreuse,
    borderRadius: 20,
    paddingVertical: 12,
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