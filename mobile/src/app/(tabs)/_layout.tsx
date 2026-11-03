import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';
import { CurvedTabBar } from '@/components/curved-tab-bar';

function iconColor(color: ColorValue) {
  return typeof color === 'string' ? color : undefined;
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <CurvedTabBar {...props} />}
      screenOptions={{
        headerShown: true,
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
