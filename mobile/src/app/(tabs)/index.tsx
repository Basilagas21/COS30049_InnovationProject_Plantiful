import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/lib/interactionLog';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme';
import { getRecordByTag, openDatabase } from '@/db';
import { normalizeTag, TAG_LABEL } from '@/lib/tags';

export default function CaptureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [lastScan, setLastScan] = useState<{ data: string; recordId: string | null } | null>(null);
  // The scanner fires on every frame while a tag is in view; only handle each tag once.
  const handlingRef = useRef(false);
  const lastHandledRef = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      // Coming back to this tab: allow the same tag to be scanned again.
      lastHandledRef.current = null;
      setLastScan(null);
    }, [])
  );

  async function onBarcodeScanned(result: BarcodeScanningResult) {
    if (result.type !== 'qr') return;
const data = normalizeTag(result.data);
    if (!data || handlingRef.current || lastHandledRef.current === data) return;
    handlingRef.current = true;
    lastHandledRef.current = data;
    try {
      const db = await openDatabase();
      const existing = await getRecordByTag(db, data);
      setLastScan({ data, recordId: existing?.record_id ?? null });
      if (existing) {
        router.push({ pathname: '/record/[id]', params: { id: existing.record_id } });
      }
    } finally {
      handlingRef.current = false;
    }
  }

  function openRecord(recordId: string) {
    router.push({ pathname: '/record/[id]', params: { id: recordId } });
  }

  function createRecord(id: string) {
    router.push(`/capture/new?qr=${encodeURIComponent(id)}`);
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
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onBarcodeScanned}
        active
      />

      <Pressable
        style={[styles.torchButton, { top: insets.top + 16 }]}
        onPress={() => setTorchOn((on) => !on)}
        accessibilityRole="button"
        accessibilityLabel={torchOn ? 'Turn flashlight off' : 'Turn flashlight on'}
      >
        <Ionicons name={torchOn ? 'flashlight' : 'flashlight-outline'} size={24} color={colors.white} />
      </Pressable>

      <View style={styles.finder} pointerEvents="none">
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
              {lastScan.recordId ? 'Tag detected' : 'New tag detected'}
            </Text>
            <Text style={styles.cardMeta}>{TAG_LABEL}: {lastScan.data}</Text>
            <View style={styles.cardActions}>
              {lastScan.recordId ? (
                <Pressable
                  style={[styles.primaryButton, { flex: 1 }]}
                  onPress={() => openRecord(lastScan.recordId!)}
                >
                  <Text style={styles.primaryButtonText}>Open record</Text>
                </Pressable>
              ) : (
                <Pressable style={[styles.primaryButton, { flex: 1 }]} onPress={() => createRecord(lastScan.data)}>
                  <Text style={styles.primaryButtonText}>New record</Text>
                </Pressable>
              )}
            </View>
          </>
        ) : (
          <>
            <Ionicons name="radio-button-on" size={20} color={colors.chartreuse} />
            <Text style={styles.cardTitle}>Ready to scan</Text>
            <Text style={styles.cardMeta}>A scanned tag will appear here</Text>
          </>
        )}

        <View style={styles.divider} />

        <Pressable
          style={[styles.ghostButton, styles.discoverButton]}
          onPress={() => router.push('/capture/discover')}
        >
          <Ionicons name="leaf-outline" size={18} color={colors.emerald} />
          <Text style={styles.ghostButtonText}>Tag a new plant (no tag yet?)</Text>
        </Pressable>
      </View>
    </View>
  );
}

const frameSize = 260;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pine,
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
    borderColor: colors.white,
  },
  torchButton: {
    position: 'absolute',
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
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowRadius: 4,
  },
  bottomCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    backgroundColor: 'rgba(255, 253, 238, 0.94)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 28,
    gap: 6,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
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
    backgroundColor: colors.sand,
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
    backgroundColor: colors.sprout,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ghostButtonText: {
    color: colors.pine,
    fontSize: 16,
    fontWeight: '600',
  },
});