import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Switch,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { BorderRadius, Spacing } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  valueText?: string;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (val: boolean) => void;
  onPress?: () => void;
  isDestructive?: boolean;
  showChevron?: boolean;
}

export function SettingRow({
  icon,
  iconColor,
  title,
  subtitle,
  valueText,
  isSwitch = false,
  switchValue = false,
  onSwitchChange,
  onPress,
  isDestructive = false,
  showChevron = true,
}: SettingRowProps) {
  const { colors, isDark } = useTheme();

  const activeIconColor = isDestructive
    ? colors.danger
    : iconColor || colors.primary;

  const content = (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: colors.borderLight,
        },
      ]}
    >
      <View style={styles.leftSection}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: isDestructive
                ? 'rgba(239, 68, 68, 0.12)'
                : isDark
                ? 'rgba(56, 189, 248, 0.15)'
                : '#E0F2FE',
            },
          ]}
        >
          <Ionicons name={icon} size={20} color={activeIconColor} />
        </View>

        <View style={styles.textCol}>
          <Text
            style={[
              styles.title,
              { color: isDestructive ? colors.danger : colors.text },
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        {valueText && (
          <Text style={[styles.valueText, { color: colors.textSecondary }]}>
            {valueText}
          </Text>
        )}

        {isSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={switchValue ? colors.primary : '#F1F5F9'}
          />
        ) : showChevron && onPress ? (
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        ) : null}
      </View>
    </View>
  );

  if (onPress && !isSwitch) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valueText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
