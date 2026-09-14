import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, ThemeMode, UnitPreference } from '../types';

interface UserState extends UserProfile {
  themeMode: ThemeMode;
  completeOnboarding: (data: {
    name: string;
    dailyGoal: number;
    unit: UnitPreference;
    startTime: string;
    endTime: string;
  }) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  setThemeMode: (mode: ThemeMode) => void;
  resetUser: () => void;
}

const DEFAULT_USER: UserProfile = {
  name: 'Kaviraj',
  dailyGoal: 2500,
  unit: 'ml',
  startTime: '08:00 AM',
  endTime: '10:00 PM',
  onboardingCompleted: false,
  currentStreak: 3,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...DEFAULT_USER,
      themeMode: 'system',

      completeOnboarding: (data) =>
        set((state) => ({
          ...state,
          ...data,
          onboardingCompleted: true,
        })),

      updateProfile: (data) =>
        set((state) => ({
          ...state,
          ...data,
        })),

      setThemeMode: (mode) =>
        set({
          themeMode: mode,
        }),

      resetUser: () =>
        set({
          ...DEFAULT_USER,
          themeMode: 'system',
        }),
    }),
    {
      name: 'hydro-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
