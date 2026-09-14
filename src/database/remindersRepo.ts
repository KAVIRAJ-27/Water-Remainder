import { getDatabase } from './database';
import { ReminderItem, ReminderMode } from '../types';

export interface DbReminderSettings {
  mode: ReminderMode;
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  defaultAmountMl: number;
  enabled: boolean;
  soundEnabled: boolean;
  snoozeMinutes: number;
}

interface RawReminderRow {
  id: string;
  time: string;
  amount_ml: number;
  enabled: number;
  mode: string;
  created_at: number;
  updated_at: number;
}

interface RawSettingsRow {
  mode: string;
  start_time: string;
  end_time: string;
  interval_minutes: number;
  default_amount_ml: number;
  enabled: number;
  sound_enabled: number;
  snooze_minutes: number;
}

/**
 * Loads all reminders sorted chronologically.
 */
export async function getRemindersFromDb(): Promise<ReminderItem[]> {
  const db = await getDatabase();
  if (!db) return [];

  try {
    const rows = await db.getAllAsync<RawReminderRow>(
      'SELECT id, time, amount_ml, enabled FROM reminders ORDER BY time ASC;'
    );

    return rows.map((r) => ({
      id: r.id,
      time: r.time,
      amountMl: r.amount_ml,
      isEnabled: r.enabled === 1,
    }));
  } catch (error) {
    console.error('[SQLite] Error loading reminders:', error);
    return [];
  }
}

/**
 * Inserts a single reminder into SQLite.
 */
export async function insertReminderToDb(
  reminder: ReminderItem,
  mode: ReminderMode = 'custom'
): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;

  try {
    const now = Date.now();
    await db.runAsync(
      `INSERT INTO reminders (id, time, amount_ml, enabled, mode, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        reminder.id,
        reminder.time,
        reminder.amountMl,
        reminder.isEnabled ? 1 : 0,
        mode,
        now,
        now,
      ]
    );
    return true;
  } catch (error) {
    console.error('[SQLite] Error inserting reminder:', error);
    return false;
  }
}

/**
 * Updates an existing reminder in SQLite.
 */
export async function updateReminderInDb(reminder: ReminderItem): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;

  try {
    await db.runAsync(
      `UPDATE reminders
       SET time = ?, amount_ml = ?, enabled = ?, updated_at = ?
       WHERE id = ?;`,
      [
        reminder.time,
        reminder.amountMl,
        reminder.isEnabled ? 1 : 0,
        Date.now(),
        reminder.id,
      ]
    );
    return true;
  } catch (error) {
    console.error('[SQLite] Error updating reminder:', error);
    return false;
  }
}

/**
 * Toggles a reminder enabled state.
 */
export async function toggleReminderInDb(id: string, isEnabled: boolean): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;

  try {
    await db.runAsync(
      `UPDATE reminders SET enabled = ?, updated_at = ? WHERE id = ?;`,
      [isEnabled ? 1 : 0, Date.now(), id]
    );
    return true;
  } catch (error) {
    console.error('[SQLite] Error toggling reminder:', error);
    return false;
  }
}

/**
 * Deletes a reminder from SQLite.
 */
export async function deleteReminderFromDb(id: string): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;

  try {
    await db.runAsync('DELETE FROM reminders WHERE id = ?;', [id]);
    return true;
  } catch (error) {
    console.error('[SQLite] Error deleting reminder:', error);
    return false;
  }
}

/**
 * Replaces all reminders with a newly generated interval schedule.
 */
export async function replaceAllRemindersInDb(
  reminders: ReminderItem[],
  mode: ReminderMode = 'interval'
): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;

  try {
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM reminders;');
      const now = Date.now();
      for (const r of reminders) {
        await db.runAsync(
          `INSERT INTO reminders (id, time, amount_ml, enabled, mode, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?);`,
          [r.id, r.time, r.amountMl, r.isEnabled ? 1 : 0, mode, now, now]
        );
      }
    });
    return true;
  } catch (error) {
    console.error('[SQLite] Error replacing reminders schedule:', error);
    return false;
  }
}

/**
 * Loads the reminder settings row from SQLite.
 */
export async function getReminderSettingsFromDb(): Promise<DbReminderSettings | null> {
  const db = await getDatabase();
  if (!db) return null;

  try {
    const row = await db.getFirstAsync<RawSettingsRow>(
      'SELECT mode, start_time, end_time, interval_minutes, default_amount_ml, enabled, sound_enabled, snooze_minutes FROM reminder_settings WHERE id = 1;'
    );

    if (!row) return null;

    return {
      mode: (row.mode === 'custom' ? 'custom' : 'interval') as ReminderMode,
      startTime: row.start_time,
      endTime: row.end_time,
      intervalMinutes: row.interval_minutes,
      defaultAmountMl: row.default_amount_ml,
      enabled: row.enabled === 1,
      soundEnabled: row.sound_enabled === 1,
      snoozeMinutes: row.snooze_minutes,
    };
  } catch (error) {
    console.error('[SQLite] Error loading reminder settings:', error);
    return null;
  }
}

/**
 * Updates the reminder settings row in SQLite.
 */
export async function saveReminderSettingsToDb(
  settings: Partial<DbReminderSettings>
): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;

  try {
    const current = await getReminderSettingsFromDb();
    const merged = {
      mode: settings.mode ?? current?.mode ?? 'interval',
      startTime: settings.startTime ?? current?.startTime ?? '08:00 AM',
      endTime: settings.endTime ?? current?.endTime ?? '10:00 PM',
      intervalMinutes: settings.intervalMinutes ?? current?.intervalMinutes ?? 60,
      defaultAmountMl: settings.defaultAmountMl ?? current?.defaultAmountMl ?? 250,
      enabled: settings.enabled ?? current?.enabled ?? true,
      soundEnabled: settings.soundEnabled ?? current?.soundEnabled ?? true,
      snoozeMinutes: settings.snoozeMinutes ?? current?.snoozeMinutes ?? 10,
    };

    await db.runAsync(
      `UPDATE reminder_settings
       SET mode = ?, start_time = ?, end_time = ?, interval_minutes = ?, default_amount_ml = ?, enabled = ?, sound_enabled = ?, snooze_minutes = ?
       WHERE id = 1;`,
      [
        merged.mode,
        merged.startTime,
        merged.endTime,
        merged.intervalMinutes,
        merged.defaultAmountMl,
        merged.enabled ? 1 : 0,
        merged.soundEnabled ? 1 : 0,
        merged.snoozeMinutes,
      ]
    );
    return true;
  } catch (error) {
    console.error('[SQLite] Error saving reminder settings:', error);
    return false;
  }
}
