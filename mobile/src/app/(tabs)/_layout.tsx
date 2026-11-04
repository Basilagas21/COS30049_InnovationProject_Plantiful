import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import type { ColorValue } from 'react-native';
import { StyleSheet } from 'react-native';
import { useTheme } from '@/lib/theme';
import { CurvedTabBar } from '@/components/curved-tab-bar';
import { Pressable } from '@/lib/interactionLog';

function iconColor(color: ColorValue) {
  return typeof color === 'string' ? color : undefined;
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const router = useRouter();

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
        headerRight: () => (
          <Pressable accessibilityRole="button" accessibilityLabel="Open profile and settings"
            onPress={() => router.push('/profile')}
            style={({ pressed }) => ({ width: 44, height: 44, marginRight: 16, borderRadius: 22,
              alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sprout, opacity: pressed ? 0.7 : 1 })}>
            <Ionicons name="person-circle-outline" size={32} color={colors.emerald} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="records"
        options={{
          title: 'Records',
          tabBarIcon: ({ color, size }) => <Ionicons name="leaf-outline" color={iconColor(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, size }) => <Ionicons name="scan-outline" color={iconColor(color)} size={size} />,
        }}
      />
      <Tabs.Screen
        name="species"
        options={{
          title: 'Species',
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" color={iconColor(color)} size={size} />,
        }}
      />
    </Tabs>
  );
}
