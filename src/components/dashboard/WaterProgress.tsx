import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { UnitPreference } from '../../types';
import { formatVolume } from '../../utils/unitUtils';

interface WaterProgressProps {
  currentMl: number;
  goalMl: number;
  unit?: UnitPreference;
}

export function WaterProgress({ currentMl, goalMl, unit = 'ml' }: WaterProgressProps) {
  const { colors, isDark } = useTheme();

  const safeGoal = goalMl > 0 ? goalMl : 2500;
  const actualPercentage = Math.round((currentMl / safeGoal) * 100);
  const visualPercentage = Math.min(100, actualPercentage);
  const remainingMl = Math.max(0, safeGoal - currentMl);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        Shadows.md,
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.textSecondary }]}>Today&apos;s Water</Text>
          <View style={[styles.badge, { backgroundColor: colors.badge }]}>
            <Ionicons name="water" size={14} color={colors.primary} />
            <Text style={[styles.badgeText, { color: colors.badgeText }]}>Daily Progress</Text>
          </View>
        </View>
      </View>

      {/* Center Circular/Dial Progress Visualization */}
      <View style={styles.progressSection}>
        <View
          style={[
            styles.outerCircle,
            {
              borderColor: colors.borderLight,
              backgroundColor: isDark ? '#0C172B' : '#F0F9FF',
            },
          ]}
        >
          {/* Active Liquid Fill Indicator */}
          <View
            style={[
              styles.liquidFill,
              {
                height: `${Math.max(6, visualPercentage)}%`,
                backgroundColor: colors.waterFill,
                opacity: isDark ? 0.35 : 0.25,
              },
            ]}
          />

          <View style={styles.centerContent}>
            <Text style={[styles.percentageText, { color: colors.text }]}>
              {actualPercentage}%
            </Text>
            <Text style={[styles.amountText, { color: colors.primary }]}>
              {formatVolume(currentMl, unit)} / {formatVolume(safeGoal, unit)}
            </Text>
            <View style={styles.statusPill}>
              <Text style={[styles.statusLabel, { color: colors.textMuted }]}>
                {actualPercentage >= 100 ? 'Goal Met 🎉' : `${formatVolume(remainingMl, unit)} remaining`}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Progress Bar Track */}
      <View style={styles.barContainer}>
        <View style={[styles.barTrack, { backgroundColor: colors.surfaceElevated }]}>
          <View
            style={[
              styles.barFill,
              {
                width: `${visualPercentage}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* Stats Footer */}
      <View style={styles.statsFooter}>
        <View style={styles.statItem}>
          <Text style={[styles.statSub, { color: colors.textMuted }]}>Remaining</Text>
          <Text style={[styles.statVal, { color: colors.text }]}>
            {formatVolume(remainingMl, unit)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={[styles.statSub, { color: colors.textMuted }]}>Daily Target</Text>
          <Text style={[styles.statVal, { color: colors.text }]}>
            {formatVolume(safeGoal, unit)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  outerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  liquidFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  percentageText: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  statusPill: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  barContainer: {
    paddingHorizontal: Spacing.xs,
    marginTop: Spacing.xs,
  },
  barTrack: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  statsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  statItem: {
    alignItems: 'center',
  },
  statSub: {
    fontSize: 12,
    marginBottom: 2,
  },
  statVal: {
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
});
