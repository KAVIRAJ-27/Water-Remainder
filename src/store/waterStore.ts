import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WaterLog, DailyHistoryRecord } from '../types';

export const getTodayDateKey = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const INITIAL_HISTORY: DailyHistoryRecord[] = [
  {
    id: 'hist-1',
    dayLabel: 'Today',
    dateKey: getTodayDateKey(),
    consumedMl: 1500,
    goalMl: 2500,
    percentage: 60,
  },
  {
    id: 'hist-2',
    dayLabel: 'Yesterday',
    dateKey: '2026-09-13',
    consumedMl: 2600,
    goalMl: 2500,
    percentage: 104,
  },
  {
    id: 'hist-3',
    dayLabel: 'Saturday',
    dateKey: '2026-09-12',
    consumedMl: 2300,
    goalMl: 2500,
    percentage: 92,
  },
  {
    id: 'hist-4',
    dayLabel: 'Friday',
    dateKey: '2026-09-11',
    consumedMl: 2500,
    goalMl: 2500,
    percentage: 100,
  },
  {
    id: 'hist-5',
    dayLabel: 'Thursday',
    dateKey: '2026-09-10',
    consumedMl: 1900,
    goalMl: 2500,
    percentage: 76,
  },
  {
    id: 'hist-6',
    dayLabel: 'Wednesday',
    dateKey: '2026-09-09',
    consumedMl: 2400,
    goalMl: 2500,
    percentage: 96,
  },
  {
    id: 'hist-7',
    dayLabel: 'Tuesday',
    dateKey: '2026-09-08',
    consumedMl: 2700,
    goalMl: 2500,
    percentage: 108,
  },
];

const INITIAL_LOGS: WaterLog[] = [
  {
    id: 'log-1',
    amountMl: 500,
    timestamp: Date.now() - 3 * 3600 * 1000,
    dateKey: getTodayDateKey(),
  },
  {
    id: 'log-2',
    amountMl: 500,
    timestamp: Date.now() - 2 * 3600 * 1000,
    dateKey: getTodayDateKey(),
  },
  {
    id: 'log-3',
    amountMl: 500,
    timestamp: Date.now() - 45 * 60 * 1000,
    dateKey: getTodayDateKey(),
  },
];

interface WaterState {
  todayConsumed: number;
  drinkCount: number;
  todayLogs: WaterLog[];
  weeklyHistory: DailyHistoryRecord[];

  addWater: (amountMl: number) => { success: boolean; error?: string };
  removeWaterLog: (id: string) => void;
  clearTodayData: () => void;
  clearHistory: () => void;
  resetWaterStore: () => void;
}

export const useWaterStore = create<WaterState>()(
  persist(
    (set) => ({
      todayConsumed: 1500,
      drinkCount: 3,
      todayLogs: INITIAL_LOGS,
      weeklyHistory: INITIAL_HISTORY,

      addWater: (amountMl: number) => {
        if (!amountMl || amountMl <= 0 || isNaN(amountMl)) {
          return { success: false, error: 'Amount must be greater than 0 ml' };
        }

        const validAmount = Math.round(amountMl);
        const newLog: WaterLog = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          amountMl: validAmount,
          timestamp: Date.now(),
          dateKey: getTodayDateKey(),
        };

        set((state) => {
          const updatedConsumed = state.todayConsumed + validAmount;
          const updatedLogs = [newLog, ...state.todayLogs];
          const updatedCount = state.drinkCount + 1;

          // Also keep "Today" item in weeklyHistory synchronized
          const updatedHistory = state.weeklyHistory.map((item) => {
            if (item.dayLabel === 'Today') {
              const goal = item.goalMl > 0 ? item.goalMl : 2500;
              return {
                ...item,
                consumedMl: updatedConsumed,
                percentage: Math.round((updatedConsumed / goal) * 100),
              };
            }
            return item;
          });

          return {
            todayConsumed: updatedConsumed,
            drinkCount: updatedCount,
            todayLogs: updatedLogs,
            weeklyHistory: updatedHistory,
          };
        });

        return { success: true };
      },

      removeWaterLog: (id: string) => {
        set((state) => {
          const target = state.todayLogs.find((l) => l.id === id);
          if (!target) return state;

          const updatedConsumed = Math.max(0, state.todayConsumed - target.amountMl);
          const updatedLogs = state.todayLogs.filter((l) => l.id !== id);
          const updatedCount = Math.max(0, state.drinkCount - 1);

          const updatedHistory = state.weeklyHistory.map((item) => {
            if (item.dayLabel === 'Today') {
              const goal = item.goalMl > 0 ? item.goalMl : 2500;
              return {
                ...item,
                consumedMl: updatedConsumed,
                percentage: Math.round((updatedConsumed / goal) * 100),
              };
            }
            return item;
          });

          return {
            todayConsumed: updatedConsumed,
            drinkCount: updatedCount,
            todayLogs: updatedLogs,
            weeklyHistory: updatedHistory,
          };
        });
      },

      clearTodayData: () =>
        set((state) => ({
          todayConsumed: 0,
          drinkCount: 0,
          todayLogs: [],
          weeklyHistory: state.weeklyHistory.map((item) =>
            item.dayLabel === 'Today'
              ? { ...item, consumedMl: 0, percentage: 0 }
              : item
          ),
        })),

      clearHistory: () =>
        set((state) => ({
          weeklyHistory: state.weeklyHistory.filter((item) => item.dayLabel === 'Today'),
        })),

      resetWaterStore: () =>
        set({
          todayConsumed: 0,
          drinkCount: 0,
          todayLogs: [],
          weeklyHistory: INITIAL_HISTORY.map((item) =>
            item.dayLabel === 'Today' ? { ...item, consumedMl: 0, percentage: 0 } : item
          ),
        }),
    }),
    {
      name: 'hydro-water-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
