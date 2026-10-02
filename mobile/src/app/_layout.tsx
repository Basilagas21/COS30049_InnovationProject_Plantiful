import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="capture/new" options={{ headerShown: true, title: 'New capture' }} />
        <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
      </Stack>
    </>
  );
}