import { useEffect, useState } from 'react';
import { Animated, AppState } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useReducedMotion } from '@/lib/useReducedMotion';

export function ScannerGuide({ active }: { active: boolean }) {
  const [motion] = useState(() => new Animated.Value(0));
  const reduced = useReducedMotion();
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    motion.setValue(0);
    if (!active || !foreground || reduced) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(motion, { toValue: 1, duration: 1900, useNativeDriver: true, isInteraction: false }),
      Animated.timing(motion, { toValue: 0, duration: 1900, useNativeDriver: true, isInteraction: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [active, foreground, reduced, motion]);
  return (
    <Animated.View pointerEvents="none" accessible={false} style={{ position: 'absolute', top: 12, left: 4, right: 4,
      opacity: motion.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
      transform: [{ translateY: reduced ? 100 : motion.interpolate({ inputRange: [0, 1], outputRange: [0, 210] }) }] }}>
      <Svg width="100%" height={24}>
        <Defs><LinearGradient id="scan" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#6FD6B0" stopOpacity={0.1} />
          <Stop offset="0.5" stopColor="#E3EF26" />
          <Stop offset="1" stopColor="#6FD6B0" stopOpacity={0.1} />
        </LinearGradient></Defs>
        <Rect width="100%" height={22} rx={11} fill="url(#scan)" opacity={0.18} />
        <Rect y={10} width="100%" height={3} rx={1.5} fill="url(#scan)" />
      </Svg>
    </Animated.View>
  );
}
