import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';

function iconColor(color: ColorValue) {
  return typeof color === 'string' ? color : undefined;
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.chartreuse,
        tabBarInactiveTintColor: colors.onScrimMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarItemStyle: { paddingTop: 2 },
        tabBarStyle: {
          backgroundColor: colors.scrim,
          borderTopWidth: 0,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          paddingTop: 6,
          height: 56 + insets.bottom + 8,
          paddingBottom: insets.bottom + 14,
        },
        // The tab bar container behind the bar defaults to the navigator's
        // card colour, a white (light) or grey (dark) strip beside the
        // gesture pill. Painting it with the scrim keeps the bar seamless
        // over the camera backdrop and any page background.
        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: colors.scrim }} />
        ),
        headerStyle: {
          backgroundColor: colors.cream,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        headerTitleStyle: { color: colors.pine, fontWeight: '700', fontSize: 24 },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Capture',
          tabBarIcon: ({ color, size }) => <Ionicons name="scan-outline" color={iconColor(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: 'Records',
          tabBarIcon: ({ color, size }) => <Ionicons name="leaf-outline" color={iconColor(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="species"
        options={{
          title: 'Species',
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" color={iconColor(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="sync"
        options={{
          title: 'Sync',
          tabBarIcon: ({ color, size }) => <Ionicons name="cloud-upload-outline" color={iconColor(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" color={iconColor(color)} size={size} />,
        }}
      />
    </Tabs>
  );
}
