import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { UnitPreference } from '../../types';

import { formatVolume } from '../../utils/unitUtils';

interface WaterButtonProps {
  amountMl: number;
  unit?: UnitPreference;
  onPress: (amountMl: number) => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  isPrimary?: boolean;
}

export function WaterButton({
  amountMl,
  unit = 'ml',
  onPress,
  iconName = 'water',
  isPrimary = false,
}: WaterButtonProps) {
  const { colors, isDark } = useTheme();

  const displayLabel = `+${formatVolume(amountMl, unit)}`;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(amountMl)}
      style={[
        styles.button,
        isPrimary
          ? {
              backgroundColor: colors.primary,
              borderColor: colors.primaryLight,
            }
          : {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
        Shadows.sm,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isPrimary
              ? 'rgba(255,255,255,0.2)'
              : isDark
              ? 'rgba(56, 189, 248, 0.15)'
              : '#E0F2FE',
          },
        ]}
      >
        <Ionicons
          name={iconName}
          size={18}
          color={isPrimary ? '#FFFFFF' : colors.primary}
        />
      </View>
      <Text
        style={[
          styles.amountText,
          {
            color: isPrimary ? '#FFFFFF' : colors.text,
          },
        ]}
      >
        {displayLabel}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    gap: 8,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
