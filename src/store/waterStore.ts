import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WaterLog } from '../types';
import {
  insertWaterLogInDb,
  deleteWaterLogInDb,
  clearDateLogsInDb,
  clearAllWaterLogsInDb,
  getTodaySummaryFromDb,
  getDailyTotalsRangeFromDb,
  getAllDailyTotalsFromDb,
  getWaterLogsForDateFromDb,
} from '../database/waterRepo';
import { getTodayDateKey, getWeekDates, getLastNDaysDateKeys, formatDateKeyToDisplay } from '../utils/dateUtils';
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  calculateWeeklyAverage,
  calculateBestDay,
  BestDayInfo,
  DailyDataPoint,
} from '../services/hydrationAnalytics';

interface WaterState {
  todayConsumed: number;
  drinkCount: number;
  todayLogs: WaterLog[];
  isLoaded: boolean;

  // Analytics cache
  currentStreak: number;
  longestStreak: number;
  weeklyAverage: number;
  bestDay: BestDayInfo | null;
  weeklyChartDays: DailyDataPoint[];
  historyRecords: DailyDataPoint[];

  // Actions
  loadTodayData: (dailyGoal?: number) => Promise<void>;
  loadAnalytics: (dailyGoal: number, filterDays?: number) => Promise<void>;
  addWater: (amountMl: number, dailyGoal?: number, reminderId?: string) => Promise<{ success: boolean; error?: string }>;
  removeWaterLog: (id: string, dailyGoal?: number) => Promise<void>;
  getLogsForSelectedDate: (dateKey: string) => Promise<WaterLog[]>;
  clearTodayData: (dailyGoal?: number) => Promise<void>;
  clearHistory: (dailyGoal?: number) => Promise<void>;
  resetWaterStore: () => Promise<void>;
}

