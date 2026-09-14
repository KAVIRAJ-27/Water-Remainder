import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Returns the singleton SQLite database instance, initializing schemas if needed.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (Platform.OS === 'web') {
    // Return null on Web to allow graceful memory/AsyncStorage fallback
    return null;
  }

  if (dbInstance) {
    return dbInstance;
  }

  try {
    const db = await SQLite.openDatabaseAsync('hydroreminder.db');
    await initDatabaseSchema(db);
    dbInstance = db;
    return dbInstance;
  } catch (error) {
    console.error('[SQLite] Failed to initialize database:', error);
    return null;
  }
}

/**
 * Initializes database tables and indices.
 */
async function initDatabaseSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    -- Reminders table
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY NOT NULL,
      time TEXT NOT NULL,
      amount_ml INTEGER NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      mode TEXT NOT NULL DEFAULT 'custom',
      notification_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Reminder settings table (single configuration row)
    CREATE TABLE IF NOT EXISTS reminder_settings (
      id INTEGER PRIMARY KEY NOT NULL DEFAULT 1,
      mode TEXT NOT NULL DEFAULT 'interval',
      start_time TEXT NOT NULL DEFAULT '08:00 AM',
      end_time TEXT NOT NULL DEFAULT '10:00 PM',
      interval_minutes INTEGER NOT NULL DEFAULT 60,
      default_amount_ml INTEGER NOT NULL DEFAULT 250,
      enabled INTEGER NOT NULL DEFAULT 1,
      sound_enabled INTEGER NOT NULL DEFAULT 1,
      vibration_enabled INTEGER NOT NULL DEFAULT 1,
      snooze_minutes INTEGER NOT NULL DEFAULT 10
    );

    -- Seed default reminder settings if empty
    INSERT OR IGNORE INTO reminder_settings (
      id, mode, start_time, end_time, interval_minutes, default_amount_ml, enabled, sound_enabled, vibration_enabled, snooze_minutes
    ) VALUES (
      1, 'interval', '08:00 AM', '10:00 PM', 60, 250, 1, 1, 1, 10
    );

    -- Water logs table foundation
    CREATE TABLE IF NOT EXISTS water_logs (
      id TEXT PRIMARY KEY NOT NULL,
      amount_ml INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      date_key TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_water_logs_date ON water_logs(date_key);
    CREATE INDEX IF NOT EXISTS idx_water_logs_date_ts ON water_logs(date_key, timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_reminders_enabled ON reminders(enabled);
  `);

  // Migrations for existing databases
  try {
    const reminderCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(reminders);');
    if (!reminderCols.some((c) => c.name === 'notification_id')) {
      await db.execAsync('ALTER TABLE reminders ADD COLUMN notification_id TEXT;');
    }
  } catch (err) {
    console.warn('[SQLite Migration] notification_id check:', err);
  }

  try {
    const settingsCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(reminder_settings);');
    if (!settingsCols.some((c) => c.name === 'vibration_enabled')) {
      await db.execAsync('ALTER TABLE reminder_settings ADD COLUMN vibration_enabled INTEGER NOT NULL DEFAULT 1;');
    }
  } catch (err) {
    console.warn('[SQLite Migration] vibration_enabled check:', err);
  }
}
