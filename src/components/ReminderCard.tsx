import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { BorderRadius, Shadows, Spacing } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { ReminderItem, UnitPreference } from '../types';
import { formatVolume } from '../utils/unitUtils';

interface ReminderCardProps {
  reminder: ReminderItem;
  onToggle: (id: string) => void;
  onEdit?: (reminder: ReminderItem) => void;
  onDelete?: (id: string) => void;
  unit?: UnitPreference;
}

export function ReminderCard({
  reminder,
  onToggle,
  onEdit,
  onDelete,
  unit = 'ml',
}: ReminderCardProps) {
  const { colors, isDark } = useTheme();

  const displayAmount = formatVolume(reminder.amountMl, unit);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        Shadows.sm,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onEdit && onEdit(reminder)}
        style={styles.leftSection}
      >
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: reminder.isEnabled
                ? isDark
                  ? 'rgba(56, 189, 248, 0.15)'
                  : '#E0F2FE'
                : colors.surfaceElevated,
            },
          ]}
        >
          <Ionicons
            name={reminder.isEnabled ? 'alarm' : 'alarm-outline'}
            size={22}
            color={reminder.isEnabled ? colors.primary : colors.textMuted}
          />
        </View>

        <View style={styles.infoCol}>
          <View style={styles.timeRow}>
            <Text
              style={[
                styles.timeText,
                {
                  color: reminder.isEnabled ? colors.text : colors.textMuted,
                },
              ]}
            >
              {reminder.time}
            </Text>
            {onEdit && (
              <Ionicons
                name="pencil-outline"
                size={14}
                color={colors.textMuted}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>

          <Text
            style={[
              styles.amountText,
              {
                color: reminder.isEnabled ? colors.primary : colors.textMuted,
              },
            ]}
          >
            {displayAmount}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.rightSection}>
        <Text
          style={[
            styles.statusLabel,
            {
              color: reminder.isEnabled ? colors.primary : colors.textMuted,
            },
          ]}
        >
          {reminder.isEnabled ? 'ON' : 'OFF'}
        </Text>
        <Switch
          value={reminder.isEnabled}
          onValueChange={() => onToggle(reminder.id)}
          trackColor={{ false: colors.border, true: colors.primaryLight }}
          thumbColor={reminder.isEnabled ? colors.primary : '#F1F5F9'}
        />

        {onDelete && (
          <TouchableOpacity
            onPress={() => onDelete(reminder.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xs + 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCol: {
    justifyContent: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  amountText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 28,
  },
  deleteButton: {
    marginLeft: 6,
    padding: 4,
  },
});
