import { getDatabase } from './database';
import { WaterLog } from '../types';

export interface DailyTotalRow {
  dateKey: string;
  totalMl: number;
  drinkCount: number;
}

interface RawWaterLogRow {
  id: string;
  amount_ml: number;
  timestamp: number;
  date_key: string;
  reminder_id: string | null;
}

interface RawDailyTotalRow {
  date_key: string;
  total_ml: number | null;
  drink_count: number | null;
}

/**
 * Inserts a new water log into SQLite.
 */
export async function insertWaterLogInDb(log: WaterLog): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;

  try {
    await db.runAsync(
      `INSERT INTO water_logs (id, amount_ml, timestamp, date_key, reminder_id)
       VALUES (?, ?, ?, ?, ?);`,
      [log.id, log.amountMl, log.timestamp, log.dateKey, log.reminderId ?? null]
    );
    return true;
  } catch (error) {
    console.error('[SQLite] Error inserting water log:', error);
    return false;
  }
}

/**
 * Deletes a single water log by ID.
 */
export async function deleteWaterLogInDb(id: string): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;

  try {
    await db.runAsync('DELETE FROM water_logs WHERE id = ?;', [id]);
    return true;
  } catch (error) {
    console.error('[SQLite] Error deleting water log:', error);
    return false;
  }
}

/**
 * Deletes all water logs for a specific date (e.g. Today).
 */
export async function clearDateLogsInDb(dateKey: string): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;

  try {
    await db.runAsync('DELETE FROM water_logs WHERE date_key = ?;', [dateKey]);
    return true;
  } catch (error) {
    console.error(`[SQLite] Error clearing water logs for date ${dateKey}:`, error);
    return false;
  }
}

/**
 * Clears all water logs in the database.
 */
export async function clearAllWaterLogsInDb(): Promise<boolean> {
  const db = await getDatabase();
  if (!db) return false;

  try {
    await db.runAsync('DELETE FROM water_logs;');
    return true;
  } catch (error) {
    console.error('[SQLite] Error clearing all water logs:', error);
    return false;
  }
}

/**
 * Retrieves all individual water logs for a given date, newest first.
 */
export async function getWaterLogsForDateFromDb(dateKey: string): Promise<WaterLog[]> {
  const db = await getDatabase();
  if (!db) return [];

  try {
    const rows = await db.getAllAsync<RawWaterLogRow>(
      'SELECT id, amount_ml, timestamp, date_key, reminder_id FROM water_logs WHERE date_key = ? ORDER BY timestamp DESC;',
      [dateKey]
    );

    return rows.map((r) => ({
      id: r.id,
      amountMl: r.amount_ml,
      timestamp: r.timestamp,
      dateKey: r.date_key,
      reminderId: r.reminder_id,
    }));
  } catch (error) {
    console.error(`[SQLite] Error fetching logs for date ${dateKey}:`, error);
    return [];
  }
}

/**
 * Aggregates daily water totals for a date range (inclusive), grouped by date_key.
 */
export async function getDailyTotalsRangeFromDb(
  startDateKey: string,
  endDateKey: string
): Promise<DailyTotalRow[]> {
  const db = await getDatabase();
  if (!db) return [];

  try {
    const rows = await db.getAllAsync<RawDailyTotalRow>(
      `SELECT date_key, SUM(amount_ml) as total_ml, COUNT(id) as drink_count
       FROM water_logs
       WHERE date_key BETWEEN ? AND ?
       GROUP BY date_key
       ORDER BY date_key ASC;`,
      [startDateKey, endDateKey]
    );

    return rows.map((r) => ({
      dateKey: r.date_key,
      totalMl: r.total_ml ?? 0,
      drinkCount: r.drink_count ?? 0,
    }));
  } catch (error) {
    console.error('[SQLite] Error fetching daily totals range:', error);
    return [];
  }
}

/**
 * Aggregates all daily water totals in SQLite, ordered chronologically.
 * Used for historical streak calculation.
 */
export async function getAllDailyTotalsFromDb(): Promise<DailyTotalRow[]> {
  const db = await getDatabase();
  if (!db) return [];

  try {
    const rows = await db.getAllAsync<RawDailyTotalRow>(
      `SELECT date_key, SUM(amount_ml) as total_ml, COUNT(id) as drink_count
       FROM water_logs
       GROUP BY date_key
       ORDER BY date_key ASC;`
    );

    return rows.map((r) => ({
      dateKey: r.date_key,
      totalMl: r.total_ml ?? 0,
      drinkCount: r.drink_count ?? 0,
    }));
  } catch (error) {
    console.error('[SQLite] Error fetching all daily totals:', error);
    return [];
  }
}

/**
 * Retrieves today's summary metrics and logs.
 */
export async function getTodaySummaryFromDb(
  todayDateKey: string,
  dailyGoal: number
): Promise<{
  consumedMl: number;
  goalMl: number;
  percentage: number;
  remainingMl: number;
  drinkCount: number;
  logs: WaterLog[];
}> {
  const logs = await getWaterLogsForDateFromDb(todayDateKey);
  const consumedMl = logs.reduce((acc, curr) => acc + curr.amountMl, 0);
  const goalMl = dailyGoal > 0 ? dailyGoal : 2500;
  const percentage = Math.round((consumedMl / goalMl) * 100);
  const remainingMl = Math.max(0, goalMl - consumedMl);

  return {
    consumedMl,
    goalMl,
    percentage,
    remainingMl,
    drinkCount: logs.length,
    logs,
  };
}
