import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useReminderStore } from '../../store/reminderStore';
import { useUserStore } from '../../store/userStore';
import { ReminderCard } from '../../components/ReminderCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { EmptyState } from '../../components/EmptyState';
import { BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { ReminderItem, ReminderMode } from '../../types';
import {
  formatTime12Hour,
  isValidTimeRange,
} from '../../utils/timeUtils';
import { notificationService } from '../../services/notificationService';
import { formatVolume } from '../../utils/unitUtils';

export default function RemindersScreen() {
  const insets = useSafeAreaInsets();
  const topPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? RNStatusBar.currentHeight ?? 24 : 0
  );
  const { colors, isDark } = useTheme();
  const { unit, dailyGoal } = useUserStore();

  const {
    reminderMode,
    startTime,
    endTime,
    intervalMinutes,
    defaultAmountMl,
    customReminders,
    isLoaded,
    loadReminders,
    setReminderMode,
    updateIntervalSettings,
    generateAndSaveIntervalSchedule,
    toggleReminder,
    addCustomReminder,
    updateReminder,
    deleteCustomReminder,
  } = useReminderStore();

  // Load from SQLite on mount
  useEffect(() => {
    if (!isLoaded) {
      loadReminders();
    }
  }, [isLoaded, loadReminders]);

  // Interval form state
  const [localStart, setLocalStart] = useState<string | null>(null);
  const [localEnd, setLocalEnd] = useState<string | null>(null);
  const [localAmount, setLocalAmount] = useState<string | null>(null);

  const displayStart = localStart ?? startTime;
  const displayEnd = localEnd ?? endTime;
  const displayAmount = localAmount ?? defaultAmountMl.toString();

  // Add / Edit Modal State
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [modalVisible, setModalVisible] = useState(false);
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null);
  const [inputTime, setInputTime] = useState('10:30 AM');
  const [inputAmount, setInputAmount] = useState('250');

  // Daily goal servings calculation (Section 11)
  const servingsEstimated =
    defaultAmountMl > 0 ? Math.round(dailyGoal / defaultAmountMl) : 10;

  // Handle Generate Schedule with Confirmation (Section 18)
  const handleRequestGenerateSchedule = () => {
    const rangeCheck = isValidTimeRange(displayStart, displayEnd);
    if (!rangeCheck.valid) {
      Alert.alert('Invalid Schedule Hours', rangeCheck.error || 'End time must be later than start time.');
      return;
    }

    const parsedAmount = parseInt(displayAmount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Default water amount must be greater than 0 ml.');
      return;
    }

    Alert.alert(
      'Update reminder schedule?',
      'This will replace your existing generated reminders with the new schedule.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            const res = await generateAndSaveIntervalSchedule(
              formatTime12Hour(displayStart),
              formatTime12Hour(displayEnd),
              intervalMinutes,
              parsedAmount
            );

            if (!res.success) {
              Alert.alert('Error', res.error || 'Failed to generate schedule.');
            } else {
              Alert.alert(
                'Schedule Generated',
                `Successfully created ${res.count} reminders every ${intervalMinutes} minutes.`
              );
            }
          },
        },
      ]
    );
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setModalMode('add');
    setActiveEditingId(null);
    setInputTime('10:30 AM');
    setInputAmount(defaultAmountMl.toString());
    setModalVisible(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (reminder: ReminderItem) => {
    setModalMode('edit');
    setActiveEditingId(reminder.id);
    setInputTime(reminder.time);
    setInputAmount(reminder.amountMl.toString());
    setModalVisible(true);
  };

  // Save Add or Edit
  const handleSaveModal = async () => {
    const parsedAmount = parseInt(inputAmount, 10);
    if (!inputTime.trim()) {
      Alert.alert('Invalid Time', 'Please enter a reminder time (e.g. 10:30 AM).');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Water amount must be greater than 0 ml.');
      return;
    }

    if (modalMode === 'add') {
      const res = await addCustomReminder(inputTime.trim(), parsedAmount);
      if (!res.success) {
        Alert.alert('Duplicate / Invalid Time', res.error || 'Failed to add reminder.');
        return;
      }

      // Check notification permission status (Section 8)
      const perm = await notificationService.getPermissionStatus();
      if (perm !== 'granted') {
        Alert.alert(
          'Reminder Saved',
          'Reminder saved, but notifications are disabled in Android settings. You can enable them anytime from Settings.',
          [
            { text: 'OK' },
            { text: 'Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } else if (modalMode === 'edit' && activeEditingId) {
      const existing = customReminders.find((r) => r.id === activeEditingId);
      if (!existing) return;

      const res = await updateReminder({
        ...existing,
        time: inputTime.trim(),
        amountMl: parsedAmount,
      });

      if (!res.success) {
        Alert.alert('Duplicate / Invalid Time', res.error || 'Failed to update reminder.');
        return;
      }
    }

    setModalVisible(false);
  };

  // Delete with Confirmation (Section 7)
  const handleDeleteReminder = (id: string) => {
    Alert.alert('Delete this reminder?', 'This reminder will be permanently removed from your schedule.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteCustomReminder(id),
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPadding + Spacing.sm }]}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>REMINDERS</Text>
          <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
            Personalized water schedule and smart alerts
          </Text>
        </View>

        {/* Reminder Mode Switcher */}
        <View
          style={[
            styles.modeCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
            Shadows.sm,
          ]}
        >
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            Schedule Type
          </Text>

          <View style={styles.modeRow}>
            {(['interval', 'custom'] as ReminderMode[]).map((mode) => {
              const isSelected = reminderMode === mode;
              const label = mode === 'interval' ? 'Fixed Interval' : 'Custom Times';
              return (
                <TouchableOpacity
                  key={mode}
                  activeOpacity={0.7}
                  onPress={() => setReminderMode(mode)}
                  style={[
                    styles.modeOption,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={isSelected ? colors.primary : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.modeOptionText,
                      {
                        color: isSelected ? colors.primary : colors.text,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* MODE 1: FIXED INTERVAL CONTROLS */}
        {reminderMode === 'interval' && (
          <View
            style={[
              styles.configCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              Shadows.sm,
            ]}
          >
            <View style={styles.configHeader}>
              <View
                style={[
                  styles.iconBadge,
                  {
                    backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#E0F2FE',
                  },
                ]}
              >
                <Ionicons name="options-outline" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.configTitle, { color: colors.text }]}>
                  Interval Schedule Setup
                </Text>
                <Text style={[styles.configSubtitle, { color: colors.textSecondary }]}>
                  Goal: {formatVolume(dailyGoal, unit)} • {formatVolume(defaultAmountMl, unit)}/drink ≈ {servingsEstimated} servings
                </Text>
              </View>
            </View>

            {/* Start and End inputs */}
            <View style={styles.inputsRow}>
              <View style={styles.inputCol}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Start Time</Text>
                <View style={[styles.timeInputWrap, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <Ionicons name="sunny-outline" size={16} color="#F59E0B" />
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    value={displayStart}
                    onChangeText={setLocalStart}
                    onEndEditing={() => updateIntervalSettings({ startTime: formatTime12Hour(displayStart) })}
                    placeholder="08:00 AM"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              <View style={styles.inputCol}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>End Time</Text>
                <View style={[styles.timeInputWrap, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <Ionicons name="moon-outline" size={16} color="#818CF8" />
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    value={displayEnd}
                    onChangeText={setLocalEnd}
                    onEndEditing={() => updateIntervalSettings({ endTime: formatTime12Hour(displayEnd) })}
                    placeholder="10:00 PM"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* Interval selection chips */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
              Interval Frequency
            </Text>
            <View style={styles.intervalGrid}>
              {[15, 30, 45, 60, 90, 120].map((mins) => {
                const isSelected = intervalMinutes === mins;
                return (
                  <TouchableOpacity
                    key={mins}
                    onPress={() => updateIntervalSettings({ intervalMinutes: mins })}
                    style={[
                      styles.intervalChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surfaceElevated,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.intervalChipText,
                        { color: isSelected ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {mins}m
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Default amount input */}
            <View style={{ marginTop: Spacing.sm }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Water Amount Per Reminder (ml)
              </Text>
              <View style={[styles.timeInputWrap, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Ionicons name="water-outline" size={16} color={colors.primary} />
                <TextInput
                  style={[styles.textInput, { color: colors.text }]}
                  value={displayAmount}
                  onChangeText={setLocalAmount}
                  onEndEditing={() => {
                    const val = parseInt(displayAmount, 10);
                    if (!isNaN(val) && val > 0) {
                      updateIntervalSettings({ defaultAmountMl: val });
                    }
                  }}
                  placeholder="250"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                />
                <Text style={[styles.suffix, { color: colors.primary }]}>ml</Text>
              </View>
            </View>

            {/* Generate Schedule Button */}
            <View style={{ marginTop: Spacing.md }}>
              <PrimaryButton
                title="Generate Schedule"
                icon="refresh-outline"
                onPress={handleRequestGenerateSchedule}
              />
            </View>
          </View>
        )}

        {/* SCHEDULE LIST (Both Modes) */}
        <View style={styles.scheduleSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Today&apos;s Schedule ({customReminders.length})
              </Text>
              <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
                Sorted chronologically
              </Text>
            </View>

            {reminderMode === 'custom' && (
              <TouchableOpacity
                onPress={handleOpenAddModal}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.addText, { color: colors.primary }]}>
                  + Add Reminder
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {customReminders.length === 0 ? (
            <EmptyState
              icon="water-outline"
              title="No reminders yet"
              description="Set a schedule and we'll remind you when it's time to drink water."
              actionTitle="Create Schedule"
              onAction={() => {
                if (reminderMode === 'interval') {
                  handleRequestGenerateSchedule();
                } else {
                  handleOpenAddModal();
                }
              }}
            />
          ) : (
            <View style={styles.listContainer}>
              {customReminders.map((rem) => (
                <ReminderCard
                  key={rem.id}
                  reminder={rem}
                  onToggle={toggleReminder}
                  onEdit={handleOpenEditModal}
                  onDelete={handleDeleteReminder}
                  unit={unit}
                />
              ))}
            </View>
          )}

          {reminderMode === 'custom' && customReminders.length > 0 && (
            <View style={{ marginTop: Spacing.md }}>
              <PrimaryButton
                title="+ Add Reminder"
                icon="add-circle"
                onPress={handleOpenAddModal}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add / Edit Custom Reminder Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.avoidingView}
            >
              <TouchableWithoutFeedback>
                <View
                  style={[
                    styles.modalBox,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    Shadows.lg,
                  ]}
                >
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      {modalMode === 'add' ? 'Add Reminder' : 'Edit Reminder'}
                    </Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                      <Ionicons name="close" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Time field */}
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                    Time (e.g. 10:30 AM)
                  </Text>
                  <View
                    style={[
                      styles.inputWrap,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.modalInput, { color: colors.text }]}
                      value={inputTime}
                      onChangeText={setInputTime}
                      placeholder="10:30 AM"
                      placeholderTextColor={colors.textMuted}
                      autoFocus
                    />
                  </View>

                  {/* Quick Preset times */}
                  <View style={styles.presetTimeRow}>
                    {['08:00 AM', '11:00 AM', '02:00 PM', '05:00 PM'].map((t) => (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setInputTime(t)}
                        style={[styles.timeChip, { backgroundColor: colors.surfaceElevated }]}
                      >
                        <Text style={[styles.timeChipText, { color: colors.text }]}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Amount field */}
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
                    Amount (ml)
                  </Text>
                  <View
                    style={[
                      styles.inputWrap,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Ionicons name="water-outline" size={18} color={colors.primary} />
                    <TextInput
                      style={[styles.modalInput, { color: colors.text }]}
                      value={inputAmount}
                      onChangeText={setInputAmount}
                      placeholder="250"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                    />
                    <Text style={[styles.suffix, { color: colors.primary }]}>ml</Text>
                  </View>

                  {/* Modal action buttons */}
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      onPress={() => setModalVisible(false)}
                      style={[styles.modalCancel, { borderColor: colors.border }]}
                    >
                      <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleSaveModal}
                      style={[styles.modalSave, { backgroundColor: colors.primary }]}
                    >
                      <Text style={styles.modalSaveText}>
                        {modalMode === 'add' ? 'Save Reminder' : 'Update Reminder'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  modeCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    gap: 8,
  },
  modeOptionText: {
    fontSize: 13,
  },
  configCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.sm,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  configSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.xs,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    gap: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  suffix: {
    fontSize: 13,
    fontWeight: '700',
  },
  intervalGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  intervalChip: {
    flex: 1,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intervalChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scheduleSection: {
    marginTop: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSub: {
    fontSize: 12,
    marginTop: 1,
  },
  addText: {
    fontSize: 13,
    fontWeight: '700',
  },
  listContainer: {
    gap: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  avoidingView: {
    width: '100%',
    maxWidth: 360,
  },
  modalBox: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    gap: 8,
    marginBottom: Spacing.xs,
  },
  modalInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  presetTimeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  timeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  timeChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.md,
  },
  modalCancel: {
    flex: 1,
    height: 46,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalSave: {
    flex: 1.4,
    height: 46,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
