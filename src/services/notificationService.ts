import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { ReminderItem } from '../types';
import { parseTimeToMinutes } from '../utils/timeUtils';
import { updateReminderNotificationIdInDb } from '../database/remindersRepo';

export const WATER_NOTIFICATION_CHANNEL_ID = 'water-reminders';
export const WATER_NOTIFICATION_CATEGORY_ID = 'WATER_REMINDER';

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
  initializeNotifications: (soundEnabled?: boolean, vibrationEnabled?: boolean) => Promise<void>;
  requestNotificationPermission: (explainIfCanAsk?: boolean) => Promise<boolean>;
  getPermissionStatus: () => Promise<Notifications.PermissionStatus>;
  configureNotificationChannel: (soundEnabled?: boolean, vibrationEnabled?: boolean) => Promise<void>;
  scheduleReminder: (reminder: ReminderItem, channelConfig?: { soundEnabled?: boolean; vibrationEnabled?: boolean }) => Promise<string | null>;
  cancelReminder: (reminderId: string, notificationId?: string | null) => Promise<void>;
  cancelAllReminders: () => Promise<void>;
  rescheduleAllReminders: (reminders: ReminderItem[]) => Promise<void>;
  reconcileNotifications: (reminders: ReminderItem[], notificationsEnabled: boolean) => Promise<void>;
  scheduleSnoozeReminder: (minutes: number, amountMl: number) => Promise<string | null>;
  getScheduledNotifications: () => Promise<Notifications.NotificationRequest[]>;
}

class ExpoNotificationService implements NotificationService {
  private hasInitialized = false;

  /**
   * Initializes notification channels and categories on app startup.
   */
  async initializeNotifications(
    soundEnabled: boolean = true,
    vibrationEnabled: boolean = true
  ): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      await this.configureNotificationChannel(soundEnabled, vibrationEnabled);
      await this.setupNotificationCategories();
      this.hasInitialized = true;
    } catch (error) {
      console.warn('[NotificationService] Initialization error:', error);
    }
  }

  /**
   * Configures the Android Notification Channel.
   */
  async configureNotificationChannel(
    soundEnabled: boolean = true,
    vibrationEnabled: boolean = true
  ): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      await Notifications.setNotificationChannelAsync(WATER_NOTIFICATION_CHANNEL_ID, {
        name: 'Water Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        sound: soundEnabled ? 'default' : null,
        vibrationPattern: vibrationEnabled ? [0, 250, 250, 250] : null,
        enableVibrate: vibrationEnabled,
        lightColor: '#00A8FF',
        description: 'Hydration reminder notifications for HydroReminder',
        showBadge: false,
      });
    } catch (error) {
      console.warn('[NotificationService] Channel setup failed:', error);
    }
  }

  /**
   * Registers notification actions (e.g. Snooze 15m, Snooze 30m).
   */
  private async setupNotificationCategories(): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      await Notifications.setNotificationCategoryAsync(WATER_NOTIFICATION_CATEGORY_ID, [
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
      // Safe fallback if action categories aren't supported on device
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
        // Show explanation dialog first
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
   * Schedules a daily recurring notification for an enabled reminder.
   */
  async scheduleReminder(
    reminder: ReminderItem,
    channelConfig?: { soundEnabled?: boolean; vibrationEnabled?: boolean }
  ): Promise<string | null> {
    if (Platform.OS === 'web' || !reminder.isEnabled) return null;

    try {
      if (!this.hasInitialized) {
        await this.initializeNotifications(
          channelConfig?.soundEnabled ?? true,
          channelConfig?.vibrationEnabled ?? true
        );
      }

      const totalMinutes = parseTimeToMinutes(reminder.time);
      const hour = Math.floor(totalMinutes / 60);
      const minute = totalMinutes % 60;

      // Cancel previous notification if one was assigned
      if (reminder.notificationId) {
        await this.cancelNotificationById(reminder.notificationId);
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 Time to drink water!',
          body: `Drink ${reminder.amountMl} ml of water to stay hydrated.`,
          sound: channelConfig?.soundEnabled !== false,
          data: {
            reminderId: reminder.id,
            amountMl: reminder.amountMl,
            time: reminder.time,
          },
          categoryIdentifier: WATER_NOTIFICATION_CATEGORY_ID,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: WATER_NOTIFICATION_CHANNEL_ID,
        },
      });

      // Persist mapping to SQLite
      await updateReminderNotificationIdInDb(reminder.id, notificationId);

      return notificationId;
    } catch (error) {
      console.warn(`[NotificationService] Failed to schedule reminder ${reminder.id}:`, error);
      return null;
    }
  }

  /**
   * Cancels a scheduled reminder notification.
   */
  async cancelReminder(reminderId: string, notificationId?: string | null): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      if (notificationId) {
        await this.cancelNotificationById(notificationId);
      } else {
        // Find matching notification by data payload
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const target = scheduled.find(
          (req) => req.content.data?.reminderId === reminderId
        );
        if (target) {
          await Notifications.cancelScheduledNotificationAsync(target.identifier);
        }
      }

      // Clear from SQLite
      await updateReminderNotificationIdInDb(reminderId, null);
    } catch (error) {
      console.warn(`[NotificationService] Failed to cancel reminder ${reminderId}:`, error);
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
    } catch (error) {
      console.warn('[NotificationService] Failed to cancel all notifications:', error);
    }
  }

  /**
   * Reschedules all active reminders.
   */
  async rescheduleAllReminders(reminders: ReminderItem[]): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      await this.cancelAllReminders();
      for (const rem of reminders) {
        if (rem.isEnabled) {
          await this.scheduleReminder(rem);
        }
      }
    } catch (error) {
      console.warn('[NotificationService] Failed to reschedule all reminders:', error);
    }
  }

  /**
   * Reconciles scheduled notifications with SQLite database to prevent duplicates
   * or orphaned notifications when app is reopened.
   */
  async reconcileNotifications(
    reminders: ReminderItem[],
    notificationsEnabled: boolean
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

      // 2. Ensure each enabled reminder has a single, valid scheduled notification
      for (const rem of enabledReminders) {
        const hasExistingScheduled = rem.notificationId && scheduledIdSet.has(rem.notificationId);

        if (!hasExistingScheduled) {
          // Missing or stale: schedule clean notification
          const newId = await this.scheduleReminder(rem);
          if (newId) {
            rem.notificationId = newId;
          }
        }
      }
    } catch (error) {
      console.warn('[NotificationService] Error during notification reconciliation:', error);
    }
  }

  /**
   * Schedules a one-off temporary notification for the Snooze feature.
   */
  async scheduleSnoozeReminder(minutes: number, amountMl: number): Promise<string | null> {
    if (Platform.OS === 'web' || minutes <= 0) return null;

    try {
      const notifId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💧 Snooze Reminder: Drink water!',
          body: `Drink ${amountMl} ml of water to maintain your hydration.`,
          sound: true,
          data: {
            isSnooze: true,
            amountMl,
          },
          categoryIdentifier: WATER_NOTIFICATION_CATEGORY_ID,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: minutes * 60,
          channelId: WATER_NOTIFICATION_CHANNEL_ID,
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
