import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { ReminderItem } from '../types';
import { parseTimeToMinutes } from '../utils/timeUtils';
import {
  updateReminderNotificationIdInDb,
  updateReminderFollowUpNotificationIdInDb,
} from '../database/remindersRepo';

export const WATER_NOTIFICATION_CHANNEL_NORMAL = 'water-reminders-normal';
export const WATER_NOTIFICATION_CHANNEL_ALARM = 'water-reminders-alarm';

export const WATER_NOTIFICATION_CATEGORY_ID = 'WATER_REMINDER';
export const WATER_FOLLOW_UP_CATEGORY_ID = 'WATER_FOLLOW_UP';

// Configure foreground presentation behavior for local notifications
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export interface NotificationService {
  initializeNotifications: (
    soundEnabled?: boolean,
    vibrationEnabled?: boolean,
    alarmMode?: boolean
  ) => Promise<void>;
  requestNotificationPermission: (explainIfCanAsk?: boolean) => Promise<boolean>;
  getPermissionStatus: () => Promise<Notifications.PermissionStatus>;
  configureNotificationChannels: (
    soundEnabled?: boolean,
    vibrationEnabled?: boolean,
    alarmMode?: boolean
  ) => Promise<void>;
  scheduleReminder: (
    reminder: ReminderItem,
    channelConfig?: { soundEnabled?: boolean; vibrationEnabled?: boolean; alarmMode?: boolean }
  ) => Promise<{ notificationId: string | null; followUpNotificationId: string | null }>;
  cancelReminder: (
    reminderId: string,
    notificationId?: string | null,
    followUpNotificationId?: string | null
  ) => Promise<void>;
  cancelFollowUpForReminder: (reminderId: string) => Promise<void>;
  cancelAllReminders: () => Promise<void>;
  rescheduleAllReminders: (
    reminders: ReminderItem[],
    alarmMode?: boolean
  ) => Promise<void>;
  reconcileNotifications: (
    reminders: ReminderItem[],
    notificationsEnabled: boolean,
    alarmMode?: boolean
  ) => Promise<void>;
  scheduleSnoozeReminder: (
    minutes: number,
    amountMl: number,
    reminderId?: string,
    alarmMode?: boolean
  ) => Promise<string | null>;
  getScheduledNotifications: () => Promise<Notifications.NotificationRequest[]>;
}

class ExpoNotificationService implements NotificationService {
  private hasInitialized = false;

