import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="otp-login" />
      <Stack.Screen name="calm-wave-home" />
      <Stack.Screen name="micro-checkin" />
      <Stack.Screen name="breathing-tools" />
      <Stack.Screen name="wellness-timeline" />
      <Stack.Screen name="gp-screen" />
    </Stack>
  );
}
