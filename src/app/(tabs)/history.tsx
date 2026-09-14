import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useWaterStore } from '../../store/waterStore';
import { useUserStore } from '../../store/userStore';
import { BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../../components/EmptyState';
import { WeeklyWaterChart } from '../../components/history/WeeklyWaterChart';
import { DateDetailModal } from '../../components/history/DateDetailModal';
import { DailyDataPoint } from '../../services/hydrationAnalytics';
import { WaterLog } from '../../types';
import { useFocusEffect, useRouter } from 'expo-router';
import { formatVolume as formatVolumeUnit } from '../../utils/unitUtils';

export default function HistoryScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const { dailyGoal, unit } = useUserStore();
  const {
    todayConsumed,
    drinkCount,
    currentStreak,
    longestStreak,
    weeklyAverage,
    bestDay,
    weeklyChartDays,
    historyRecords,
    loadTodayData,
    loadAnalytics,
    getLogsForSelectedDate,
    removeWaterLog,
  } = useWaterStore();

  const [filterDays, setFilterDays] = useState<7 | 30>(7);

  // Date detail drill-down modal state
  const [selectedDatePoint, setSelectedDatePoint] = useState<DailyDataPoint | null>(null);
  const [selectedDateLogs, setSelectedDateLogs] = useState<WaterLog[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  // Reload SQLite analytics whenever screen gains focus or filter/goal changes
  useFocusEffect(
    useCallback(() => {
      loadTodayData(dailyGoal);
      loadAnalytics(dailyGoal, filterDays);
    }, [dailyGoal, filterDays, loadTodayData, loadAnalytics])
  );

  const formatVolume = (ml: number) => formatVolumeUnit(ml, unit);

  const todayPercentage = dailyGoal > 0 ? Math.round((todayConsumed / dailyGoal) * 100) : 0;
  const remainingMl = Math.max(0, dailyGoal - todayConsumed);

  // Goal completed days count in the current week (7 days)
  const completedWeekDays = weeklyChartDays.filter((d) => d.percentage >= 100).length;

  // Hydration score (0-100)
  const hydrationScore = Math.min(100, todayPercentage);

  // Open drill-down modal for date
  const handleSelectDate = async (point: DailyDataPoint) => {
    setSelectedDatePoint(point);
    const logs = await getLogsForSelectedDate(point.dateKey);
    setSelectedDateLogs(logs);
    setModalVisible(true);
  };

  // Delete drink from modal
  const handleDeleteLog = async (logId: string) => {
    await removeWaterLog(logId, dailyGoal);
    if (selectedDatePoint) {
      const refreshedLogs = await getLogsForSelectedDate(selectedDatePoint.dateKey);
      setSelectedDateLogs(refreshedLogs);
      const newTotal = refreshedLogs.reduce((acc, l) => acc + l.amountMl, 0);
      setSelectedDatePoint({
        ...selectedDatePoint,
        consumedMl: newTotal,
        drinkCount: refreshedLogs.length,
        percentage: Math.round((newTotal / selectedDatePoint.goalMl) * 100),
      });
    }
  };

  const hasAnyData = historyRecords.some((r) => r.consumedMl > 0);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Hydration History</Text>
          <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
            Consistency, weekly averages, streaks, and analytics
          </Text>
        </View>

        {/* 1. Filter Switcher (7 Days vs 30 Days) */}
        <View
          style={[
            styles.filterBar,
            { backgroundColor: colors.card, borderColor: colors.border },
            Shadows.sm,
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilterDays(7)}
            style={[
              styles.filterBtn,
              filterDays === 7 && {
                backgroundColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.filterBtnText,
                { color: filterDays === 7 ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              7 Days
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setFilterDays(30)}
            style={[
              styles.filterBtn,
              filterDays === 30 && {
                backgroundColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.filterBtnText,
                { color: filterDays === 30 ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              30 Days
            </Text>
          </TouchableOpacity>
        </View>

        {/* 2. Today's Summary Card */}
        <View
          style={[
            styles.todayCard,
            { backgroundColor: colors.card, borderColor: colors.border },
            Shadows.sm,
          ]}
        >
          <View style={styles.todayCardHeader}>
            <View>
              <Text style={[styles.cardSectionTag, { color: colors.primary }]}>{"TODAY'S SUMMARY"}</Text>
              <Text style={[styles.todayIntakeText, { color: colors.text }]}>
                {formatVolume(todayConsumed)}{' '}
                <Text style={{ fontSize: 14, color: colors.textSecondary, fontWeight: '500' }}>
                  / {formatVolume(dailyGoal)}
                </Text>
              </Text>
            </View>

            <View
              style={[
                styles.todayPercentBadge,
                {
                  backgroundColor:
                    todayPercentage >= 100
                      ? '#DCFCE7'
                      : isDark
                      ? 'rgba(56, 189, 248, 0.15)'
                      : '#E0F2FE',
                },
              ]}
            >
              <Text
                style={[
                  styles.todayPercentText,
                  { color: todayPercentage >= 100 ? '#15803D' : colors.primary },
                ]}
              >
                {todayPercentage}%
              </Text>
            </View>
          </View>

          {/* Sub metrics: Remaining & Drinks */}
          <View
            style={[
              styles.todayMetricsRow,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
            ]}
          >
            <View style={styles.metricItem}>
              <Ionicons name="water-outline" size={16} color={colors.primary} />
              <View>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Remaining</Text>
                <Text style={[styles.metricVal, { color: colors.text }]}>
                  {remainingMl === 0 ? 'Goal Reached! 🎉' : formatVolume(remainingMl)}
                </Text>
              </View>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricItem}>
              <Ionicons name="cafe-outline" size={16} color={colors.primary} />
              <View>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Drinks Logged</Text>
                <Text style={[styles.metricVal, { color: colors.text }]}>
                  {drinkCount} {drinkCount === 1 ? 'drink' : 'drinks'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 3. Streaks & Best Day Row */}
        <View style={styles.statsRow}>
          {/* Current Streak */}
          <View
            style={[
              styles.streakCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              Shadows.sm,
            ]}
          >
            <View style={styles.statIconBadge}>
              <Text style={{ fontSize: 20 }}>🔥</Text>
            </View>
            <Text style={[styles.streakNumber, { color: colors.text }]}>
              {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
            </Text>
            <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>Current Streak</Text>
            <Text style={[styles.streakSub, { color: colors.textMuted }]}>
              Best: {longestStreak} days 🏆
            </Text>
          </View>

          {/* Weekly Average */}
          <View
            style={[
              styles.streakCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              Shadows.sm,
            ]}
          >
            <View style={styles.statIconBadge}>
              <Ionicons name="speedometer-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.streakNumber, { color: colors.text }]}>
              {formatVolume(weeklyAverage)}
            </Text>
            <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>Weekly Average</Text>
            <Text style={[styles.streakSub, { color: colors.textMuted }]}>
              Honest 7-day mean
            </Text>
          </View>
        </View>

        {/* 4. Analytics Highlights: Best Day & Goal Days */}
        <View
          style={[
            styles.highlightsCard,
            { backgroundColor: colors.card, borderColor: colors.border },
            Shadows.sm,
          ]}
        >
          <View style={styles.highlightRow}>
            <Ionicons name="trophy-outline" size={18} color="#F59E0B" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.highlightTitle, { color: colors.text }]}>Best Hydration Day</Text>
              <Text style={[styles.highlightSub, { color: colors.textSecondary }]}>
                {bestDay
                  ? `${bestDay.dayLabel} • ${formatVolume(bestDay.totalMl)} (${bestDay.percentage}%)`
                  : 'Log drinks to reveal your best day'}
              </Text>
            </View>
          </View>

          <View style={[styles.innerDivider, { backgroundColor: colors.border }]} />

          <View style={styles.highlightRow}>
            <Ionicons name="checkmark-done-circle-outline" size={18} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.highlightTitle, { color: colors.text }]}>
                Goal Completed Days
              </Text>
              <Text style={[styles.highlightSub, { color: colors.textSecondary }]}>
                {completedWeekDays} / 7 days reached 100% this week
              </Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.scoreText, { color: colors.primary }]}>
                {hydrationScore}/100
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Weekly Visual Bar Chart */}
        <WeeklyWaterChart days={weeklyChartDays} dailyGoal={dailyGoal} unit={unit} />

        {/* 6. Daily Records Timeline */}
        <View style={styles.recordsSection}>
          <View style={styles.recordsHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Daily Records ({filterDays} Days)
            </Text>
            <Text style={[styles.recordsSub, { color: colors.textSecondary }]}>Tap date to view logs</Text>
          </View>

          {!hasAnyData ? (
            <EmptyState
              icon="calendar-outline"
              title="No Hydration History Yet"
              description="Start drinking water and your real day-by-day progress and analytics will appear here."
              actionTitle="Add First Drink"
              onAction={() => router.replace('/(tabs)')}
            />
          ) : (
            <View style={styles.timelineList}>
              {historyRecords.map((record) => {
                const isMet = record.percentage >= 100;

                return (
                  <TouchableOpacity
                    key={record.dateKey}
                    activeOpacity={0.7}
                    onPress={() => handleSelectDate(record)}
                    style={[
                      styles.recordCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                      Shadows.sm,
                    ]}
                  >
                    <View style={styles.recordHeader}>
                      <View style={styles.recordLeft}>
                        <View
                          style={[
                            styles.dayIconWrap,
                            {
                              backgroundColor: isMet
                                ? '#DCFCE7'
                                : isDark
                                ? 'rgba(56, 189, 248, 0.15)'
                                : '#E0F2FE',
                            },
                          ]}
                        >
                          <Ionicons
                            name={isMet ? 'checkmark' : 'water'}
                            size={18}
                            color={isMet ? '#15803D' : colors.primary}
                          />
                        </View>
                        <View>
                          <Text style={[styles.dayTitle, { color: colors.text }]}>
                            {record.dayLabel}
                          </Text>
                          <Text style={[styles.daySub, { color: colors.textSecondary }]}>
                            {formatVolume(record.consumedMl)} / {formatVolume(record.goalMl)} •{' '}
                            {record.drinkCount} {record.drinkCount === 1 ? 'drink' : 'drinks'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.recordRight}>
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor: isMet
                                ? '#DCFCE7'
                                : isDark
                                ? 'rgba(56, 189, 248, 0.15)'
                                : '#E0F2FE',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.badgeText,
                              { color: isMet ? '#15803D' : colors.primary },
                            ]}
                          >
                            {record.percentage}%
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                      </View>
                    </View>

                    {/* Progress track */}
                    <View style={[styles.recordTrack, { backgroundColor: colors.surfaceElevated }]}>
                      <View
                        style={[
                          styles.recordFill,
                          {
                            width: `${Math.min(100, record.percentage)}%`,
                            backgroundColor: isMet ? colors.success : colors.primary,
                          },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Drill-down date logs modal */}
      <DateDetailModal
        visible={modalVisible}
        datePoint={selectedDatePoint}
        logs={selectedDateLogs}
        unit={unit}
        onClose={() => setModalVisible(false)}
        onDeleteLog={handleDeleteLog}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl + 20,
    gap: Spacing.md,
  },
  header: {
    marginBottom: Spacing.xs,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  filterBar: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    padding: 4,
    borderWidth: 1,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  todayCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
  },
  todayCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  cardSectionTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  todayIntakeText: {
    fontSize: 22,
    fontWeight: '800',
  },
  todayPercentBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
  },
  todayPercentText: {
    fontSize: 13,
    fontWeight: '800',
  },
  todayMetricsRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  metricLabel: {
    fontSize: 11,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  metricDivider: {
    width: 1,
    height: '70%',
    backgroundColor: 'rgba(150,150,150,0.2)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  streakCard: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIconBadge: {
    marginBottom: 6,
  },
  streakNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  streakSub: {
    fontSize: 11,
    marginTop: 4,
  },
  highlightsCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  highlightTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  highlightSub: {
    fontSize: 12,
    marginTop: 1,
  },
  innerDivider: {
    height: 1,
  },
  scoreBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '800',
  },
  recordsSection: {
    gap: Spacing.sm,
  },
  recordsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  recordsSub: {
    fontSize: 12,
  },
  timelineList: {
    gap: Spacing.xs,
  },
  recordCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recordRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  daySub: {
    fontSize: 12,
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  recordTrack: {
    height: 6,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginTop: 4,
  },
  recordFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});