  /**
   * Initializes notification channels and categories on app startup.
   */
  async initializeNotifications(
    soundEnabled: boolean = true,
    vibrationEnabled: boolean = true,
    alarmMode: boolean = false
  ): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      await this.configureNotificationChannels(soundEnabled, vibrationEnabled, alarmMode);
      await this.setupNotificationCategories();
      this.hasInitialized = true;
    } catch (error) {
      console.warn('[NotificationService] Initialization error:', error);
    }
  }

  /**
   * Configures both Normal and Alarm-Style Android Notification Channels.
   */
  async configureNotificationChannels(
    soundEnabled: boolean = true,
    vibrationEnabled: boolean = true,
    _alarmMode: boolean = false
  ): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      // 1. Normal reminder channel (Balanced notification)
      await Notifications.setNotificationChannelAsync(WATER_NOTIFICATION_CHANNEL_NORMAL, {
        name: 'Water Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: soundEnabled ? 'default' : null,
        vibrationPattern: vibrationEnabled ? [0, 250, 250, 250] : null,
        enableVibrate: vibrationEnabled,
        lightColor: '#00A8FF',
        description: 'Hydration reminder notifications for HydroReminder',
        showBadge: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      // 2. Alarm-style channel (Heads-up banner, high-intensity vibration pattern)
      await Notifications.setNotificationChannelAsync(WATER_NOTIFICATION_CHANNEL_ALARM, {
        name: 'Water Reminders (Alarm Mode)',
        importance: Notifications.AndroidImportance.MAX,
        sound: soundEnabled ? 'default' : null,
        vibrationPattern: vibrationEnabled
          ? [0, 500, 250, 500, 250, 1000, 500, 1000]
          : null,
        enableVibrate: vibrationEnabled,
        lightColor: '#00A8FF',
        description: 'Urgent alarm-style hydration notifications for HydroReminder',
        showBadge: true,
        bypassDnd: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    } catch (error) {
      console.warn('[NotificationService] Channel setup failed:', error);
    }
  }

  /**
   * Registers notification action categories:
   * 1. Primary Reminder: [Drink Water], [Snooze 15m], [Snooze 30m]
   * 2. Follow-Up (5 min): [Yes, I drank], [Not yet], [Snooze 15m], [Snooze 30m]
   */
  private async setupNotificationCategories(): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      // Category 1: Main reminder actions
      await Notifications.setNotificationCategoryAsync(WATER_NOTIFICATION_CATEGORY_ID, [
        {
          identifier: 'DRINK_WATER',
          buttonTitle: 'Drink Water 💧',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'SNOOZE_15',
          buttonTitle: 'Snooze 15m',
          options: { opensAppToForeground: false },
        },
        {
          identifier: 'SNOOZE_30',
          buttonTitle: 'Snooze 30m',
          options: { opensAppToForeground: false },
        },
      ]);

      // Category 2: 5-minute follow-up actions
      await Notifications.setNotificationCategoryAsync(WATER_FOLLOW_UP_CATEGORY_ID, [
        {
          identifier: 'CONFIRM_DRANK',
          buttonTitle: 'Yes, I drank 💧',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'NOT_YET',
          buttonTitle: 'Not yet',
          options: { opensAppToForeground: false },
        },
        {
          identifier: 'SNOOZE_15',
          buttonTitle: 'Snooze 15m',
          options: { opensAppToForeground: false },
        },
        {
          identifier: 'SNOOZE_30',
          buttonTitle: 'Snooze 30m',
          options: { opensAppToForeground: false },
        },
      ]);
    } catch (error) {
      console.warn('[NotificationService] Category setup fallback:', error);
    }
  }

  /**
   * Checks current permission status without prompting.
   */
  async getPermissionStatus(): Promise<Notifications.PermissionStatus> {
    if (Platform.OS === 'web') return Notifications.PermissionStatus.GRANTED;

    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch {
      return Notifications.PermissionStatus.UNDETERMINED;
    }
  }

  /**
   * Prompts user for notification permission with friendly context.
   */
  async requestNotificationPermission(explainIfCanAsk: boolean = true): Promise<boolean> {
    if (Platform.OS === 'web') return true;

    try {
      const current = await Notifications.getPermissionsAsync();
      if (current.granted || current.status === Notifications.PermissionStatus.GRANTED) {
        return true;
      }

      if (current.canAskAgain && explainIfCanAsk) {
        await new Promise<void>((resolve) => {
          Alert.alert(
            'Enable Hydration Reminders 💧',
            "HydroReminder needs notification permission to remind you when it's time to drink water throughout your day.",
            [{ text: 'Continue', onPress: () => resolve() }]
          );
        });
      }

      const requested = await Notifications.requestPermissionsAsync({
        android: {},
        ios: {
          allowAlert: true,
          allowBadge: false,
          allowSound: true,
        },
      });

      return requested.granted || requested.status === Notifications.PermissionStatus.GRANTED;
    } catch (error) {
      console.warn('[NotificationService] Permission request failed:', error);
      return false;
    }
  }

  /**
   * Schedules a daily recurring reminder notification PLUS exactly ONE 5-minute follow-up.
   */
  async scheduleReminder(
    reminder: ReminderItem,
    channelConfig?: { soundEnabled?: boolean; vibrationEnabled?: boolean; alarmMode?: boolean }
  ): Promise<{ notificationId: string | null; followUpNotificationId: string | null }> {
    if (Platform.OS === 'web' || !reminder.isEnabled) {
      return { notificationId: null, followUpNotificationId: null };
    }

    try {
      const isAlarm = channelConfig?.alarmMode ?? false;
      const channelId = isAlarm
        ? WATER_NOTIFICATION_CHANNEL_ALARM
        : WATER_NOTIFICATION_CHANNEL_NORMAL;

      if (!this.hasInitialized) {
        await this.initializeNotifications(
          channelConfig?.soundEnabled ?? true,
          channelConfig?.vibrationEnabled ?? true,
          isAlarm
        );
      }

      const totalMinutes = parseTimeToMinutes(reminder.time);
      const hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;

      // Clean up previous notifications if any
      if (reminder.notificationId) {
        await this.cancelNotificationById(reminder.notificationId);
      }
      if (reminder.followUpNotificationId) {
        await this.cancelNotificationById(reminder.followUpNotificationId);
      }

      // 1. Schedule Primary Reminder
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 Time to drink water!',
          body: `Drink ${reminder.amountMl} ml of water to stay hydrated.`,
          sound: channelConfig?.soundEnabled !== false,
          priority: isAlarm
            ? Notifications.AndroidNotificationPriority.MAX
            : Notifications.AndroidNotificationPriority.HIGH,
          data: {
            reminderId: reminder.id,
            amountMl: reminder.amountMl,
            time: reminder.time,
            isOriginal: true,
          },
          categoryIdentifier: WATER_NOTIFICATION_CATEGORY_ID,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId,
        },
      });

      // 2. Schedule 5-Minute Follow-Up Reminder (hour and minute + 5, modulo 24 hours)
      const followUpMinutes = (totalMinutes + 5) % (24 * 60);
      const followUpHour = Math.floor(followUpMinutes / 60);
      const followUpMinute = followUpMinutes % 60;

      const followUpNotificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 Did you drink the water?',
          body: `Confirm if you drank ${reminder.amountMl} ml of water to stay on track!`,
          sound: channelConfig?.soundEnabled !== false,
          priority: isAlarm
            ? Notifications.AndroidNotificationPriority.MAX
            : Notifications.AndroidNotificationPriority.HIGH,
          data: {
            reminderId: reminder.id,
            amountMl: reminder.amountMl,
            time: reminder.time,
            isFollowUp: true,
          },
          categoryIdentifier: WATER_FOLLOW_UP_CATEGORY_ID,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: followUpHour,
          minute: followUpMinute,
          channelId,
        },
      });

      // Persist IDs to SQLite
      await updateReminderNotificationIdInDb(reminder.id, notificationId);
      await updateReminderFollowUpNotificationIdInDb(reminder.id, followUpNotificationId);

      return { notificationId, followUpNotificationId };
    } catch (error) {
      console.warn(`[NotificationService] Failed to schedule reminder ${reminder.id}:`, error);
      return { notificationId: null, followUpNotificationId: null };
    }
  }

  /**
   * Cancels a scheduled reminder notification and its follow-up.
   */
  async cancelReminder(
    reminderId: string,
    notificationId?: string | null,
    followUpNotificationId?: string | null
  ): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      if (notificationId) {
        await this.cancelNotificationById(notificationId);
      }
      if (followUpNotificationId) {
        await this.cancelNotificationById(followUpNotificationId);
      }

      // Also clean up by reminderId tag in data
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const req of scheduled) {
        if (req.content.data?.reminderId === reminderId) {
          await Notifications.cancelScheduledNotificationAsync(req.identifier);
        }
      }

      // Clear from SQLite
      await updateReminderNotificationIdInDb(reminderId, null);
      await updateReminderFollowUpNotificationIdInDb(reminderId, null);
    } catch (error) {
      console.warn(`[NotificationService] Failed to cancel reminder ${reminderId}:`, error);
    }
  }

  /**
   * Cancels any pending or delivered 5-minute follow-up notifications for a reminder.
   * Called when user confirms drinking or snoozes the reminder.
   */
  async cancelFollowUpForReminder(reminderId: string): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const req of scheduled) {
        if (req.content.data?.reminderId === reminderId && req.content.data?.isFollowUp) {
          await Notifications.cancelScheduledNotificationAsync(req.identifier);
        }
      }

      // Also dismiss any already-displayed follow-up notifications on Android
      const presented = await Notifications.getPresentedNotificationsAsync();
      for (const p of presented) {
        if (p.request.content.data?.reminderId === reminderId) {
          await Notifications.dismissNotificationAsync(p.request.identifier);
        }
      }
    } catch (error) {
      console.warn(`[NotificationService] Error cancelling follow-up for ${reminderId}:`, error);
    }
  }

  /**
   * Helper to cancel a notification safely by its identifier.
   */
  private async cancelNotificationById(id: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (err) {
      console.warn(`[NotificationService] Error cancelling ID ${id}:`, err);
    }
  }

  /**
   * Cancels all scheduled water reminder notifications.
   */
  async cancelAllReminders(): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.warn('[NotificationService] Failed to cancel all notifications:', error);
    }
  }

  /**
   * Reschedules all active reminders.
   */
  async rescheduleAllReminders(
    reminders: ReminderItem[],
    alarmMode: boolean = false
  ): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      await this.cancelAllReminders();
      for (const rem of reminders) {
        if (rem.isEnabled) {
          await this.scheduleReminder(rem, { alarmMode });
        }
      }
    } catch (error) {
      console.warn('[NotificationService] Failed to reschedule all reminders:', error);
    }
  }

  /**
   * Reconciles scheduled notifications with SQLite database to prevent duplicates
   * or orphaned notifications when app is reopened or settings change.
   */
  async reconcileNotifications(
    reminders: ReminderItem[],
    notificationsEnabled: boolean,
    alarmMode: boolean = false
  ): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();

      // If notifications are disabled globally, cancel all scheduled ones
      if (!notificationsEnabled) {
        if (scheduled.length > 0) {
          await Notifications.cancelAllScheduledNotificationsAsync();
        }
        for (const rem of reminders) {
          if (rem.notificationId) {
            await updateReminderNotificationIdInDb(rem.id, null);
          }
          if (rem.followUpNotificationId) {
            await updateReminderFollowUpNotificationIdInDb(rem.id, null);
          }
        }
        return;
      }

      const enabledReminders = reminders.filter((r) => r.isEnabled);
      const scheduledIdSet = new Set(scheduled.map((s) => s.identifier));

      // 1. Cancel notifications that belong to deleted or disabled reminders
      const enabledReminderIds = new Set(enabledReminders.map((r) => r.id));
      for (const notif of scheduled) {
        const notifReminderId = notif.content.data?.reminderId as string | undefined;
        if (notifReminderId && !enabledReminderIds.has(notifReminderId)) {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
      }

      // 2. Ensure each enabled reminder has valid primary and follow-up notifications
      for (const rem of enabledReminders) {
        const hasPrimary = rem.notificationId && scheduledIdSet.has(rem.notificationId);
        const hasFollowUp =
          rem.followUpNotificationId && scheduledIdSet.has(rem.followUpNotificationId);

        if (!hasPrimary || !hasFollowUp) {
          const res = await this.scheduleReminder(rem, { alarmMode });
          if (res.notificationId) {
            rem.notificationId = res.notificationId;
          }
          if (res.followUpNotificationId) {
            rem.followUpNotificationId = res.followUpNotificationId;
          }
        }
      }
    } catch (error) {
      console.warn('[NotificationService] Error during notification reconciliation:', error);
    }
  }

  /**
   * Schedules a one-off temporary notification for the Snooze feature (15m or 30m),
   * PLUS a 5-minute follow-up after the snooze timer expires.
   */
  async scheduleSnoozeReminder(
    minutes: number,
    amountMl: number,
    reminderId?: string,
    alarmMode: boolean = false
  ): Promise<string | null> {
    if (Platform.OS === 'web' || minutes <= 0) return null;

    try {
      const parentId = reminderId ?? `snooze-${Date.now()}`;
      const channelId = alarmMode
        ? WATER_NOTIFICATION_CHANNEL_ALARM
        : WATER_NOTIFICATION_CHANNEL_NORMAL;

      // Cancel any previous follow-up for this reminder
      await this.cancelFollowUpForReminder(parentId);

      // 1. Schedule Snooze notification
      const notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 Snooze Reminder: Drink water!',
          body: `Drink ${amountMl} ml of water to maintain your hydration.`,
          sound: true,
          priority: alarmMode
            ? Notifications.AndroidNotificationPriority.MAX
            : Notifications.AndroidNotificationPriority.HIGH,
          data: {
            reminderId: parentId,
            isSnooze: true,
            amountMl,
          },
          categoryIdentifier: WATER_NOTIFICATION_CATEGORY_ID,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: minutes * 60,
          channelId,
        },
      });

      // 2. Schedule 5-minute follow-up after snooze
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 Did you drink the water?',
          body: `Confirm if you drank ${amountMl} ml of water!`,
          sound: true,
          priority: alarmMode
            ? Notifications.AndroidNotificationPriority.MAX
            : Notifications.AndroidNotificationPriority.HIGH,
          data: {
            reminderId: parentId,
            isFollowUp: true,
            amountMl,
          },
          categoryIdentifier: WATER_FOLLOW_UP_CATEGORY_ID,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: (minutes + 5) * 60,
          channelId,
        },
      });

      return notifId;
    } catch (error) {
      console.warn('[NotificationService] Failed to schedule snooze:', error);
      return null;
    }
  }

  /**
   * Returns all currently scheduled notifications on the device.
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    if (Platform.OS === 'web') return [];
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch {
      return [];
    }
  }
}

export const notificationService = new ExpoNotificationService();
