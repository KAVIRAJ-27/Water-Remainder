import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { WaterLog } from '../../types';
import { formatDateKeyFull, formatTimeFromTimestamp } from '../../utils/dateUtils';
import { DailyDataPoint } from '../../services/hydrationAnalytics';
import { formatVolume } from '../../utils/unitUtils';

interface DateDetailModalProps {
  visible: boolean;
  datePoint: DailyDataPoint | null;
  logs: WaterLog[];
  unit: 'ml' | 'L';
  onClose: () => void;
  onDeleteLog: (logId: string) => Promise<void>;
}

export function DateDetailModal({
  visible,
  datePoint,
  logs,
  unit,
  onClose,
  onDeleteLog,
}: DateDetailModalProps) {
  const { colors, isDark } = useTheme();

  if (!datePoint) return null;

  const isGoalMet = datePoint.percentage >= 100;

  const handleDeleteConfirm = (logId: string, amount: number) => {
    Alert.alert(
      'Delete Drink Log',
      `Are you sure you want to remove this ${formatVolume(amount)} drink entry?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteLog(logId),
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                Shadows.md,
              ]}
            >
              {/* Header */}
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: colors.text }]}>
                    {formatDateKeyFull(datePoint.dateKey)}
                  </Text>
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {datePoint.drinkCount} {datePoint.drinkCount === 1 ? 'drink' : 'drinks'} logged
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.closeButton, { backgroundColor: colors.surfaceElevated }]}
                >
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Summary Stats Box */}
              <View
                style={[
                  styles.summaryBox,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                ]}
              >
                <View style={styles.statColumn}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Intake</Text>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {formatVolume(datePoint.consumedMl)}
                  </Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statColumn}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Goal</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {formatVolume(datePoint.goalMl)}
                  </Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statColumn}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Progress</Text>
                  <Text
                    style={[
                      styles.statValue,
                      { color: isGoalMet ? colors.success : colors.warning },
                    ]}
                  >
                    {datePoint.percentage}%
                  </Text>
                </View>
              </View>

              {/* Individual Drinks List */}
              <Text style={[styles.listHeader, { color: colors.text }]}>Recorded Drinks</Text>

              <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
                {logs.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <Ionicons name="water-outline" size={32} color={colors.textMuted} />
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                      No drink entries recorded for this date.
                    </Text>
                  </View>
                ) : (
                  logs.map((log) => (
                    <View
                      key={log.id}
                      style={[
                        styles.logRow,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.logLeft}>
                        <View
                          style={[
                            styles.cupIconWrap,
                            {
                              backgroundColor: isDark
                                ? 'rgba(56, 189, 248, 0.15)'
                                : '#E0F2FE',
                            },
                          ]}
                        >
                          <Ionicons name="water" size={16} color={colors.primary} />
                        </View>
                        <View>
                          <Text style={[styles.logAmount, { color: colors.text }]}>
                            +{formatVolume(log.amountMl)}
                          </Text>
                          <Text style={[styles.logTime, { color: colors.textSecondary }]}>
                            {formatTimeFromTimestamp(log.timestamp)}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleDeleteConfirm(log.id, log.amountMl)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={styles.deleteButton}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '80%',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBox: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: 'rgba(150,150,150,0.2)',
  },
  listHeader: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },
  scrollList: {
    maxHeight: 260,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: 6,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cupIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  logTime: {
    fontSize: 11,
  },
  deleteButton: {
    padding: 6,
  },
});
