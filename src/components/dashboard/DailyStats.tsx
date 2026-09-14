import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { UnitPreference } from '../../types';
import { formatVolume } from '../../utils/unitUtils';

interface DailyStatsProps {
  intakeMl: number;
  goalMl: number;
  drinkCount: number;
  currentStreak: number;
  unit?: UnitPreference;
}

export function DailyStats({
  intakeMl,
  goalMl: _goalMl,
  drinkCount,
  currentStreak,
  unit = 'ml',
}: DailyStatsProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.statCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          Shadows.sm,
        ]}
      >
        <View style={styles.statIconWrap}>
          <Ionicons name="water-outline" size={18} color={colors.primary} />
        </View>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {formatVolume(intakeMl, unit)}
        </Text>
        <Text style={[styles.statTitle, { color: colors.textMuted }]}>Consumed</Text>
      </View>

      <View
        style={[
          styles.statCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          Shadows.sm,
        ]}
      >
        <View style={styles.statIconWrap}>
          <Ionicons name="wine-outline" size={18} color="#10B981" />
        </View>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {drinkCount} {drinkCount === 1 ? 'drink' : 'drinks'}
        </Text>
        <Text style={[styles.statTitle, { color: colors.textMuted }]}>Today</Text>
      </View>

      <View
        style={[
          styles.statCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          Shadows.sm,
        ]}
      >
        <View style={styles.statIconWrap}>
          <Ionicons name="flame" size={18} color="#F59E0B" />
        </View>
        <Text style={[styles.statValue, { color: colors.text }]}>
          {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
        </Text>
        <Text style={[styles.statTitle, { color: colors.textMuted }]}>Streak</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  statCard: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconWrap: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'center',
  },
  statTitle: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});
