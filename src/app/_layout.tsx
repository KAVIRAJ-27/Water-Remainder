import { useEffect, useSyncExternalStore } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useUserStore } from '../store/userStore';
import { useTheme } from '../hooks/useTheme';
import { View } from 'react-native';

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
