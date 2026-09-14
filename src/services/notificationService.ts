import { ReminderItem } from '../types';

/**
 * Phase 5 Notification Service Interface.
 * These methods are prepared for direct integration with expo-notifications in Phase 5.
 */
export interface NotificationService {
  scheduleReminder: (reminder: ReminderItem) => Promise<string | null>;
  cancelReminder: (reminderId: string) => Promise<void>;
  cancelAllReminders: () => Promise<void>;
  rescheduleAllReminders: (reminders: ReminderItem[]) => Promise<void>;
}

class MockNotificationService implements NotificationService {
  async scheduleReminder(reminder: ReminderItem): Promise<string | null> {
    // Prepared for Phase 5: Notifications.scheduleNotificationAsync
    if (!reminder.isEnabled) return null;
    return `notif-${reminder.id}`;
  }

  async cancelReminder(_reminderId: string): Promise<void> {
    // Prepared for Phase 5: Notifications.cancelScheduledNotificationAsync
  }

  async cancelAllReminders(): Promise<void> {
    // Prepared for Phase 5: Notifications.cancelAllScheduledNotificationsAsync
  }

  async rescheduleAllReminders(reminders: ReminderItem[]): Promise<void> {
    // Prepared for Phase 5: Cancel and reschedule all active reminders
    for (const rem of reminders) {
      if (rem.isEnabled) {
        await this.scheduleReminder(rem);
      }
    }
  }
}

export const notificationService = new MockNotificationService();
