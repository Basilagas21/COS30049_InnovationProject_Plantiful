import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';

export default function CaptureScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [lastScan, setLastScan] = useState<{ id: string; type: string; data: string } | null>(null);

  function onBarcodeScanned(result: BarcodeScanningResult) {
    if (result.type !== 'qr') return;
    const data = result.data.trim();
    if (!data) return;
    setLastScan({ id: data, type: result.type, data });
  }

  function openRecord(id: string) {
    Alert.alert('Record found', `Opening record for tag ${id}`);
  }

  function createRecord(id: string) {
    Alert.alert('New record', `Creating a new record for tag ${id}`);
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
        <Text style={styles.hint}>Plantiful scans the QR tag on each plant to open its record.</Text>
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
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={onBarcodeScanned}
        active
      />

      <View style={styles.finder} pointerEvents="none">
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
        <Text style={styles.finderLabel}>Point at the plant's QR tag</Text>
      </View>

      <View style={styles.bottomCard}>
        {lastScan ? (
          <>
            <Text style={styles.cardTitle}>Tag detected</Text>
            <Text style={styles.cardMeta}>ID: {lastScan.data}</Text>
            <View style={styles.cardActions}>
              <Pressable style={[styles.ghostButton, { flex: 1 }]} onPress={() => createRecord(lastScan.data)}>
                <Text style={styles.ghostButtonText}>New record</Text>
              </Pressable>
              <Pressable style={[styles.primaryButton, { flex: 1 }]} onPress={() => openRecord(lastScan.data)}>
                <Text style={styles.primaryButtonText}>Open record</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Ionicons name="radio-button-on" size={20} color={colors.chartreuse} />
            <Text style={styles.cardTitle}>Ready to scan</Text>
            <Text style={styles.cardMeta}>A scanned tag will appear here</Text>
          </>
        )}
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