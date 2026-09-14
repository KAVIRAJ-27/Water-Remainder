import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useUserStore } from '../../store/userStore';
import { useWaterStore } from '../../store/waterStore';
import { useReminderStore } from '../../store/reminderStore';
import { SettingRow } from '../../components/SettingRow';
import { BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { ThemeMode, UnitPreference } from '../../types';
import { useRouter } from 'expo-router';
import { notificationService } from '../../services/notificationService';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, themeMode, setThemeMode } = useTheme();

  // User store
  const {
    name,
    dailyGoal,
    unit,
    updateProfile,
    resetUser,
  } = useUserStore();

  // Water store
  const {
    currentStreak,
    longestStreak,
    clearTodayData,
    clearHistory,
    resetWaterStore,
  } = useWaterStore();

  // Reminder store
  const {
    startTime,
    endTime,
    intervalMinutes,
    defaultAmountMl,
    notificationsEnabled,
    soundEnabled,
    vibrationEnabled,
    snoozeMinutes,
    updateIntervalSettings,
    updateNotificationSettings,
    resetSchedule,
  } = useReminderStore();

  const [systemPermissionGranted, setSystemPermissionGranted] = useState(true);

  useEffect(() => {
    notificationService.getPermissionStatus().then((status) => {
      setSystemPermissionGranted(status === 'granted');
    });
  }, []);

  // Edit Goal Modal State
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [tempGoalText, setTempGoalText] = useState(dailyGoal.toString());

  // Edit Name Modal State
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [tempNameText, setTempNameText] = useState(name);

  // Edit Interval Modal State
  const [intervalModalVisible, setIntervalModalVisible] = useState(false);

  const handleSaveName = () => {
    if (!tempNameText.trim()) {
      Alert.alert('Invalid Name', 'Name cannot be empty.');
      return;
    }
    updateProfile({ name: tempNameText.trim() });
    setNameModalVisible(false);
  };

  const handleSaveGoal = () => {
    const parsed = parseFloat(tempGoalText.trim());
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid Goal', 'Please enter a goal greater than 0.');
      return;
    }
    const finalGoal = unit === 'L' ? Math.round(parsed * 1000) : Math.round(parsed);
    updateProfile({ dailyGoal: finalGoal });
    setGoalModalVisible(false);
  };

  const handleToggleUnit = () => {
    const newUnit: UnitPreference = unit === 'ml' ? 'L' : 'ml';
    updateProfile({ unit: newUnit });
  };

  // Destructive Action Handlers
  const handleClearTodayData = () => {
    Alert.alert(
      "Clear Today's Data",
      "Are you sure you want to reset today's logged drinks to 0 ml? This cannot be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            clearTodayData();
            Alert.alert('Cleared', "Today's hydration data has been reset.");
          },
        },
      ]
    );
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Hydration History',
      'Are you sure you want to clear past daily records? Today will be kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear History',
          style: 'destructive',
          onPress: () => {
            clearHistory();
            Alert.alert('Cleared', 'Past hydration history has been cleared.');
          },
        },
      ]
    );
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset HydroReminder',
      'This will reset your profile, reminders, and all hydration history back to factory defaults. You will return to the setup screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: () => {
            resetUser();
            resetWaterStore();
            resetSchedule();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  const themeOptions: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
    { mode: 'light', label: 'Light', icon: 'sunny-outline' },
    { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>Settings</Text>
          <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
            Preferences, schedule, notifications, and profile
          </Text>
        </View>

        {/* 1. PROFILE SECTION */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
            PROFILE
          </Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              Shadows.sm,
            ]}
          >
            <SettingRow
              icon="person-outline"
              title="Name"
              subtitle="Your display name"
              valueText={name}
              onPress={() => {
                setTempNameText(name);
                setNameModalVisible(true);
              }}
            />

            <SettingRow
              icon="flag-outline"
              title="Daily Goal"
              subtitle="Hydration target"
              valueText={unit === 'L' ? `${(dailyGoal / 1000).toFixed(1)} L` : `${dailyGoal} ml`}
              onPress={() => {
                setTempGoalText(unit === 'L' ? (dailyGoal / 1000).toFixed(1) : dailyGoal.toString());
                setGoalModalVisible(true);
              }}
            />

            <SettingRow
              icon="swap-horizontal-outline"
              title="Unit"
              subtitle="Toggle between ml and L"
              valueText={unit === 'ml' ? 'Milliliters (ml)' : 'Liters (L)'}
              onPress={handleToggleUnit}
            />
          </View>
        </View>

        {/* 2. STREAKS & ACHIEVEMENTS */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
            STREAKS & ACHIEVEMENTS
          </Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              Shadows.sm,
            ]}
          >
            <SettingRow
              icon="flame-outline"
              title="Current Streak"
              subtitle="Consecutive goal days"
              valueText={`${currentStreak} ${currentStreak === 1 ? 'day' : 'days'} 🔥`}
            />
            <SettingRow
              icon="trophy-outline"
              title="Longest Streak"
              subtitle="Personal best record"
              valueText={`${longestStreak} ${longestStreak === 1 ? 'day' : 'days'} 🏆`}
            />
          </View>
        </View>

        {/* 3. REMINDERS SECTION */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
            REMINDERS
          </Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              Shadows.sm,
            ]}
          >
            <SettingRow
              icon="time-outline"
              title="Reminder Schedule"
              subtitle="Active daily window"
              valueText={`${startTime} - ${endTime}`}
              onPress={() => router.push('/(tabs)/reminders' as any)}
            />

            <SettingRow
              icon="repeat-outline"
              title="Reminder Interval"
              subtitle="Pace between prompts"
              valueText={`Every ${intervalMinutes} min`}
              onPress={() => setIntervalModalVisible(true)}
            />

            <SettingRow
              icon="water-outline"
              title="Default Amount"
              subtitle="Standard single drink"
              valueText={`${defaultAmountMl} ml`}
              onPress={() => {
                const nextAmount = defaultAmountMl === 250 ? 300 : defaultAmountMl === 300 ? 500 : 250;
                updateIntervalSettings({ defaultAmountMl: nextAmount });
              }}
            />
          </View>
        </View>

        {/* 3. NOTIFICATIONS SECTION */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
            NOTIFICATIONS
          </Text>

          {!systemPermissionGranted && notificationsEnabled && (
            <View
              style={[
                styles.permissionNotice,
                {
                  backgroundColor: colors.warning + '18',
                  borderColor: colors.warning + '55',
                },
              ]}
            >
              <Ionicons name="alert-circle-outline" size={22} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.permissionNoticeTitle, { color: colors.warning }]}>
                  Notifications are disabled in Android settings.
                </Text>
                <Text style={[styles.permissionNoticeBody, { color: colors.textSecondary }]}>
                  Enable notifications to receive scheduled water alerts on your device.
                </Text>
                <TouchableOpacity
                  style={[styles.openSettingsBtn, { backgroundColor: colors.warning }]}
                  onPress={() => Linking.openSettings()}
                >
                  <Text style={styles.openSettingsBtnText}>Open Notification Settings</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              Shadows.sm,
            ]}
          >
            <SettingRow
              icon="notifications-outline"
              title="Enable Notifications"
              subtitle="Drink alerts on your device"
              isSwitch
              switchValue={notificationsEnabled}
              onSwitchChange={(val) => updateNotificationSettings({ notificationsEnabled: val })}
            />

            <SettingRow
              icon="volume-high-outline"
              title="Sound"
              subtitle="Audible chime when reminding"
              isSwitch
              switchValue={soundEnabled}
              onSwitchChange={(val) => updateNotificationSettings({ soundEnabled: val })}
            />

            <SettingRow
              icon="radio-outline"
              title="Vibration"
              subtitle="Haptic pulse on alert"
              isSwitch
              switchValue={vibrationEnabled}
              onSwitchChange={(val) => updateNotificationSettings({ vibrationEnabled: val })}
            />

            <SettingRow
              icon="hourglass-outline"
              title="Snooze"
              subtitle="Delay reminder duration"
              valueText={`${snoozeMinutes} mins`}
              onPress={() => {
                const nextSnooze = snoozeMinutes === 10 ? 15 : snoozeMinutes === 15 ? 30 : 10;
                updateNotificationSettings({ snoozeMinutes: nextSnooze });
              }}
            />
          </View>
        </View>

        {/* 4. BATTERY OPTIMIZATION & RELIABILITY */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
            BATTERY OPTIMIZATION & RELIABILITY
          </Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.card, borderColor: colors.border, padding: Spacing.md },
              Shadows.sm,
            ]}
          >
            <View style={styles.batteryHelpHeader}>
              <Ionicons name="battery-charging-outline" size={20} color={colors.primary} />
              <Text style={[styles.batteryHelpTitle, { color: colors.text }]}>
                Ensure Timely Notifications
              </Text>
            </View>
            <Text style={[styles.batteryHelpText, { color: colors.textSecondary }]}>
              Some Android manufacturers (e.g. Samsung, Xiaomi, OnePlus) aggressively restrict background tasks, which can delay or block scheduled reminders.
            </Text>
            <View style={styles.batteryTipList}>
              <View style={styles.batteryTipRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[styles.batteryTipText, { color: colors.text }]}>
                  {'Set battery usage to "Unrestricted" in App Info.'}
                </Text>
              </View>
              <View style={styles.batteryTipRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[styles.batteryTipText, { color: colors.text }]}>
                  Allow background activity for HydroReminder.
                </Text>
              </View>
              <View style={styles.batteryTipRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[styles.batteryTipText, { color: colors.text }]}>
                  Exclude HydroReminder from battery savers.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.batterySettingsButton, { borderColor: colors.primary }]}
              onPress={() => Linking.openSettings()}
            >
              <Ionicons name="settings-outline" size={15} color={colors.primary} />
              <Text style={[styles.batterySettingsButtonText, { color: colors.primary }]}>
                Check Android App Settings
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. APPEARANCE SECTION */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
            APPEARANCE
          </Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.card, borderColor: colors.border, padding: Spacing.md },
              Shadows.sm,
            ]}
          >
            <View style={styles.themeRow}>
              {themeOptions.map((opt) => {
                const isSelected = themeMode === opt.mode;
                return (
                  <TouchableOpacity
                    key={opt.mode}
                    activeOpacity={0.7}
                    onPress={() => setThemeMode(opt.mode)}
                    style={[
                      styles.themeButton,
                      isSelected
                        ? {
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                          }
                        : {
                            backgroundColor: colors.surfaceElevated,
                            borderColor: colors.border,
                          },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={20}
                      color={isSelected ? '#FFFFFF' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.themeButtonText,
                        { color: isSelected ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* 5. DATA SECTION */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
            DATA
          </Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              Shadows.sm,
            ]}
          >
            <SettingRow
              icon="water-outline"
              iconColor="#F59E0B"
              title="Clear Today&apos;s Data"
              subtitle="Reset current intake to 0"
              onPress={handleClearTodayData}
            />

            <SettingRow
              icon="trash-bin-outline"
              iconColor="#F59E0B"
              title="Clear History"
              subtitle="Erase past logged days"
              onPress={handleClearHistory}
            />

            <SettingRow
              icon="refresh-outline"
              title="Reset App"
              subtitle="Clear all data and restart onboarding"
              isDestructive
              onPress={handleResetApp}
            />
          </View>
        </View>

        {/* App Version Info */}
        <View style={styles.versionFooter}>
          <Text style={[styles.versionText, { color: colors.textMuted }]}>
            HydroReminder v1.0.0 (Offline-First Android App)
          </Text>
          <Text style={[styles.versionSub, { color: colors.textMuted }]}>
            com.hydroreminder.app
          </Text>
        </View>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal
        visible={nameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNameModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setNameModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.modalWrap}
            >
              <TouchableWithoutFeedback>
                <View
                  style={[
                    styles.modalBox,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    Shadows.lg,
                  ]}
                >
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Name</Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: colors.surfaceElevated,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={tempNameText}
                    onChangeText={setTempNameText}
                    placeholder="Your name"
                    placeholderTextColor={colors.textMuted}
                    autoFocus
                  />
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      onPress={() => setNameModalVisible(false)}
                      style={[styles.btnCancel, { borderColor: colors.border }]}
                    >
                      <Text style={[styles.btnCancelText, { color: colors.textSecondary }]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveName}
                      style={[styles.btnSave, { backgroundColor: colors.primary }]}
                    >
                      <Text style={styles.btnSaveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal
        visible={goalModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setGoalModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.modalWrap}
            >
              <TouchableWithoutFeedback>
                <View
                  style={[
                    styles.modalBox,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    Shadows.lg,
                  ]}
                >
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Edit Daily Target ({unit})
                  </Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      {
                        backgroundColor: colors.surfaceElevated,
                        color: colors.text,
                        borderColor: colors.border,
                      },
                    ]}
                    value={tempGoalText}
                    onChangeText={setTempGoalText}
                    placeholder={unit === 'L' ? '2.5' : '2500'}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    autoFocus
                  />
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      onPress={() => setGoalModalVisible(false)}
                      style={[styles.btnCancel, { borderColor: colors.border }]}
                    >
                      <Text style={[styles.btnCancelText, { color: colors.textSecondary }]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveGoal}
                      style={[styles.btnSave, { backgroundColor: colors.primary }]}
                    >
                      <Text style={styles.btnSaveText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Interval Selector Modal */}
      <Modal
        visible={intervalModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIntervalModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIntervalModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalBox,
                { backgroundColor: colors.card, borderColor: colors.border },
                Shadows.lg,
              ]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Choose Reminder Interval
              </Text>
              <View style={{ gap: 8, marginVertical: Spacing.sm }}>
                {[30, 45, 60, 90, 120].map((mins) => {
                  const isSelected = intervalMinutes === mins;
                  return (
                    <TouchableOpacity
                      key={mins}
                      onPress={() => {
                        updateIntervalSettings({ intervalMinutes: mins });
                        setIntervalModalVisible(false);
                      }}
                      style={[
                        styles.intervalOption,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surfaceElevated,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.intervalOptionText,
                          { color: isSelected ? '#FFFFFF' : colors.text },
                        ]}
                      >
                        Every {mins} minutes
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
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
  sectionWrap: {
    gap: 6,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 4,
  },
  themeButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  versionFooter: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 2,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  versionSub: {
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalWrap: {
    width: '100%',
    maxWidth: 340,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  modalInput: {
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  btnCancel: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  btnSave: {
    flex: 1.2,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  intervalOption: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  intervalOptionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  permissionNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 6,
  },
  permissionNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  permissionNoticeBody: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: Spacing.sm,
  },
  openSettingsBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  openSettingsBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  batteryHelpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  batteryHelpTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  batteryHelpText: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: Spacing.sm,
  },
  batteryTipList: {
    gap: 6,
    marginBottom: Spacing.md,
  },
  batteryTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  batteryTipText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  batterySettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  batterySettingsButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
