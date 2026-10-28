import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useThemeStyles } from '@/lib/theme';
import { lightColors, type ThemeColors, type ThemeSurfaces } from '@/theme';

/** Local vector artwork stays available when field devices are offline. */
export function BotanicalBanner({ title, subtitle }: { title: string; subtitle: string }) {
  const { styles } = useThemeStyles(createStyles);
  return (
    <View style={styles.banner}>
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.art}>
        <Svg width="180" height="210" viewBox="0 0 180 210">
          <Path d="M80 220Q120 110 88 0" stroke={lightColors.sprout} strokeWidth="2" fill="none" />
          <Path d="M100 94C37 92 13 55 20 12C77 13 102 46 100 94Z" fill={lightColors.emerald} />
          <Path d="M100 94C100 32 142 13 178 18C171 63 138 90 100 94Z" fill={lightColors.sprout} />
          <Path d="M99 147C43 151 9 117 3 76C57 70 96 101 99 147Z" fill={lightColors.sprout} />
          <Path d="M99 147C111 95 143 83 180 92C165 132 141 150 99 147Z" fill={lightColors.emerald} />
          <Path d="M84 197C36 204 13 179 4 148C49 137 82 163 84 197Z" fill={lightColors.emerald} />
          <Path d="M84 197C106 151 138 149 167 161C143 190 116 207 84 197Z" fill={lightColors.chartreuse} />
          <Path d="M100 94L20 12M100 94L178 18M99 147L3 76M99 147L180 92M84 197L4 148M84 197L167 161" stroke={lightColors.cream} strokeWidth="1" opacity=".4" />
        </Svg>
      </View>
      <Text style={styles.eyebrow}>PLANTIFUL / FIELD NOTES</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors, surfaces: ThemeSurfaces) => StyleSheet.create({
  banner: { backgroundColor: colors.scrim, borderRadius: 28, padding: 24, overflow: 'hidden', gap: 10 },
  art: { position: 'absolute', right: -30, top: -25, opacity: 0.22, transform: [{ rotate: '15deg' }] },
  eyebrow: { color: colors.chartreuse, fontSize: 10, letterSpacing: 1.8, fontWeight: '700' },
  title: { color: colors.onScrim, fontSize: 30, fontWeight: '700', letterSpacing: -1 },
  subtitle: { color: colors.onScrimMuted, fontSize: 13, lineHeight: 20, maxWidth: '85%' },
});
