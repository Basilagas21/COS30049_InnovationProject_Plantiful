import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useThemeStyles } from '@/lib/theme';
import { useReducedMotion } from '@/lib/useReducedMotion';
import type { ThemeColors, ThemeSurfaces } from '@/theme';

export type DialogButtonStyle = 'default' | 'cancel' | 'destructive';

export type DialogButton = {
  text: string;
  style?: DialogButtonStyle;
  onPress?: () => void;
};

export type DialogRequest = {
  id: number;
  title: string;
  message?: string;
  buttons: DialogButton[];
  cancelable: boolean;
};

let active: DialogRequest | null = null;
let nextId = 1;
const pending: DialogRequest[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function pump() {
  if (active || pending.length === 0) return;
  active = pending.shift() ?? null;
  notify();
}

function dismiss(button?: DialogButton) {
  if (!active) return;
  active = null;
  notify();
  if (button?.onPress) {
    setTimeout(() => {
      button.onPress?.();
      pump();
    }, 0);
  } else {
    pump();
  }
}

export function showDialog(request: Omit<DialogRequest, 'id'>) {
  pending.push({ ...request, id: nextId });
  nextId += 1;
  pump();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return active;
}

export function DialogHost() {
  const request = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const { colors, styles } = useThemeStyles(createStyles);
  const reducedMotion = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!request) return;
    if (reducedMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    Animated.spring(progress, {
      toValue: 1,
      friction: 9,
      tension: 90,
      useNativeDriver: true,
    }).start();
  }, [progress, reducedMotion, request]);

  if (!request) return null;

  const destructive = request.buttons.some((button) => button.style === 'destructive');
  const primaryIndex = request.buttons.reduce(
    (last, button, index) =>
      button.style !== 'cancel' && button.style !== 'destructive' ? index : last,
    -1,
  );

  const closeFromBackdrop = () => {
    if (!request.cancelable) return;
    dismiss(request.buttons.find((button) => button.style === 'cancel'));
  };

  return (
    <Modal
      transparent
      visible
      animationType={reducedMotion ? 'none' : 'fade'}
      statusBarTranslucent
      onRequestClose={closeFromBackdrop}
    >
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={closeFromBackdrop}
          accessible={false}
          importantForAccessibility="no"
        />
        <Animated.View
          style={[
            styles.card,
            {
              opacity: progress,
              transform: [
                {
                  scale: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.96, 1],
                  }),
                },
              ],
            },
          ]}
          accessibilityViewIsModal
        >
          <View style={styles.header}>
            <View style={[styles.icon, destructive && styles.iconDanger]}>
              <Ionicons
                name={destructive ? 'warning-outline' : 'leaf-outline'}
                size={20}
                color={destructive ? colors.danger : colors.emerald}
              />
            </View>
            <Text style={styles.eyebrow}>PLANTIFUL</Text>
          </View>

          <Text style={styles.title} accessibilityRole="header">
            {request.title}
          </Text>

          {request.message ? (
            <ScrollView
              style={styles.messageScroll}
              contentContainerStyle={styles.messageContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.message}>{request.message}</Text>
            </ScrollView>
          ) : null}

          <View style={styles.actions}>
            {request.buttons.map((button, index) => {
              const variant = button.style ?? 'default';
              const primary = variant === 'default' && index === primaryIndex;
              const soft = variant === 'default' && !primary;
              return (
                <Pressable
                  key={`${button.text}-${index}`}
                  accessibilityRole="button"
                  accessibilityLabel={button.text}
                  onPress={() => dismiss(button)}
                  style={({ pressed }) => [
                    styles.button,
                    primary && styles.buttonPrimary,
                    soft && styles.buttonSoft,
                    variant === 'cancel' && styles.buttonCancel,
                    variant === 'destructive' && styles.buttonDestructive,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      primary && styles.buttonTextPrimary,
                      soft && styles.buttonTextSoft,
                      variant === 'cancel' && styles.buttonTextCancel,
                      variant === 'destructive' && styles.buttonTextDestructive,
                    ]}
                  >
                    {button.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors, surfaces: ThemeSurfaces) =>
  StyleSheet.create({
    root: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: 'rgba(12, 52, 44, 0.55)',
    },
    card: {
      ...surfaces.card,
      width: '100%',
      maxWidth: 380,
      padding: 22,
      gap: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    icon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.sprout,
    },
    iconDanger: {
      backgroundColor: colors.sand,
    },
    eyebrow: {
      color: colors.emerald,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.8,
    },
    title: {
      color: colors.pine,
      fontSize: 21,
      fontWeight: '700',
      letterSpacing: -0.4,
      lineHeight: 27,
    },
    messageScroll: {
      maxHeight: 220,
    },
    messageContent: {
      paddingBottom: 2,
    },
    message: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21,
    },
    actions: {
      gap: 9,
      marginTop: 4,
    },
    button: {
      minHeight: 50,
      borderRadius: 18,
      paddingVertical: 13,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    buttonPrimary: {
      backgroundColor: colors.emerald,
      borderColor: colors.emerald,
    },
    buttonSoft: {
      backgroundColor: colors.sprout,
      borderColor: colors.sprout,
    },
    buttonCancel: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
    },
    buttonDestructive: {
      backgroundColor: colors.danger,
      borderColor: colors.danger,
    },
    buttonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.99 }],
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: 0.1,
      color: colors.pine,
    },
    buttonTextPrimary: {
      color: colors.white,
    },
    buttonTextSoft: {
      color: colors.emerald,
    },
    buttonTextCancel: {
      color: colors.pine,
    },
    buttonTextDestructive: {
      color: colors.white,
    },
  });
