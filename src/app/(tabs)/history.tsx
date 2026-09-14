import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useWaterStore } from '../../store/waterStore';
import { useUserStore } from '../../store/userStore';
import { BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { EmptyState } from '../../components/EmptyState';

export default function HistoryScreen() {
  const { colors, isDark } = useTheme();
  const weeklyHistory = useWaterStore((state) => state.weeklyHistory);
  const unit = useUserStore((state) => state.unit);

  const formatVolume = (ml: number) => {
    if (unit === 'L') {
      return `${(ml / 1000).toFixed(1)} L`;
    }
    return `${ml} ml`;
  };

  // 7-Day Bar Chart calculation
  const chartDays = weeklyHistory.slice(0, 7).reverse();

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
            Review your consistency and weekly hydration progress
          </Text>
        </View>

        {/* 1. Weekly Visual Bar Chart Card */}
        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
            Shadows.sm,
          ]}
        >
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Weekly Overview</Text>
              <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
                Daily goal target: 100%
              </Text>
            </View>
            <View style={[styles.chartBadge, { backgroundColor: colors.badge }]}>
              <Ionicons name="stats-chart" size={14} color={colors.primary} />
              <Text style={[styles.chartBadgeText, { color: colors.badgeText }]}>7 Days</Text>
            </View>
          </View>

          {/* Bars */}
          <View style={styles.barsContainer}>
            {chartDays.map((item) => {
              const clampedPercent = Math.min(100, Math.max(8, item.percentage));
              const isGoalMet = item.percentage >= 100;
              const shortDay = item.dayLabel.substring(0, 3);

              return (
                <View key={item.id} style={styles.barColumn}>
                  <Text style={[styles.barPercent, { color: isGoalMet ? '#10B981' : colors.textMuted }]}>
                    {item.percentage}%
                  </Text>
                  <View
                    style={[
                      styles.barTrack,
                      { backgroundColor: colors.surfaceElevated },
                    ]}
                  >
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${clampedPercent}%`,
                          backgroundColor: isGoalMet ? '#10B981' : colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.barDayLabel,
                      {
                        color: item.dayLabel === 'Today' ? colors.primary : colors.textSecondary,
                        fontWeight: item.dayLabel === 'Today' ? '700' : '500',
                      },
                    ]}
                  >
                    {shortDay}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 2. Daily Records List */}
        <View style={styles.recordsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Daily Records
          </Text>

          {weeklyHistory.length === 0 ? (
            <EmptyState
              icon="calendar-outline"
              title="No History Yet"
              description="Your logged drinks will appear here with day-by-day statistics."
            />
          ) : (
            <View style={styles.timelineList}>
              {weeklyHistory.map((record) => {
                const isMet = record.percentage >= 100;
                return (
                  <View
                    key={record.id}
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
                            {formatVolume(record.consumedMl)} / {formatVolume(record.goalMl)}
                          </Text>
                        </View>
                      </View>

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
                    </View>

                    {/* Progress line */}
                    <View style={[styles.recordTrack, { backgroundColor: colors.surfaceElevated }]}>
                      <View
                        style={[
                          styles.recordFill,
                          {
                            width: `${Math.min(100, record.percentage)}%`,
                            backgroundColor: isMet ? '#10B981' : colors.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
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
  },
  header: {
    marginBottom: Spacing.md,
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
  chartCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  chartSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  chartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  chartBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barPercent: {
    fontSize: 9,
    fontWeight: '700',
  },
  barTrack: {
    width: 14,
    height: 90,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: BorderRadius.full,
  },
  barDayLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  recordsSection: {
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  timelineList: {
    gap: 10,
  },
  recordCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  recordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayIconWrap: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  daySub: {
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
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
  },
  recordFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});
