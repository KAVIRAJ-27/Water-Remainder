import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, ThemeMode, UnitPreference } from '../types';
import {
  getUserSettingsFromDb,
  saveUserSettingsToDb,
  resetUserSettingsInDb,
} from '../database/userRepo';

interface UserState extends UserProfile {
  themeMode: ThemeMode;
  isLoaded: boolean;
  loadUserSettings: () => Promise<void>;
  completeOnboarding: (data: {
    name: string;
    dailyGoal: number;
    unit: UnitPreference;
    startTime: string;
    endTime: string;
    defaultAmountMl?: number;
  }) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  resetUser: () => Promise<void>;
}

const DEFAULT_USER: UserProfile = {
  name: 'Kaviraj',
  dailyGoal: 2500,
  unit: 'ml',
  defaultAmountMl: 250,
  startTime: '08:00 AM',
  endTime: '10:00 PM',
  onboardingCompleted: false,
  currentStreak: 0,
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_USER,
      themeMode: 'system',
      isLoaded: false,

      loadUserSettings: async () => {
        try {
          const dbSettings = await getUserSettingsFromDb();
          if (dbSettings) {
            set((state) => ({
              ...state,
              name: dbSettings.name || state.name,
              dailyGoal: dbSettings.dailyGoal || state.dailyGoal,
              unit: dbSettings.unit || state.unit,
              defaultAmountMl: dbSettings.defaultAmountMl || state.defaultAmountMl,
              themeMode: dbSettings.themeMode || state.themeMode,
              onboardingCompleted: dbSettings.onboardingCompleted ?? state.onboardingCompleted,
              isLoaded: true,
            }));
          } else {
            // Save initial defaults to SQLite
            const current = get();
            await saveUserSettingsToDb({
              name: current.name,
              dailyGoal: current.dailyGoal,
              unit: current.unit,
              defaultAmountMl: current.defaultAmountMl,
              themeMode: current.themeMode,
              onboardingCompleted: current.onboardingCompleted,
            });
            set({ isLoaded: true });
          }
        } catch (err) {
          console.error('[UserStore] Error loading user settings from SQLite:', err);
          set({ isLoaded: true });
        }
      },

      completeOnboarding: async (data) => {
        const updated = {
          name: data.name,
          dailyGoal: data.dailyGoal,
          unit: data.unit,
          startTime: data.startTime,
          endTime: data.endTime,
          defaultAmountMl: data.defaultAmountMl ?? get().defaultAmountMl ?? 250,
          onboardingCompleted: true,
        };

        set((state) => ({
          ...state,
          ...updated,
        }));

        await saveUserSettingsToDb({
          name: updated.name,
          dailyGoal: updated.dailyGoal,
          unit: updated.unit,
          defaultAmountMl: updated.defaultAmountMl,
          themeMode: get().themeMode,
          onboardingCompleted: true,
        });
      },

      updateProfile: async (data) => {
        set((state) => ({
          ...state,
          ...data,
        }));

        const current = get();
        await saveUserSettingsToDb({
          name: current.name,
          dailyGoal: current.dailyGoal,
          unit: current.unit,
          defaultAmountMl: current.defaultAmountMl,
          themeMode: current.themeMode,
          onboardingCompleted: current.onboardingCompleted,
        });
      },

      setThemeMode: async (mode) => {
        set({ themeMode: mode });
        await saveUserSettingsToDb({ themeMode: mode });
      },

      resetUser: async () => {
        await resetUserSettingsInDb();
        try {
          await AsyncStorage.removeItem('hydro-user-storage');
        } catch {
          // ignore
        }
        set({
          ...DEFAULT_USER,
          themeMode: 'system',
          isLoaded: true,
        });
      },
    }),
    {
      name: 'hydro-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
