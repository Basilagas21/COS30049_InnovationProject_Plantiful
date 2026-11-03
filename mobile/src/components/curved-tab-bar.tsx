import type { ComponentProps } from 'react';
import type { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Pressable } from '@/lib/interactionLog';
import { useTheme } from '@/lib/theme';
import { useReducedMotion } from '@/lib/useReducedMotion';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];
const AnimatedPath = Animated.createAnimatedComponent(Path);

export function CurvedTabBar({ state, descriptors, emitter, navigateToTab, insets }: TabBarProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [position] = useState(() => new Animated.Value(state.index));
  const cell = width / state.routes.length;
  const height = 88 + Math.max(insets.bottom, 10);
  const radius = Math.min(24, Math.max(18, cell / 2 - 12));
  const halfNotch = Math.min(40, Math.max(24, cell / 2 - 4));
  const notch = (index: number) => {
    const x = cell * (index + 0.5);
    return `M 0 30 Q 0 18 4 18 L ${x - halfNotch} 18 C ${x - halfNotch + 10} 18 ${x - halfNotch + 4} 62 ${x} 62 C ${x + halfNotch - 4} 62 ${x + halfNotch - 10} 18 ${x + halfNotch} 18 L ${width - 4} 18 Q ${width} 18 ${width} 30 L ${width} ${height} L 0 ${height} Z`;
  };
  useEffect(() => {
    const animation = Animated.timing(position, {
      toValue: state.index, duration: reduced ? 0 : 280,
      easing: Easing.inOut(Easing.cubic), useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [state.index, reduced, position]);

  const indices = state.routes.map((_, index) => index);
  return (
    <View style={{ backgroundColor: colors.cream, paddingLeft: insets.left, paddingRight: insets.right }}>
      <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ minHeight: height }}>
        {width > 0 && (
          <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill}>
            <Svg width={width} height={height}>
              <AnimatedPath fill={colors.scrim} d={position.interpolate({ inputRange: indices, outputRange: indices.map(notch), extrapolate: 'clamp' })} />
            </Svg>
            <Animated.View style={{ position: 'absolute', top: 30 - radius, width: radius * 2, height: radius * 2,
              borderRadius: radius, backgroundColor: colors.chartreuse,
              transform: [{ translateX: position.interpolate({ inputRange: indices, outputRange: indices.map(index => cell * (index + 0.5) - radius), extrapolate: 'clamp' }) }] }} />
          </View>
        )}
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const selected = state.index === index;
            const title = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title ?? route.name;
            return (
              <Pressable key={route.key} accessibilityRole="tab" accessibilityLabel={options.tabBarAccessibilityLabel ?? title}
                accessibilityState={{ selected }} style={styles.tab}
                onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
                onPress={() => {
                  const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!selected && !event.defaultPrevented) navigateToTab(route.key);
                }}>
                <Animated.View style={[styles.icon, { transform: [{ translateY: position.interpolate({
                  inputRange: [index - 1, index, index + 1], outputRange: [12, 0, 12], extrapolate: 'clamp',
                }) }] }]}>
                  {options.tabBarIcon?.({ focused: selected, color: selected ? colors.onChartreuse : colors.onScrimMuted, size: 24 })}
                </Animated.View>
                <Text numberOfLines={1} maxFontSizeMultiplier={1.3} style={{ color: selected ? colors.chartreuse : colors.onScrimMuted, fontSize: 11, fontWeight: selected ? '800' : '500' }}>{title}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  tab: { flex: 1, minHeight: 88, alignItems: 'center', gap: 12, paddingTop: 6 },
  icon: { height: 48, justifyContent: 'center', alignItems: 'center' },
});
