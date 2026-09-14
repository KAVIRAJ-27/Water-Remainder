import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { DailyDataPoint } from '../../services/hydrationAnalytics';
import { getTodayDateKey } from '../../utils/dateUtils';
import { formatVolume } from '../../utils/unitUtils';

interface WeeklyWaterChartProps {
  days: DailyDataPoint[];
  dailyGoal: number;
  unit: 'ml' | 'L';
}

export function WeeklyWaterChart({ days, dailyGoal, unit }: WeeklyWaterChartProps) {
  const { colors } = useTheme();
  const todayKey = getTodayDateKey();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        Shadows.sm,
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Weekly Hydration</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Target: {formatVolume(dailyGoal)} / day
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: colors.badge }]}>
          <Ionicons name="calendar-outline" size={13} color={colors.primary} />
          <Text style={[styles.badgeText, { color: colors.badgeText }]}>Mon – Sun</Text>
        </View>
      </View>

      {/* Target reference dashed line indicator */}
      <View style={styles.targetIndicatorRow}>
        <View style={[styles.targetLine, { borderColor: colors.border }]} />
        <Text style={[styles.targetLabel, { color: colors.textMuted }]}>
          Goal: {formatVolume(dailyGoal)}
        </Text>
      </View>

      {/* 7-Day Columns */}
      <View style={styles.barsContainer}>
        {days.map((item) => {
          const isToday = item.dateKey === todayKey;
          const isGoalMet = item.percentage >= 100;
          // Visual fill clamped between 4% minimum (so bar is visible) and 100% max
          const fillPercent = Math.min(100, Math.max(item.consumedMl > 0 ? 8 : 2, item.percentage));

          return (
            <View key={item.dateKey} style={styles.barColumn}>
              {/* Value or percentage at top */}
              <Text
                style={[
                  styles.barValueText,
                  {
                    color: isGoalMet ? colors.success : colors.textMuted,
                    fontWeight: isGoalMet ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {item.percentage > 0 ? `${item.percentage}%` : '0%'}
              </Text>

              {/* Bar track and fill */}
              <View
                style={[
                  styles.barTrack,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: isToday ? colors.primary : 'transparent',
                    borderWidth: isToday ? 1 : 0,
                  },
                ]}
              >
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${fillPercent}%`,
                      backgroundColor: isGoalMet
                        ? colors.success
                        : item.consumedMl > 0
                        ? colors.primary
                        : 'transparent',
                    },
                  ]}
                />
              </View>

              {/* Day label */}
              <Text
                style={[
                  styles.dayLabel,
                  {
                    color: isToday ? colors.primary : colors.textSecondary,
                    fontWeight: isToday ? '700' : '500',
                  },
                ]}
              >
                {item.shortDay}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  targetIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xs,
    gap: 6,
  },
  targetLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  targetLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barValueText: {
    fontSize: 10,
    marginBottom: 2,
  },
  barTrack: {
    width: 22,
    flex: 1,
    borderRadius: BorderRadius.full,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: BorderRadius.full,
  },
  dayLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});
