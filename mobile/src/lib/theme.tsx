import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import {
  createSurfaces,
  darkColors,
  lightColors,
  type ThemeColors,
  type ThemeSurfaces,
} from '@/theme';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ColorScheme = 'light' | 'dark';

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  scheme: ColorScheme;
  colors: ThemeColors;
  surfaces: ThemeSurfaces;
};

const STORAGE_KEY = 'plantiful.theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function isPreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (isPreference(stored)) {
          setPreferenceState((current) => (current === 'system' ? stored : current));
        }
      })
      .catch(() => {
        // A missing preference simply keeps the system default.
      });
  }, []);

  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  const colors = scheme === 'dark' ? darkColors : lightColors;
  const surfaces = useMemo(() => createSurfaces(colors), [colors]);

  const value = useMemo(
    () => ({
      preference,
      setPreference: (next: ThemePreference) => {
        setPreferenceState(next);
        AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
          // The selected theme still applies for this session.
        });
      },
      scheme,
      colors,
      surfaces,
    }),
    [preference, scheme, colors, surfaces],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within ThemeProvider');
  return value;
}

export function useThemeStyles<T>(
  factory: (colors: ThemeColors, surfaces: ThemeSurfaces) => T,
) {
  const { colors, surfaces } = useTheme();
  const styles = useMemo(() => factory(colors, surfaces), [factory, colors, surfaces]);
  return { colors, surfaces, styles };
}