export const useWaterStore = create<WaterState>()(
  persist(
    (set, get) => ({
      todayConsumed: 0,
      drinkCount: 0,
      todayLogs: [],
      isLoaded: false,

      currentStreak: 0,
      longestStreak: 0,
      weeklyAverage: 0,
      bestDay: null,
      weeklyChartDays: [],
      historyRecords: [],

      loadTodayData: async (dailyGoal: number = 2500) => {
        try {
          const todayKey = getTodayDateKey();
          const summary = await getTodaySummaryFromDb(todayKey, dailyGoal);

          if (summary.logs.length > 0 || summary.consumedMl > 0) {
            set({
              todayConsumed: summary.consumedMl,
              drinkCount: summary.drinkCount,
              todayLogs: summary.logs,
              isLoaded: true,
            });
          } else {
            // Check if existing state already has valid logs for today
            const existingTodayLogs = get().todayLogs.filter((l) => l.dateKey === todayKey);
            if (existingTodayLogs.length > 0) {
              // Sync memory logs to SQLite
              for (const l of existingTodayLogs) {
                await insertWaterLogInDb(l);
              }
              const reSummary = await getTodaySummaryFromDb(todayKey, dailyGoal);
              set({
                todayConsumed: reSummary.consumedMl,
                drinkCount: reSummary.drinkCount,
                todayLogs: reSummary.logs,
                isLoaded: true,
              });
            } else {
              set({
                todayConsumed: 0,
                drinkCount: 0,
                todayLogs: [],
                isLoaded: true,
              });
            }
          }

          // Also refresh streaks
          await get().loadAnalytics(dailyGoal, 7);
        } catch (error) {
          console.error('[WaterStore] Failed to load today data:', error);
          set({ isLoaded: true });
        }
      },

  loadAnalytics: async (dailyGoal: number, filterDays: number = 7) => {
    try {
      const todayKey = getTodayDateKey();
      const goal = dailyGoal > 0 ? dailyGoal : 2500;

      // 1. Weekly chart (Monday through Sunday)
      const weekInfos = getWeekDates(new Date());
      const mondayKey = weekInfos[0].dateKey;
      const sundayKey = weekInfos[6].dateKey;

      const [weekTotals, filterDateTotals, allTotals] = await Promise.all([
        getDailyTotalsRangeFromDb(mondayKey, sundayKey),
        getDailyTotalsRangeFromDb(getLastNDaysDateKeys(filterDays)[0], todayKey),
        getAllDailyTotalsFromDb(),
      ]);

      const weekMap = new Map<string, number>(weekTotals.map((t) => [t.dateKey, t.totalMl]));
      const weeklyChartDays: DailyDataPoint[] = weekInfos.map((w) => {
        const consumed = weekMap.get(w.dateKey) ?? 0;
        return {
          dateKey: w.dateKey,
          dayLabel: w.dayLabel,
          shortDay: w.shortDay,
          consumedMl: consumed,
          goalMl: goal,
          percentage: Math.round((consumed / goal) * 100),
          drinkCount: weekTotals.find((t) => t.dateKey === w.dateKey)?.drinkCount ?? 0,
        };
      });

      // 2. Timeline history records (for selected filterDays e.g. 7 or 30 days, newest first)
      const filterKeys = getLastNDaysDateKeys(filterDays).reverse();
      const filterMap = new Map<string, { totalMl: number; count: number }>(
        filterDateTotals.map((t) => [t.dateKey, { totalMl: t.totalMl, count: t.drinkCount }])
      );

      const historyRecords: DailyDataPoint[] = filterKeys.map((k) => {
        const item = filterMap.get(k);
        const consumed = item?.totalMl ?? 0;
        return {
          dateKey: k,
          dayLabel: formatDateKeyToDisplay(k, todayKey),
          shortDay: k.substring(5),
          consumedMl: consumed,
          goalMl: goal,
          percentage: Math.round((consumed / goal) * 100),
          drinkCount: item?.count ?? 0,
        };
      });

      // 3. Analytics metrics
      const weeklyAverage = calculateWeeklyAverage(weeklyChartDays.map((d) => ({ totalMl: d.consumedMl })), 7);
      const bestDay = calculateBestDay(
        weeklyChartDays.map((d) => ({ dateKey: d.dateKey, dayLabel: d.dayLabel, totalMl: d.consumedMl })),
        goal
      );

      // 4. Streaks
      const allDailyMap = new Map<string, number>(allTotals.map((t) => [t.dateKey, t.totalMl]));
      // Ensure today's in-memory consumption is represented in map
      allDailyMap.set(todayKey, get().todayConsumed);

      const currentStreak = calculateCurrentStreak(allDailyMap, goal, todayKey);
      const longestStreak = calculateLongestStreak(
        allTotals.map((t) => (t.dateKey === todayKey ? { ...t, totalMl: get().todayConsumed } : t)),
        goal
      );

      set({
        weeklyChartDays,
        historyRecords,
        weeklyAverage,
        bestDay,
        currentStreak,
        longestStreak: Math.max(longestStreak, currentStreak),
      });
    } catch (error) {
      console.error('[WaterStore] Failed to load analytics:', error);
    }
  },

  addWater: async (amountMl: number, dailyGoal: number = 2500, reminderId?: string) => {
    if (!amountMl || amountMl <= 0 || isNaN(amountMl)) {
      return { success: false, error: 'Amount must be greater than 0 ml' };
    }

    const validAmount = Math.round(amountMl);
    const todayKey = getTodayDateKey();
    const newLog: WaterLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      amountMl: validAmount,
      timestamp: Date.now(),
      dateKey: todayKey,
      reminderId: reminderId ?? null,
    };

    // 1. Insert into SQLite
    await insertWaterLogInDb(newLog);

    // 2. Update local state
    const newConsumed = get().todayConsumed + validAmount;
    const newCount = get().drinkCount + 1;
    const newLogs = [newLog, ...get().todayLogs];

    set({
      todayConsumed: newConsumed,
      drinkCount: newCount,
      todayLogs: newLogs,
    });

    // 3. Refresh analytics
    await get().loadAnalytics(dailyGoal);

    return { success: true };
  },

  removeWaterLog: async (id: string, dailyGoal: number = 2500) => {
    const target = get().todayLogs.find((l) => l.id === id);

    // 1. Delete from SQLite
    await deleteWaterLogInDb(id);

    // 2. Update local today state if it belonged to today
    if (target) {
      const updatedConsumed = Math.max(0, get().todayConsumed - target.amountMl);
      const updatedLogs = get().todayLogs.filter((l) => l.id !== id);
      const updatedCount = Math.max(0, get().drinkCount - 1);

      set({
        todayConsumed: updatedConsumed,
        drinkCount: updatedCount,
        todayLogs: updatedLogs,
      });
    }

    // 3. Recompute analytics
    await get().loadAnalytics(dailyGoal);
  },

  getLogsForSelectedDate: async (dateKey: string) => {
    return await getWaterLogsForDateFromDb(dateKey);
  },

  clearTodayData: async (dailyGoal: number = 2500) => {
    const todayKey = getTodayDateKey();
    await clearDateLogsInDb(todayKey);
    set({
      todayConsumed: 0,
      drinkCount: 0,
      todayLogs: [],
    });
    await get().loadAnalytics(dailyGoal);
  },

  clearHistory: async (dailyGoal: number = 2500) => {
    // Keeps today's data, clears older days
    const todayKey = getTodayDateKey();
    const all = await getAllDailyTotalsFromDb();
    for (const row of all) {
      if (row.dateKey !== todayKey) {
        await clearDateLogsInDb(row.dateKey);
      }
    }
    await get().loadAnalytics(dailyGoal);
  },

  resetWaterStore: async () => {
    await clearAllWaterLogsInDb();
    set({
      todayConsumed: 0,
      drinkCount: 0,
      todayLogs: [],
      currentStreak: 0,
      longestStreak: 0,
      weeklyAverage: 0,
      bestDay: null,
      weeklyChartDays: [],
      historyRecords: [],
    });
  },
}),
    {
      name: 'hydroreminder-water-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        todayConsumed: state.todayConsumed,
        drinkCount: state.drinkCount,
        todayLogs: state.todayLogs,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
      }),
    }
  )
);
