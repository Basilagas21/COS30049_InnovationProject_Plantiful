import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme';

export default function SyncScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons name="cloud-upload-outline" size={40} color={colors.emerald} />
        <Text style={styles.title}>Sync centre</Text>
        <Text style={styles.hint}>Pending uploads will appear here once the offline records are ready to sync.</Text>

        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Synced</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Failed</Text>
          </View>
        </View>

        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Sync now</Text>
        </Pressable>
        <Text style={styles.lastSync}>Last sync: never</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    padding: 16,
  },
  card: {
    backgroundColor: colors.sprout,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 10,
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
  },
  statRow: {
    flexDirection: 'row',
    gap: 24,
    marginVertical: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.emerald,
  },
  statLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  primaryButton: {
    alignSelf: 'stretch',
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
  lastSync: {
    fontSize: 12,
    color: colors.muted,
  },
});