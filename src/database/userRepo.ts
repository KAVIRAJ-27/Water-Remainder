import { getDatabase } from './database';
import { ThemeMode, UnitPreference } from '../types';

export interface DbUserSettings {
  name: string;
  dailyGoal: number;
  unit: UnitPreference;
  defaultAmountMl: number;
  themeMode: ThemeMode;
  onboardingCompleted: boolean;
}

interface RawUserSettingsRow {
  name: string;
  daily_goal_ml: number;
  unit: string;
  default_amount_ml: number;
  theme_mode: string;
  onboarding_completed: number;
  updated_at: number;
}

const DEFAULT_USER_SETTINGS: DbUserSettings = {
  name: 'Kaviraj',
  dailyGoal: 2500,
  unit: 'ml',
  defaultAmountMl: 250,
  themeMode: 'system',
  onboardingCompleted: false,
};

/**
 * Loads the user profile and application settings row from SQLite.
 */
export async function getUserSettingsFromDb(): Promise<DbUserSettings | null> {
  const db = await getDatabase();
  if (!db) return null;

  try {
    const row = await db.getFirstAsync<RawUserSettingsRow>(
      'SELECT name, daily_goal_ml, unit, default_amount_ml, theme_mode, onboarding_completed, updated_at FROM user_settings WHERE id = 1;'
    );

    if (!row) return null;

    return {
      name: row.name || 'Kaviraj',
      dailyGoal: Number(row.daily_goal_ml) || 2500,
      unit: (row.unit === 'L' ? 'L' : 'ml') as UnitPreference,
      defaultAmountMl: Number(row.default_amount_ml) || 250,
      themeMode: (['system', 'light', 'dark'].includes(row.theme_mode)
        ? row.theme_mode
        : 'system') as ThemeMode,
      onboardingCompleted: row.onboarding_completed === 1,
    };
  } catch (error) {
    console.error('[SQLite] Error loading user settings:', error);
    return null;
  }
}

/**
 * Saves or updates the user profile and application settings in SQLite.
 */
export async function saveUserSettingsToDb(
  settings: Partial<DbUserSettings>
): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;

  try {
    const current = await getUserSettingsFromDb();
    const merged: DbUserSettings = {
      name: settings.name ?? current?.name ?? DEFAULT_USER_SETTINGS.name,
      dailyGoal: settings.dailyGoal ?? current?.dailyGoal ?? DEFAULT_USER_SETTINGS.dailyGoal,
      unit: settings.unit ?? current?.unit ?? DEFAULT_USER_SETTINGS.unit,
      defaultAmountMl:
        settings.defaultAmountMl ?? current?.defaultAmountMl ?? DEFAULT_USER_SETTINGS.defaultAmountMl,
      themeMode: settings.themeMode ?? current?.themeMode ?? DEFAULT_USER_SETTINGS.themeMode,
      onboardingCompleted:
        settings.onboardingCompleted ??
        current?.onboardingCompleted ??
        DEFAULT_USER_SETTINGS.onboardingCompleted,
    };

    const now = Date.now();
    await db.runAsync(
      `INSERT INTO user_settings (id, name, daily_goal_ml, unit, default_amount_ml, theme_mode, onboarding_completed, updated_at)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         daily_goal_ml = excluded.daily_goal_ml,
         unit = excluded.unit,
         default_amount_ml = excluded.default_amount_ml,
         theme_mode = excluded.theme_mode,
         onboarding_completed = excluded.onboarding_completed,
         updated_at = excluded.updated_at;`,
      [
        merged.name,
        merged.dailyGoal,
        merged.unit,
        merged.defaultAmountMl,
        merged.themeMode,
        merged.onboardingCompleted ? 1 : 0,
        now,
      ]
    );

    return true;
  } catch (error) {
    console.error('[SQLite] Error saving user settings:', error);
    return false;
  }
}

/**
 * Resets user settings to factory defaults in SQLite.
 */
export async function resetUserSettingsInDb(): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;

  try {
    const now = Date.now();
    await db.runAsync(
      `UPDATE user_settings
       SET name = ?, daily_goal_ml = ?, unit = ?, default_amount_ml = ?, theme_mode = ?, onboarding_completed = 0, updated_at = ?
       WHERE id = 1;`,
      [
        DEFAULT_USER_SETTINGS.name,
        DEFAULT_USER_SETTINGS.dailyGoal,
        DEFAULT_USER_SETTINGS.unit,
        DEFAULT_USER_SETTINGS.defaultAmountMl,
        DEFAULT_USER_SETTINGS.themeMode,
        now,
      ]
    );
    return true;
  } catch (error) {
    console.error('[SQLite] Error resetting user settings:', error);
    return false;
  }
}
