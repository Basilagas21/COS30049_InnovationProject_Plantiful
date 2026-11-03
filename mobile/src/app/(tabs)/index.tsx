import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import type { SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/lib/interactionLog';
import { useThemeStyles } from '@/lib/theme';
import type { ThemeColors, ThemeSurfaces } from '@/theme';
import { getRecordByTag, importRemoteRecord, logAcceptanceMeasurement, openDatabase } from '@/db';
import { getCurrentUserId } from '@/lib/currentUser';
import { isValidTag, normalizeTag, TAG_LABEL } from '@/lib/tags';
import { ScannerGuide } from '@/components/scanner-guide';
import { lookupRecord, withLookupTimeout, type LookupResult } from '@/lib/qr-lookup';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { useRole } from '@/lib/role';

async function importScannedRemoteRecord(db: SQLiteDatabase, tag: string): Promise<LookupResult> {
  if (!isSupabaseConfigured || !supabase) return { recordId: null, message: 'Online lookup is not configured. This tag is not saved on this device.' };
  try {
    const auth = await withLookupTimeout(supabase.auth.getSession());
    if (!auth || auth.error) return { recordId: null, message: 'Could not check your sign-in session. Reconnect and try again.' };
    const { data: session } = auth;
    if (!session.session) return { recordId: null, message: 'This tag is not saved on this device. Sign in to check the shared records.' };

    const result = await withLookupTimeout(
      supabase
        .from('plant_records')
        .select(
          'record_id, version, species_id, qr_code, provisional_name, gps_lat, gps_lng, gps_accuracy_m, height_cm, dbh_cm, taxonomy, phenology, morphology, notes, approval_status, reviewed_at, created_at'
        )
        .eq('qr_code', tag)
        .limit(1)
        .maybeSingle()
    );
    if (!result || result.error) return { recordId: null, message: 'Could not reach the shared records. You may be offline or the service may be unavailable. Reconnect and retry.' };
    if (!result.data) return { recordId: null, message: 'No accessible record was found for this tag. It may not exist or your account may not have access. This does not mean the plant is new.' };

    // Photos are best-effort: the record still opens if they can't be pulled.
    const photos = await withLookupTimeout(
      supabase
        .from('plant_record_photos')
        .select('photo_url, taken_at')
        .eq('record_id', result.data.record_id)
    );
    return { recordId: await importRemoteRecord(db, result.data, photos?.data ?? [], await getCurrentUserId()), message: 'Record found online.' };
  } catch {
    return { recordId: null, message: 'Lookup could not finish. Check your connection and retry.' };
  }
}

export default function CaptureScreen() {
  const { colors, styles } = useThemeStyles(createStyles);
  const router = useRouter();
  const { canCapture } = useRole();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [lastScan, setLastScan] = useState<({ data: string } & LookupResult) | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const scanGeneration = useRef(0);
  // Android keeps handing the camera to whichever screen asks last; release it
  // while this tab is blurred so a pushed camera screen doesn't leave a black
  // frozen preview behind it.
  const [focused, setFocused] = useState(false);
  // The scanner fires on every frame while a tag is in view; only handle each tag once.
  const handlingRef = useRef(false);
  const lastHandledRef = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      // Coming back to this tab: allow the same tag to be scanned again.
      lastHandledRef.current = null;
      setLastScan(null);
      setFocused(true);
      return () => { scanGeneration.current += 1; setFocused(false); };
    }, [])
  );

  async function onBarcodeScanned(result: BarcodeScanningResult) {
    if (result.type !== 'qr') return;
    const data = normalizeTag(result.data);
    if (!data || handlingRef.current || lastHandledRef.current === data) return;
    if (!isValidTag(data)) {
      lastHandledRef.current = data;
      setLastScan({ data: data.slice(0, 80), recordId: null, message: 'Unsupported QR code. Scan a printed Plantiful plant tag, not a website or another app’s QR code.' });
      return;
    }
    handlingRef.current = true;
    setLookingUp(true);
    const generation = scanGeneration.current;
    lastHandledRef.current = data;
    const startedAt = Date.now();
    try {
      const db = await openDatabase();
      const { recordId, message, outcome } = await lookupRecord(
        async () => (await getRecordByTag(db, data))?.record_id ?? null,
        () => importScannedRemoteRecord(db, data),
      );
      try {
        await logAcceptanceMeasurement(db, 'qr_lookup', outcome, startedAt, null, await getCurrentUserId());
      } catch { /* A measurement failure must not prevent a successful lookup. */ }
      if (generation !== scanGeneration.current) return;
      setLastScan({ data, recordId, message });
      if (recordId) {
        router.push({ pathname: '/record/[id]', params: { id: recordId } });
      }
    } catch (error) {
      try {
        const db = await openDatabase();
        await logAcceptanceMeasurement(db, 'qr_lookup', 'error', startedAt, null, await getCurrentUserId());
      } catch { /* Measurement storage must not mask the scan error. */ }
      console.warn('[scan] lookup failed:', error);
      if (generation === scanGeneration.current) setLastScan({ data, recordId: null, message: 'Could not read the local record. Retry the lookup before creating anything new.' });
    } finally {
      handlingRef.current = false;
      setLookingUp(false);
    }
  }

  function openRecord(recordId: string) {
    router.push({ pathname: '/record/[id]', params: { id: recordId } });
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.hint}>Loading camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={56} color={colors.emerald} />
        <Text style={styles.title}>Camera access needed</Text>
        <Text style={styles.hint}>Plantiful scans the tag on each plant to open its record.</Text>
        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Grant camera access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {focused && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torchOn}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
           onBarcodeScanned={lookingUp || lastScan ? undefined : onBarcodeScanned}
        />
      )}

      <Pressable
        style={styles.torchButton}
        onPress={() => setTorchOn((on) => !on)}
        accessibilityRole="button"
        accessibilityLabel={torchOn ? 'Turn flashlight off' : 'Turn flashlight on'}
      >
        <Ionicons name={torchOn ? 'flashlight' : 'flashlight-outline'} size={24} color={colors.onScrim} />
      </Pressable>

      <View style={styles.finder} pointerEvents="none">
        <ScannerGuide active={focused && !lookingUp && !lastScan} />
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
        <Text style={styles.finderLabel}>Point at the plant&apos;s tag</Text>
      </View>

      <View style={styles.bottomCard}>
        {lastScan ? (
          <>
            <Text style={styles.cardTitle}>
              {lastScan.recordId ? 'Tag detected' : 'Record unavailable'}
            </Text>
            <Text style={styles.cardMeta}>{TAG_LABEL}: {lastScan.data}</Text>
            <Text style={styles.cardMeta} accessibilityLiveRegion="polite">{lastScan.message}</Text>
            <View style={styles.cardActions}>
              {lastScan.recordId ? (
                <Pressable
                  style={[styles.primaryButton, { flex: 1 }]}
                  onPress={() => openRecord(lastScan.recordId!)}
                >
                  <Text style={styles.primaryButtonText}>Open record</Text>
                </Pressable>
              ) : (
                <Pressable disabled={lookingUp} style={[styles.primaryButton, { flex: 1 }]} onPress={() => { lastHandledRef.current = null; setLastScan(null); }}>
                  <Text style={styles.primaryButtonText}>Scan again</Text>
                </Pressable>
              )}
            </View>
          </>
        ) : (
          <>
            <Ionicons name="scan-circle-outline" size={36} color={colors.emerald} />
            <Text style={styles.cardTitle}>{lookingUp ? 'Looking up tag…' : 'Ready to scan'}</Text>
            <Text style={styles.cardMeta} accessibilityLiveRegion="polite">{lookingUp ? 'Checking this device and accessible shared records.' : 'A scanned tag will appear here'}</Text>
          </>
        )}

        <View style={styles.divider} />

        {canCapture ? (
          <Pressable
            style={[styles.ghostButton, styles.discoverButton]}
            onPress={() => router.push('/capture/discover')}
          >
            <Ionicons name="leaf-outline" size={18} color={colors.onChartreuse} />
            <Text style={styles.ghostButtonText}>Tag a new plant (no tag yet?)</Text>
          </Pressable>
        ) : (
          <Text style={styles.cardMeta}>
            Your role is read-only — you can browse records but not create them.
          </Text>
        )}
      </View>
    </View>
  );
}

const frameSize = 260;

const createStyles = (colors: ThemeColors, surfaces: ThemeSurfaces) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.scrim,
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
  finder: {
    position: 'absolute',
    top: '14%',
    left: '50%',
    marginLeft: -frameSize / 2,
    width: frameSize,
    height: frameSize,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 12,
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: colors.chartreuse,
  },
  torchButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(12, 52, 44, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  finderLabel: {
    color: colors.onScrim,
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 4,
  },
  bottomCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    padding: 20,
    paddingBottom: 28,
    gap: 6,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.pine,
  },
  cardMeta: {
    fontSize: 13,
    color: colors.muted,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    width: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
    marginVertical: 14,
  },
  discoverButton: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: colors.emerald,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  ghostButton: {
    backgroundColor: colors.chartreuse,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ghostButtonText: {
    color: colors.onChartreuse,
    fontSize: 16,
    fontWeight: '600',
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 4,
    right: 4,
    height: 2,
    backgroundColor: colors.chartreuse,
    opacity: 0.8,
  },
});
