import { ReminderItem } from '../types';

/**
 * Parses any standard 12-hour (e.g. "08:00 AM") or 24-hour (e.g. "08:00", "20:30")
 * time string into total minutes from midnight (0 to 1439).
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;

  const trimmed = timeStr.trim();
  const is12Hour = /am|pm/i.test(trimmed);

  if (is12Hour) {
    const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    if (!match) return 0;

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toLowerCase();

    if (hours === 12) {
      hours = period === 'am' ? 0 : 12;
    } else if (period === 'pm') {
      hours += 12;
    }

    return Math.min(1439, Math.max(0, hours * 60 + minutes));
  } else {
    const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return 0;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);

    return Math.min(1439, Math.max(0, hours * 60 + minutes));
  }
}

/**
 * Converts total minutes from midnight into a formatted 12-hour or 24-hour string.
 */
export function minutesToTimeString(totalMinutes: number, use12Hour: boolean = true): string {
  const safeMinutes = Math.min(1439, Math.max(0, Math.floor(totalMinutes)));
  const hours24 = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  const mm = String(minutes).padStart(2, '0');

  if (!use12Hour) {
    const hh = String(hours24).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  const period = hours24 >= 12 ? 'PM' : 'AM';
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;
  const hh = String(hours12).padStart(2, '0');

  return `${hh}:${mm} ${period}`;
}

/**
 * Normalizes any time string into 12-hour AM/PM format (e.g. "08:00 AM").
 */
export function formatTime12Hour(timeStr: string): string {
  const minutes = parseTimeToMinutes(timeStr);
  return minutesToTimeString(minutes, true);
}

/**
 * Normalizes any time string into 24-hour format (e.g. "08:00", "20:00").
 */
export function formatTime24Hour(timeStr: string): string {
  const minutes = parseTimeToMinutes(timeStr);
  return minutesToTimeString(minutes, false);
}

/**
 * Compares two time strings chronologically.
 * Returns negative if timeA < timeB, 0 if equal, positive if timeA > timeB.
 */
export function compareTimes(timeA: string, timeB: string): number {
  return parseTimeToMinutes(timeA) - parseTimeToMinutes(timeB);
}

/**
 * Validates that start time is strictly before end time within the same day.
 */
export function isValidTimeRange(
  startTime: string,
  endTime: string
): { valid: boolean; error?: string } {
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);

  if (startMin >= endMin) {
    return {
      valid: false,
      error: 'End time must be later than start time.',
    };
  }

  return { valid: true };
}

/**
 * Checks if a reminder time already exists in the given list to prevent duplicates.
 */
export function isDuplicateTime(
  existingReminders: { time: string; id?: string }[],
  newTime: string,
  currentId?: string
): boolean {
  const targetMinutes = parseTimeToMinutes(newTime);
  return existingReminders.some((item) => {
    if (currentId && item.id === currentId) return false;
    return parseTimeToMinutes(item.time) === targetMinutes;
  });
}

/**
 * Generates an array of ReminderItems at fixed intervals between start and end times.
 *
 * Example:
 * start = "08:00 AM", end = "11:00 AM", interval = 60, amount = 250
 * Output: 08:00 AM, 09:00 AM, 10:00 AM, 11:00 AM
 */
export function generateIntervalReminders(
  startTime: string,
  endTime: string,
  intervalMinutes: number,
  amountMl: number
): { success: boolean; reminders?: ReminderItem[]; error?: string } {
  const rangeCheck = isValidTimeRange(startTime, endTime);
  if (!rangeCheck.valid) {
    return { success: false, error: rangeCheck.error };
  }

  if (!intervalMinutes || intervalMinutes <= 0) {
    return { success: false, error: 'Interval must be greater than 0 minutes.' };
  }

  if (!amountMl || amountMl <= 0) {
    return { success: false, error: 'Water amount must be greater than 0 ml.' };
  }

  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);

  const reminders: ReminderItem[] = [];
  const MAX_REMINDERS = 50; // Safety guard to prevent runaway loops

  let currentMin = startMin;
  let count = 0;

  while (currentMin <= endMin && count < MAX_REMINDERS) {
    const timeFormatted = minutesToTimeString(currentMin, true);
    reminders.push({
      id: `rem-gen-${currentMin}-${Date.now()}-${count}`,
      time: timeFormatted,
      amountMl: Math.round(amountMl),
      isEnabled: true,
    });

    currentMin += intervalMinutes;
    count++;
  }

  return { success: true, reminders };
}
