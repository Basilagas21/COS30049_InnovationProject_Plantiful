import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type CameraCapturedPicture } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import QRCode from 'react-native-qrcode-svg';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '@/theme';
import { openDatabase, insertLocalRecord, addLocalPhoto, getSpeciesOptions, isTagInUse, type SpeciesOption } from '@/db';
import { getCurrentPosition, persistCapturedPhoto, type LocationFix } from '@/lib/location';
import { parseHeightCm } from '@/lib/validation';
import { generateTag, TAG_LABEL } from '@/lib/tags';

export default function DiscoverPlantScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [stage, setStage] = useState<'form' | 'camera'>('form');
  const [tagId, setTagId] = useState(() => generateTag());
  const [commonName, setCommonName] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [morphology, setMorphology] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState<LocationFix | null>(null);
  const [locating, setLocating] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [speciesOptions, setSpeciesOptions] = useState<SpeciesOption[]>([]);
  const [checkQuery, setCheckQuery] = useState('');
  const [checkOpen, setCheckOpen] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesOption | null>(null);

  const pickSpecies = useCallback((species: SpeciesOption) => {
    setSelectedSpecies(species);
    setCommonName(species.common_name ?? species.scientific_name);
    setScientificName(species.scientific_name);
    setCheckOpen(false);
  }, []);

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

  const matches = useMemo(() => {
    const q = checkQuery.trim().toLowerCase();
    if (!q) return [];
    return speciesOptions
      .filter(
        (species) =>
          species.scientific_name.toLowerCase().includes(q) ||
          (species.common_name ?? '').toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [checkQuery, speciesOptions]);

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
      setPhotoUri(permanentUri);
    } catch {
      Alert.alert('Photo failed', 'Could not attach the photo. Please try again.');
    }
  }, []);

  const choosePhotoSource = useCallback(() => {
    Alert.alert('Add a photo', 'How do you want to attach a photo of this plant?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Choose from gallery', onPress: openLibrary },
      { text: 'Take a photo', onPress: () => setStage('camera') },
    ]);
  }, [openLibrary]);

  const saveDiscovery = useCallback(async () => {
    const name = commonName.trim();
    if (!name) {
      Alert.alert('Name the plant', 'Give the plant a common name before saving.');
      return;
    }

    const height = parseHeightCm(heightCm);
    if (height === undefined) {
      Alert.alert('Check the height', 'Enter the height as a positive number of centimetres, e.g. 120 or 12.5.');
      return;
    }

    const db = await openDatabase();
    let tag = tagId;
    for (let attempt = 0; attempt < 5 && (await isTagInUse(db, tag)); attempt += 1) {
      tag = generateTag();
    }
    if (await isTagInUse(db, tag)) {
      Alert.alert('Could not mint a tag', 'Please try again to generate a different tag.');
      return;
    }

    setSaving(true);
    try {
      const recordId = await insertLocalRecord(db, {
        qr_code: tag,
        // A known species needs no provisional name; officers only confirm new discoveries.
        species_id: selectedSpecies?.species_id ?? null,
        provisional_name: selectedSpecies ? null : name,
        gps_lat: location?.lat ?? null,
        gps_lng: location?.lng ?? null,
        gps_accuracy_m: location?.accuracyM ?? null,
        height_cm: height,
        morphology: morphology.trim() || null,
        notes:
          [
            !selectedSpecies && scientificName.trim() && `Suggested scientific name: ${scientificName.trim()}`,
            notes.trim(),
          ]
            .filter(Boolean)
            .join('\n') || null,
      });
      if (photoUri) {
        await addLocalPhoto(db, recordId, photoUri);
      }
      Alert.alert('New plant tagged', `Tag ${tag} was saved for "${name}". It will sync when you press Sync now.`, [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Save failed', 'Could not save the record locally.');
    } finally {
      setSaving(false);
    }
  }, [tagId, commonName, scientificName, selectedSpecies, morphology, heightCm, notes, location, photoUri, router]);

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
            <Text style={styles.hint}>Plantiful uses the camera to photograph the new plant.</Text>
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
          <Text style={styles.sectionLabel}>KNOWN SPECIES? CHECK FIRST</Text>
          <Text style={styles.hint}>
            Search the species catalogue. If this plant already has a QR tag, scan it on the Capture tab instead.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Search by scientific or common name…"
            value={checkQuery}
            onChangeText={(text) => {
              setCheckQuery(text);
              setCheckOpen(true);
            }}
            onFocus={() => setCheckOpen(true)}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {checkOpen && matches.length > 0 ? (
            <View style={styles.matchList}>
              {matches.map((species) => (
                <Pressable
                  key={species.species_id}
                  style={styles.matchRow}
                  onPress={() => pickSpecies(species)}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${species.scientific_name}`}
                >
                  <View style={styles.matchBody}>
                    <Text style={styles.matchName}>{species.scientific_name}</Text>
                    {species.common_name ? (
                      <Text style={styles.matchCommon}>{species.common_name}</Text>
                    ) : null}
                  </View>
                  <Ionicons
                    name={selectedSpecies?.species_id === species.species_id ? 'checkmark-circle' : 'add-circle-outline'}
                    size={18}
                    color={colors.emerald}
                  />
                </Pressable>
              ))}
              <Text style={styles.matchNote}>
                This species is already in the catalogue. Tap it to tag this individual plant as that species.
              </Text>
            </View>
          ) : checkQuery.trim() && checkOpen ? (
            <View style={styles.matchList}>
              <View style={styles.matchRow}>
                <Text style={styles.matchName}>No match in the catalogue</Text>
              </View>
              <Text style={styles.matchNote}>
                Looks like a new discovery. Name it below and we will issue a fresh tag.
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>NAME THE PLANT</Text>
          {selectedSpecies ? (
            <Pressable
              style={styles.ghostButton}
              onPress={() => setSelectedSpecies(null)}
              accessibilityLabel="Clear selected species"
            >
              <Ionicons name="close-circle-outline" size={18} color={colors.pine} />
              <Text style={styles.ghostButtonText}>Species: {selectedSpecies.scientific_name} (tap to clear)</Text>
            </Pressable>
          ) : null}
          <TextInput
            style={styles.input}
            placeholder="Common name (required)"
            value={commonName}
            onChangeText={setCommonName}
          />
          <TextInput
            style={styles.input}
            placeholder="Suggested scientific name (optional)"
            value={scientificName}
            onChangeText={setScientificName}
          />
          <Text style={styles.hint}>
            {selectedSpecies
              ? 'Recorded as a known species. An officer will review the observation.'
              : 'This is a provisional name. An officer will confirm the species and publish it to the catalogue.'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{TAG_LABEL.toUpperCase()}</Text>
          <View style={styles.qrRow}>
            <View style={styles.qrBox}>
              <QRCode value={tagId} size={132} color={colors.pine} backgroundColor={colors.white} />
            </View>
            <View style={styles.qrInfo}>
              <Text style={styles.tagId}>{tagId}</Text>
              <Text style={styles.hint}>
                Print or screenshot this tag and attach it to the plant. Future scans of it open this plant&apos;s record.
              </Text>
            </View>
          </View>
          <Pressable
            style={styles.ghostButton}
            onPress={() => setTagId(generateTag())}
          >
            <Ionicons name="refresh-outline" size={18} color={colors.pine} />
            <Text style={styles.ghostButtonText}>Generate a different tag</Text>
          </Pressable>
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
            <Pressable style={styles.photoPreviewBtn} onPress={choosePhotoSource}>
              <Ionicons name="image" size={18} color={colors.pine} />
              <Text style={styles.ghostButtonText}>Photo attached — replace</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.ghostButton} onPress={choosePhotoSource}>
              <Ionicons name="camera-outline" size={18} color={colors.pine} />
              <Text style={styles.ghostButtonText}>Add photo</Text>
            </Pressable>
          )}
        </View>

        <Pressable
          style={[styles.primaryButton, saving && styles.buttonBusy]}
          onPress={saveDiscovery}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Save new plant record'}</Text>
        </Pressable>
        <Text style={styles.offlineNote}>
          Saved as a draft on this device and synced to the central database when you press Sync now.
        </Text>
      </ScrollView>
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
  matchList: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.sand,
    padding: 12,
    gap: 6,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  matchBody: {
    flex: 1,
    gap: 2,
  },
  matchName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.pine,
    fontStyle: 'italic',
  },
  matchCommon: {
    fontSize: 12,
    color: colors.muted,
  },
  matchNote: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 16,
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  qrBox: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.sand,
  },
  qrInfo: {
    flex: 1,
    gap: 6,
  },
  tagId: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.emerald,
    letterSpacing: 0.5,
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
});