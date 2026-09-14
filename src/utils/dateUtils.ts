/**
 * Date and time utility functions for HydroReminder.
 * Ensures consistent local timezone handling and Monday-start calendar weeks.
 */

/**
 * Returns today's date in YYYY-MM-DD local format.
 */
export function getTodayDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns a date key for N days in the past or future relative to referenceDate.
 */
export function getOffsetDateKey(offsetDays: number, referenceDate: Date = new Date()): string {
  const target = new Date(referenceDate);
  target.setDate(target.getDate() + offsetDays);
  return getTodayDateKey(target);
}

/**
 * Returns an array of date keys for the last N days up to and including today.
 */
export function getLastNDaysDateKeys(n: number, referenceDate: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    keys.push(getOffsetDateKey(-i, referenceDate));
  }
  return keys;
}

export interface WeekDayInfo {
  dateKey: string;
  dayLabel: string; // e.g. "Monday", "Tuesday"
  shortDay: string; // e.g. "Mon", "Tue"
  dayOfMonth: number;
}

/**
 * Returns the 7 days (Monday through Sunday) for the week containing referenceDate.
 */
export function getWeekDates(referenceDate: Date = new Date()): WeekDayInfo[] {
  const day = referenceDate.getDay();
  // In JS: Sunday = 0, Monday = 1, ..., Saturday = 6
  // Distance to Monday:
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() + diffToMonday);

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const shortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const week: WeekDayInfo[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    week.push({
      dateKey: getTodayDateKey(current),
      dayLabel: dayNames[i],
      shortDay: shortNames[i],
      dayOfMonth: current.getDate(),
    });
  }

  return week;
}

/**
 * Formats a date key for user-friendly display: "Today", "Yesterday", or "14 Sep".
 */
export function formatDateKeyToDisplay(
  dateKey: string,
  todayKey: string = getTodayDateKey()
): string {
  if (dateKey === todayKey) return 'Today';

  const yesterdayKey = getOffsetDateKey(-1, new Date());
  if (dateKey === yesterdayKey) return 'Yesterday';

  const parts = dateKey.split('-');
  if (parts.length !== 3) return dateKey;

  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[month]}`;
}

/**
 * Formats a date key into a full human-readable string: e.g. "Monday, September 14".
 */
export function formatDateKeyFull(dateKey: string): string {
  const parts = dateKey.split('-');
  if (parts.length !== 3) return dateKey;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return `${dayNames[d.getDay()]}, ${monthNames[month]} ${day}`;
}

/**
 * Formats an epoch timestamp (ms) to 12-hour AM/PM string, e.g. "08:30 AM".
 */
export function formatTimeFromTimestamp(timestamp: number): string {
  const d = new Date(timestamp);
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12;

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');

  return `${formattedHours}:${formattedMinutes} ${ampm}`;
}
