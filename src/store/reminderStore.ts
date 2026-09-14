import { create } from 'zustand';
import { ReminderItem, ReminderMode } from '../types';
import {
  getRemindersFromDb,
  insertReminderToDb,
  updateReminderInDb,
  deleteReminderFromDb,
  toggleReminderInDb,
  replaceAllRemindersInDb,
  getReminderSettingsFromDb,
  saveReminderSettingsToDb,
} from '../database/remindersRepo';
import {
  compareTimes,
  generateIntervalReminders,
  isDuplicateTime,
  parseTimeToMinutes,
  formatTime12Hour,
} from '../utils/timeUtils';
import { notificationService } from '../services/notificationService';

interface ReminderState {
  reminderMode: ReminderMode;
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  defaultAmountMl: number;
  customReminders: ReminderItem[];
  isLoaded: boolean;

  // Notification Preferences
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  snoozeMinutes: number;

  // Actions
  loadReminders: () => Promise<void>;
  setReminderMode: (mode: ReminderMode) => Promise<void>;
  updateIntervalSettings: (settings: {
    startTime?: string;
    endTime?: string;
    intervalMinutes?: number;
    defaultAmountMl?: number;
  }) => Promise<void>;
  generateAndSaveIntervalSchedule: (
    startTime?: string,
    endTime?: string,
    intervalMinutes?: number,
    amountMl?: number
  ) => Promise<{ success: boolean; error?: string; count?: number }>;
  toggleReminder: (id: string) => Promise<void>;
  addCustomReminder: (
    time: string,
    amountMl: number
  ) => Promise<{ success: boolean; error?: string }>;
  updateReminder: (
    reminder: ReminderItem
  ) => Promise<{ success: boolean; error?: string }>;
  deleteCustomReminder: (id: string) => Promise<void>;
  updateNotificationSettings: (settings: {
    notificationsEnabled?: boolean;
    soundEnabled?: boolean;
    vibrationEnabled?: boolean;
    snoozeMinutes?: number;
  }) => Promise<void>;
  snoozeReminder: (minutes?: number, amountMl?: number) => Promise<string | null>;
  getNextReminderTime: () => string;
  resetSchedule: () => Promise<void>;
}

