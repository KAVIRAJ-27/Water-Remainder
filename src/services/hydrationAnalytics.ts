import { getOffsetDateKey, getTodayDateKey } from '../utils/dateUtils';

export interface DailyDataPoint {
  dateKey: string;
  dayLabel: string;
  shortDay: string;
  consumedMl: number;
  goalMl: number;
  percentage: number;
  drinkCount: number;
}

export interface BestDayInfo {
  dateKey: string;
  dayLabel: string;
  totalMl: number;
  percentage: number;
}

/**
 * Calculates hydration completion percentage.
 */
export function calculateCompletionPercentage(consumedMl: number, goalMl: number): number {
  if (!goalMl || goalMl <= 0) return 0;
  return Math.round((consumedMl / goalMl) * 100);
}

/**
 * Calculates average daily intake across a fixed period (defaults to 7 days).
 * Includes zero-consumption days so the user sees an honest weekly average.
 */
export function calculateWeeklyAverage(
  dailyTotals: { totalMl: number }[],
  totalDays: number = 7
): number {
  if (totalDays <= 0) return 0;
  const sum = dailyTotals.reduce((acc, curr) => acc + (curr.totalMl || 0), 0);
  return Math.round(sum / totalDays);
}

/**
 * Identifies the best hydration day from a list of daily data points.
 */
export function calculateBestDay(
  days: { dateKey: string; dayLabel: string; totalMl: number }[],
  dailyGoal: number
): BestDayInfo | null {
  if (!days || days.length === 0) return null;

  let best = days[0];
  for (const d of days) {
    if (d.totalMl > best.totalMl) {
      best = d;
    }
  }

  if (best.totalMl <= 0) {
    return null;
  }

  return {
    dateKey: best.dateKey,
    dayLabel: best.dayLabel,
    totalMl: best.totalMl,
    percentage: calculateCompletionPercentage(best.totalMl, dailyGoal),
  };
}

/**
 * Calculates the current active streak in days.
 *
 * Rules:
 * - A day counts if consumed water >= daily goal.
 * - Today only counts if today's goal is already met. If not yet met today,
 *   we check if yesterday met the goal (the streak is still alive from yesterday).
 * - Missing any day breaks the streak.
 */
export function calculateCurrentStreak(
  dailyTotalsMap: Map<string, number>,
  dailyGoal: number,
  todayDateKey: string = getTodayDateKey()
): number {
  if (!dailyGoal || dailyGoal <= 0) return 0;

  const parts = todayDateKey.split('-').map(Number);
  const refDate = new Date(parts[0], parts[1] - 1, parts[2]);

  const todayConsumed = dailyTotalsMap.get(todayDateKey) ?? 0;
  const todayCompleted = todayConsumed >= dailyGoal;

  let streak = 0;
  let offset = -1;

  if (todayCompleted) {
    streak = 1;
  } else {
    // Today not yet met: verify if yesterday met goal
    const yesterdayKey = getOffsetDateKey(-1, refDate);
    const yesterdayConsumed = dailyTotalsMap.get(yesterdayKey) ?? 0;
    if (yesterdayConsumed < dailyGoal) {
      return 0;
    }
  }

  // Iterate backwards from yesterday
  while (true) {
    const checkKey = getOffsetDateKey(offset, refDate);
    const consumed = dailyTotalsMap.get(checkKey) ?? 0;

    if (consumed >= dailyGoal) {
      streak++;
      offset--;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculates the longest streak achieved in recorded history.
 */
export function calculateLongestStreak(
  allTotals: { dateKey: string; totalMl: number }[],
  dailyGoal: number
): number {
  if (!dailyGoal || dailyGoal <= 0 || !allTotals || allTotals.length === 0) {
    return 0;
  }

  // Filter to days meeting goal
  const completedDateSet = new Set<string>();
  for (const item of allTotals) {
    if (item.totalMl >= dailyGoal) {
      completedDateSet.add(item.dateKey);
    }
  }

  if (completedDateSet.size === 0) return 0;

  // Convert to sorted unique Date timestamps
  const sortedDates = Array.from(completedDateSet)
    .map((k) => {
      const parts = k.split('-').map(Number);
      return new Date(parts[0], parts[1] - 1, parts[2]).getTime();
    })
    .sort((a, b) => a - b);

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  let maxStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const diffDays = Math.round((sortedDates[i] - sortedDates[i - 1]) / MS_PER_DAY);
    if (diffDays === 1) {
      currentRun++;
      if (currentRun > maxStreak) {
        maxStreak = currentRun;
      }
    } else if (diffDays > 1) {
      currentRun = 1;
    }
  }

  return maxStreak;
}

/**
 * Calculates how many days the goal was met in a given period (e.g. 5/7 days).
 */
export function calculateGoalCompletionDays(
  dailyTotals: { totalMl: number }[],
  dailyGoal: number
): { completedDays: number; totalDays: number } {
  const totalDays = dailyTotals.length;
  if (totalDays === 0 || !dailyGoal) {
    return { completedDays: 0, totalDays };
  }

  const completedDays = dailyTotals.filter((d) => d.totalMl >= dailyGoal).length;
  return { completedDays, totalDays };
}

/**
 * Calculates daily hydration progress score (0 to 100).
 */
export function calculateHydrationScore(consumedMl: number, goalMl: number): number {
  if (!goalMl || goalMl <= 0) return 0;
  return Math.min(100, Math.round((consumedMl / goalMl) * 100));
}
