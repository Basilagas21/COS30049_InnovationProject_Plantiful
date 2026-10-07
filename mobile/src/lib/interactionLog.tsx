import { isValidElement, useEffect, type ReactNode } from 'react';
import {
  Alert as NativeAlert,
  Pressable as NativePressable,
  TextInput as NativeTextInput,
  type AlertButton,
  type AlertOptions,
  type GestureResponderEvent,
  type PressableProps,
  type PressableStateCallbackType,
  type TextInputProps,
} from 'react-native';
import { usePathname } from 'expo-router';

let currentRoute = 'launch';

type Child = ReactNode | ((state: PressableStateCallbackType) => ReactNode);

export function logInteraction(target: string): void {
  const stamp = new Date().toTimeString().slice(0, 8);
  console.log(`[ui] ${stamp} ${currentRoute} ${target}`);
}

function labelFrom(children: Child, fallback: string, accessibilityLabel?: string): string {
  if (accessibilityLabel) return accessibilityLabel;
  const parts: string[] = [];
  const collect = (node: Child): void => {
    if (typeof node === 'string' || typeof node === 'number') {
      parts.push(String(node));
    } else if (typeof node === 'function') {
      // render-prop child: no static text to show
    } else if (Array.isArray(node)) {
      node.forEach((item) => collect(item as Child));
    } else if (isValidElement<{ children?: Child }>(node)) {
      collect(node.props.children);
    }
  };
  collect(children);
  const label = parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, 60);
  return label || fallback;
}

export function Pressable({ children, onPress, accessibilityLabel, ...rest }: PressableProps) {
  const label = labelFrom(children, 'button', accessibilityLabel);
  const handlePress = onPress
    ? (event: GestureResponderEvent) => {
        logInteraction(`press "${label}"`);
        onPress(event);
      }
    : undefined;
  return (
    <NativePressable accessibilityLabel={accessibilityLabel} onPress={handlePress} {...rest}>
      {children}
    </NativePressable>
  );
}

export function TextInput({ onFocus, accessibilityLabel, placeholder, ...rest }: TextInputProps) {
  const label = accessibilityLabel ?? placeholder ?? 'input';
  const handleFocus: TextInputProps['onFocus'] = onFocus
    ? (event) => {
        logInteraction(`focus input "${label}"`);
        onFocus(event);
      }
    : undefined;
  return (
    <NativeTextInput
      accessibilityLabel={accessibilityLabel}
      placeholder={placeholder}
      onFocus={handleFocus}
      {...rest}
    />
  );
}

export const Alert = {
  alert: (title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions): void => {
    logInteraction(`alert "${title}"`);
    const wrapped = buttons?.map((button) => {
      const handler = button.onPress as ((value?: string) => void) | undefined;
      return {
        ...button,
        onPress: handler
          ? (value?: string) => {
              logInteraction(`alert-tap "${title}" -> "${button.text ?? 'OK'}"`);
              handler(value);
            }
          : undefined,
      };
    });
    NativeAlert.alert(title, message, wrapped, options);
  },
};

export function NavLogger(): null {
  const pathname = usePathname();
  useEffect(() => {
    currentRoute = pathname || '/';
    logInteraction(`nav ${currentRoute}`);
  }, [pathname]);
  return null;
}