const DEFAULT_INTERVAL_REMINDERS: ReminderItem[] = [
  { id: 'rem-init-1', time: '08:00 AM', amountMl: 250, isEnabled: true },
  { id: 'rem-init-2', time: '09:00 AM', amountMl: 250, isEnabled: true },
  { id: 'rem-init-3', time: '10:00 AM', amountMl: 250, isEnabled: true },
  { id: 'rem-init-4', time: '11:00 AM', amountMl: 250, isEnabled: false },
  { id: 'rem-init-5', time: '01:00 PM', amountMl: 300, isEnabled: true },
  { id: 'rem-init-6', time: '03:30 PM', amountMl: 250, isEnabled: true },
  { id: 'rem-init-7', time: '06:00 PM', amountMl: 300, isEnabled: true },
  { id: 'rem-init-8', time: '08:00 PM', amountMl: 250, isEnabled: true },
];

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminderMode: 'interval',
  startTime: '08:00 AM',
  endTime: '10:00 PM',
  intervalMinutes: 60,
  defaultAmountMl: 250,
  customReminders: DEFAULT_INTERVAL_REMINDERS,
  isLoaded: false,

  notificationsEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  snoozeMinutes: 10,

  loadReminders: async () => {
    try {
      const [dbReminders, dbSettings] = await Promise.all([
        getRemindersFromDb(),
        getReminderSettingsFromDb(),
      ]);

      const mergedReminders =
        dbReminders.length > 0 ? dbReminders.sort((a, b) => compareTimes(a.time, b.time)) : get().customReminders;

      if (dbReminders.length === 0) {
        // Seed default reminders in SQLite
        await replaceAllRemindersInDb(mergedReminders, dbSettings?.mode ?? 'interval');
      }

      const notifEnabled = dbSettings?.enabled ?? get().notificationsEnabled;
      const sndEnabled = dbSettings?.soundEnabled ?? get().soundEnabled;
      const vibEnabled = dbSettings?.vibrationEnabled ?? get().vibrationEnabled;
      const snoozeMins = dbSettings?.snoozeMinutes ?? get().snoozeMinutes;

      set({
        customReminders: mergedReminders,
        reminderMode: dbSettings?.mode ?? get().reminderMode,
        startTime: dbSettings?.startTime ?? get().startTime,
        endTime: dbSettings?.endTime ?? get().endTime,
        intervalMinutes: dbSettings?.intervalMinutes ?? get().intervalMinutes,
        defaultAmountMl: dbSettings?.defaultAmountMl ?? get().defaultAmountMl,
        notificationsEnabled: notifEnabled,
        soundEnabled: sndEnabled,
        vibrationEnabled: vibEnabled,
        snoozeMinutes: snoozeMins,
        isLoaded: true,
      });

      // Initialize notifications channels and reconcile without duplicates
      await notificationService.initializeNotifications(sndEnabled, vibEnabled);
      await notificationService.reconcileNotifications(mergedReminders, notifEnabled);
    } catch (error) {
      console.error('[ReminderStore] Failed to load reminders from SQLite:', error);
      set({ isLoaded: true });
    }
  },

  setReminderMode: async (mode) => {
    set({ reminderMode: mode });
    await saveReminderSettingsToDb({ mode });
  },

  updateIntervalSettings: async (settings) => {
    const updated = {
      startTime: settings.startTime ?? get().startTime,
      endTime: settings.endTime ?? get().endTime,
      intervalMinutes: settings.intervalMinutes ?? get().intervalMinutes,
      defaultAmountMl: settings.defaultAmountMl ?? get().defaultAmountMl,
    };

    set({
      startTime: updated.startTime,
      endTime: updated.endTime,
      intervalMinutes: updated.intervalMinutes,
      defaultAmountMl: updated.defaultAmountMl,
    });

    await saveReminderSettingsToDb(updated);
  },

  generateAndSaveIntervalSchedule: async (
    customStart,
    customEnd,
    customInterval,
    customAmount
  ) => {
    const start = customStart ?? get().startTime;
    const end = customEnd ?? get().endTime;
    const interval = customInterval ?? get().intervalMinutes;
    const amount = customAmount ?? get().defaultAmountMl;

    const res = generateIntervalReminders(start, end, interval, amount);
    if (!res.success || !res.reminders) {
      return { success: false, error: res.error || 'Failed to generate schedule.' };
    }

    const sorted = res.reminders.sort((a, b) => compareTimes(a.time, b.time));

    // Save to SQLite
    await replaceAllRemindersInDb(sorted, 'interval');
    await saveReminderSettingsToDb({
      mode: 'interval',
      startTime: start,
      endTime: end,
      intervalMinutes: interval,
      defaultAmountMl: amount,
    });

    set({
      customReminders: sorted,
      reminderMode: 'interval',
      startTime: start,
      endTime: end,
      intervalMinutes: interval,
      defaultAmountMl: amount,
    });

    // Reschedule notifications if notifications are enabled
    if (get().notificationsEnabled) {
      await notificationService.rescheduleAllReminders(sorted);
    }

    return { success: true, count: sorted.length };
  },

  toggleReminder: async (id) => {
    const current = get().customReminders.find((r) => r.id === id);
    if (!current) return;

    const newStatus = !current.isEnabled;
    const updated = get().customReminders.map((r) =>
      r.id === id ? { ...r, isEnabled: newStatus } : r
    );

    set({ customReminders: updated });

    // SQLite update
    await toggleReminderInDb(id, newStatus);

    // Android notification sync
    if (newStatus && get().notificationsEnabled) {
      const notifId = await notificationService.scheduleReminder(
        { ...current, isEnabled: true },
        { soundEnabled: get().soundEnabled, vibrationEnabled: get().vibrationEnabled }
      );
      if (notifId) {
        set({
          customReminders: get().customReminders.map((r) =>
            r.id === id ? { ...r, notificationId: notifId } : r
          ),
        });
      }
    } else {
      await notificationService.cancelReminder(id, current.notificationId);
      set({
        customReminders: get().customReminders.map((r) =>
          r.id === id ? { ...r, notificationId: null } : r
        ),
      });
    }
  },

  addCustomReminder: async (time, amountMl) => {
    if (!time || !time.trim()) {
      return { success: false, error: 'Please specify a reminder time (e.g. 10:30 AM).' };
    }

    if (!amountMl || amountMl <= 0 || isNaN(amountMl)) {
      return { success: false, error: 'Amount must be greater than 0 ml.' };
    }

    const normalizedTime = formatTime12Hour(time);

    // Duplicate check
    if (isDuplicateTime(get().customReminders, normalizedTime)) {
      return {
        success: false,
        error: `A reminder at ${normalizedTime} already exists in your schedule.`,
      };
    }

    // Request notification permission if needed
    if (get().notificationsEnabled) {
      await notificationService.requestNotificationPermission(true);
    }

    const newReminder: ReminderItem = {
      id: `rem-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      time: normalizedTime,
      amountMl: Math.round(amountMl),
      isEnabled: true,
    };

    // Schedule Android local notification if active
    if (get().notificationsEnabled) {
      const notifId = await notificationService.scheduleReminder(newReminder, {
        soundEnabled: get().soundEnabled,
        vibrationEnabled: get().vibrationEnabled,
      });
      newReminder.notificationId = notifId;
    }

    const updated = [...get().customReminders, newReminder].sort((a, b) =>
      compareTimes(a.time, b.time)
    );

    set({ customReminders: updated });

    // SQLite insert
    await insertReminderToDb(newReminder, 'custom');

    return { success: true };
  },

  updateReminder: async (reminder) => {
    if (!reminder.time || !reminder.time.trim()) {
      return { success: false, error: 'Please specify a reminder time.' };
    }

    if (!reminder.amountMl || reminder.amountMl <= 0 || isNaN(reminder.amountMl)) {
      return { success: false, error: 'Amount must be greater than 0 ml.' };
    }

    const normalizedTime = formatTime12Hour(reminder.time);

    // Duplicate check against other reminders
    if (isDuplicateTime(get().customReminders, normalizedTime, reminder.id)) {
      return {
        success: false,
        error: `Another reminder is already scheduled for ${normalizedTime}.`,
      };
    }

    const updatedReminder: ReminderItem = {
      ...reminder,
      time: normalizedTime,
      amountMl: Math.round(reminder.amountMl),
    };

    // Update notification
    if (updatedReminder.isEnabled && get().notificationsEnabled) {
      const notifId = await notificationService.scheduleReminder(updatedReminder, {
        soundEnabled: get().soundEnabled,
        vibrationEnabled: get().vibrationEnabled,
      });
      updatedReminder.notificationId = notifId;
    } else {
      await notificationService.cancelReminder(updatedReminder.id, updatedReminder.notificationId);
      updatedReminder.notificationId = null;
    }

    const updated = get().customReminders.map((r) =>
      r.id === reminder.id ? updatedReminder : r
    ).sort((a, b) => compareTimes(a.time, b.time));

    set({ customReminders: updated });

    // SQLite update
    await updateReminderInDb(updatedReminder);

    return { success: true };
  },

  deleteCustomReminder: async (id) => {
    const target = get().customReminders.find((r) => r.id === id);
    const updated = get().customReminders.filter((r) => r.id !== id);
    set({ customReminders: updated });

    // SQLite deletion
    await deleteReminderFromDb(id);

    // Cancel notification
    await notificationService.cancelReminder(id, target?.notificationId);
  },

  updateNotificationSettings: async (settings) => {
    const updated = {
      notificationsEnabled: settings.notificationsEnabled ?? get().notificationsEnabled,
      soundEnabled: settings.soundEnabled ?? get().soundEnabled,
      vibrationEnabled: settings.vibrationEnabled ?? get().vibrationEnabled,
      snoozeMinutes: settings.snoozeMinutes ?? get().snoozeMinutes,
    };

    set(updated);

    await saveReminderSettingsToDb({
      enabled: updated.notificationsEnabled,
      soundEnabled: updated.soundEnabled,
      vibrationEnabled: updated.vibrationEnabled,
      snoozeMinutes: updated.snoozeMinutes,
    });

    // Reconfigure channel
    await notificationService.configureNotificationChannel(
      updated.soundEnabled,
      updated.vibrationEnabled
    );

    if (settings.notificationsEnabled === false) {
      await notificationService.cancelAllReminders();
    } else if (settings.notificationsEnabled === true) {
      await notificationService.rescheduleAllReminders(get().customReminders);
    }
  },

  snoozeReminder: async (minutes, amountMl) => {
    const snoozeDuration = minutes ?? get().snoozeMinutes ?? 10;
    const amount = amountMl ?? get().defaultAmountMl ?? 250;
    return await notificationService.scheduleSnoozeReminder(snoozeDuration, amount);
  },

  getNextReminderTime: () => {
    const state = get();
    if (!state.notificationsEnabled) {
      return 'Disabled';
    }

    const activeReminders = state.customReminders
      .filter((r) => r.isEnabled)
      .sort((a, b) => compareTimes(a.time, b.time));

    if (activeReminders.length === 0) {
      return 'Not configured';
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Find the next reminder later today
    const upcoming = activeReminders.find(
      (r) => parseTimeToMinutes(r.time) > currentMinutes
    );

    if (upcoming) {
      return upcoming.time;
    }

    // If all reminders for today have passed, return first one tomorrow
    return `${activeReminders[0].time} (Tomorrow)`;
  },

  resetSchedule: async () => {
    const resetList = DEFAULT_INTERVAL_REMINDERS;
    set({
      reminderMode: 'interval',
      startTime: '08:00 AM',
      endTime: '10:00 PM',
      intervalMinutes: 60,
      defaultAmountMl: 250,
      customReminders: resetList,
      notificationsEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      snoozeMinutes: 10,
    });

    await replaceAllRemindersInDb(resetList, 'interval');
    await saveReminderSettingsToDb({
      mode: 'interval',
      startTime: '08:00 AM',
      endTime: '10:00 PM',
      intervalMinutes: 60,
      defaultAmountMl: 250,
      enabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
      snoozeMinutes: 10,
    });

    await notificationService.rescheduleAllReminders(resetList);
  },
}));
