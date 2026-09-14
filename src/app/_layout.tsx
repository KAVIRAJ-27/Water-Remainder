import { useEffect, useSyncExternalStore } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useUserStore } from '../store/userStore';
import { useTheme } from '../hooks/useTheme';
import { View, Platform } from 'react-native';
import { notificationService } from '../services/notificationService';

SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore */
});

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { isDark, colors } = useTheme();
  const onboardingCompleted = useUserStore((state) => state.onboardingCompleted);

  const hasHydrated = useSyncExternalStore(
    (callback) => useUserStore.persist.onFinishHydration(callback),
    () => useUserStore.persist.hasHydrated(),
    () => false
  );

  // Handle routing based on onboarding status
  useEffect(() => {
    if (!hasHydrated) return;

    SplashScreen.hideAsync().catch(() => {
      /* ignore */
    });

    const inOnboarding = segments[0] === 'onboarding';

    if (!onboardingCompleted && !inOnboarding) {
      router.replace('/onboarding');
    } else if (onboardingCompleted && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [hasHydrated, onboardingCompleted, segments, router]);

  // Handle incoming notification interactions (taps and snooze actions)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const actionId = response.actionIdentifier;
      const data = response.notification.request.content.data;
      const amountMl = Number(data?.amountMl) || 250;

      if (actionId === 'SNOOZE_15') {
        notificationService.scheduleSnoozeReminder(15, amountMl);
      } else if (actionId === 'SNOOZE_30') {
        notificationService.scheduleSnoozeReminder(30, amountMl);
      } else {
        // User tapped notification directly: safely bring up Home dashboard
        if (onboardingCompleted) {
          router.replace('/(tabs)');
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [onboardingCompleted, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </View>
  );
}
