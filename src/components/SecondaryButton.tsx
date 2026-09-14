import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { BorderRadius, Spacing } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface SecondaryButtonProps {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  danger?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SecondaryButton({
  title,
  onPress,
  icon,
  disabled = false,
  danger = false,
  style,
}: SecondaryButtonProps) {
  const { colors } = useTheme();

  const textColor = danger ? colors.danger : colors.primary;
  const borderColor = danger ? colors.danger : colors.border;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor,
        },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={18} color={textColor} />}
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    gap: 8,
    borderWidth: 1,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
  },
});
