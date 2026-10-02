import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useState } from 'react';
import { colors } from '@/theme';

export default function SettingsScreen() {
  const [offlineMode, setOfflineMode] = useState(true);
  const [autoScan, setAutoScan] = useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Ionicons name="cloud-offline-outline" size={22} color={colors.pine} />
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>Offline-first capture</Text>
          <Text style={styles.rowHint}>Store records on device and sync later</Text>
        </View>
        <Switch
          value={offlineMode}
          onValueChange={setOfflineMode}
          trackColor={{ true: colors.emerald, false: colors.sand }}
        />
      </View>

      <View style={styles.row}>
        <Ionicons name="scan-outline" size={22} color={colors.pine} />
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>Auto-continue after scan</Text>
          <Text style={styles.rowHint}>Ready for the next tag once the record is saved</Text>
        </View>
        <Switch
          value={autoScan}
          onValueChange={setAutoScan}
          trackColor={{ true: colors.emerald, false: colors.sand }}
        />
      </View>

      <View style={styles.aboutBox}>
        <Text style={styles.aboutTitle}>Plantiful</Text>
        <Text style={styles.aboutText}>
          Smart ground-truthing and digital biodiversity system for plant species documentation at Niah
          National Park, Sarawak.
        </Text>
        <Pressable style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>Clear all local records</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.sand,
    padding: 16,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.pine,
  },
  rowHint: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  aboutBox: {
    backgroundColor: colors.sprout,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.pine,
  },
  aboutText: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 19,
  },
  ghostButton: {
    marginTop: 8,
    backgroundColor: colors.sand,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  ghostButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
});