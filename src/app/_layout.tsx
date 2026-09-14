import { useEffect, useSyncExternalStore } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useUserStore } from '../store/userStore';
import { useWaterStore } from '../store/waterStore';
import { useReminderStore } from '../store/reminderStore';
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

  // Hydrate user settings from SQLite on initial load
  useEffect(() => {
    useUserStore.getState().loadUserSettings();
  }, []);

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

  // Handle incoming notification interactions (taps, snooze, drink confirmations)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleNotificationAction = async (response: Notifications.NotificationResponse) => {
      const actionId = response.actionIdentifier;
      const data = response.notification.request.content.data;
      const amountMl = Number(data?.amountMl) || 250;
      const reminderId = data?.reminderId as string | undefined;
      const alarmMode = useReminderStore.getState().alarmMode;

      if (actionId === 'DRINK_WATER' || actionId === 'CONFIRM_DRANK') {
        // Record drinking event into SQLite and update store
        const userGoal = useUserStore.getState().dailyGoal;
        await useWaterStore.getState().addWater(amountMl, userGoal, reminderId);
        if (reminderId) {
          await notificationService.cancelFollowUpForReminder(reminderId);
        }
        await Notifications.dismissNotificationAsync(response.notification.request.identifier).catch(() => {});
        if (onboardingCompleted) {
          router.replace('/(tabs)');
        }
      } else if (actionId === 'NOT_YET') {
        // Explicit user rejection: do not log water, dismiss notification
        await Notifications.dismissNotificationAsync(response.notification.request.identifier).catch(() => {});
      } else if (actionId === 'SNOOZE_15') {
        if (reminderId) {
          await notificationService.cancelFollowUpForReminder(reminderId);
        }
        await notificationService.scheduleSnoozeReminder(15, amountMl, reminderId, alarmMode);
        await Notifications.dismissNotificationAsync(response.notification.request.identifier).catch(() => {});
      } else if (actionId === 'SNOOZE_30') {
        if (reminderId) {
          await notificationService.cancelFollowUpForReminder(reminderId);
        }
        await notificationService.scheduleSnoozeReminder(30, amountMl, reminderId, alarmMode);
        await Notifications.dismissNotificationAsync(response.notification.request.identifier).catch(() => {});
      } else {
        // User tapped the notification banner directly
        if (onboardingCompleted) {
          router.replace('/(tabs)');
        }
      }
    };

    // 1. Process cold-start notification response if opened from notification
    Notifications.getLastNotificationResponseAsync().then((lastResponse) => {
      if (lastResponse) {
        handleNotificationAction(lastResponse);
      }
    });

    // 2. Listen to notification actions while app is running / in background
    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationAction);

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
