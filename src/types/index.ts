export type UnitPreference = 'ml' | 'L';

export type ThemeMode = 'system' | 'light' | 'dark';

export type ReminderMode = 'interval' | 'custom';

export interface UserProfile {
  name: string;
  dailyGoal: number; // in ml
  unit: UnitPreference;
  startTime: string; // e.g. "08:00 AM"
  endTime: string; // e.g. "10:00 PM"
  defaultAmountMl: number; // e.g. 250
  onboardingCompleted: boolean;
  currentStreak: number;
}

export interface WaterLog {
  id: string;
  amountMl: number;
  timestamp: number;
  dateKey: string; // YYYY-MM-DD
  reminderId?: string | null;
}

export interface ReminderItem {
  id: string;
  time: string; // e.g. "08:00 AM"
  amountMl: number;
  isEnabled: boolean;
  notificationId?: string | null;
  followUpNotificationId?: string | null;
}

export interface DailyHistoryRecord {
  id: string;
  dayLabel: string; // e.g. "Today", "Yesterday", "Monday"
  dateKey: string; // YYYY-MM-DD
  consumedMl: number;
  goalMl: number;
  percentage: number;
}
