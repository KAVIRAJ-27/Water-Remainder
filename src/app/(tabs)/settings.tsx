import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  TouchableWithoutFeedback,
  Linking,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useTheme } from '../../hooks/useTheme';
import { useUserStore } from '../../store/userStore';
import { useWaterStore } from '../../store/waterStore';
import { useReminderStore } from '../../store/reminderStore';
import { SettingRow } from '../../components/SettingRow';
import { DailyGoalModal } from '../../components/settings/DailyGoalModal';
import { DefaultAmountModal } from '../../components/settings/DefaultAmountModal';
import { EditProfileModal } from '../../components/settings/EditProfileModal';
import { BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { ThemeMode, UnitPreference } from '../../types';
import { notificationService } from '../../services/notificationService';
import { formatVolume } from '../../utils/unitUtils';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, themeMode, setThemeMode } = useTheme();

  // User store
  const {
    name,
    dailyGoal,
    unit,
    defaultAmountMl,
    loadUserSettings,
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
    loadTodayData,
    loadAnalytics,
  } = useWaterStore();

  // Reminder store
  const {
    startTime,
    endTime,
    intervalMinutes,
    reminderMode,
    notificationsEnabled,
    soundEnabled,
    vibrationEnabled,
    snoozeMinutes,
    alarmMode,
    setAlarmMode,
    updateIntervalSettings,
    updateNotificationSettings,
    getNextReminderItem,
    resetSchedule,
  } = useReminderStore();

  const [systemPermissionGranted, setSystemPermissionGranted] = useState(true);

  // Check Android notification permission on mount and focus
  const checkPermission = useCallback(async () => {
    const status = await notificationService.getPermissionStatus();
    setSystemPermissionGranted(status === 'granted');
  }, []);

  useEffect(() => {
    loadUserSettings();
  }, [loadUserSettings]);

  useFocusEffect(
    useCallback(() => {
      checkPermission();
    }, [checkPermission])
  );

  // Modals
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [amountModalVisible, setAmountModalVisible] = useState(false);
  const [intervalModalVisible, setIntervalModalVisible] = useState(false);

  // Handlers
  const handleSaveName = async (newName: string) => {
    await updateProfile({ name: newName });
  };

  const handleSaveGoal = async (newGoalMl: number) => {
    await updateProfile({ dailyGoal: newGoalMl });
    await loadTodayData(newGoalMl);
    await loadAnalytics(newGoalMl);
  };

  const handleToggleUnit = async () => {
    const newUnit: UnitPreference = unit === 'ml' ? 'L' : 'ml';
    await updateProfile({ unit: newUnit });
  };

  const handleSaveDefaultAmount = async (newAmountMl: number) => {
    await updateProfile({ defaultAmountMl: newAmountMl });
    await updateIntervalSettings({ defaultAmountMl: newAmountMl });
  };

  // Next reminder live preview
  const nextReminder = getNextReminderItem();
  const nextReminderText = !notificationsEnabled
    ? 'Reminders Disabled'
    : nextReminder
    ? `${nextReminder.time} (${formatVolume(nextReminder.amountMl, unit)})`
    : 'No upcoming reminders';

  // Destructive Action Handlers
  const handleClearTodayData = () => {
    Alert.alert(
      "Clear Today's Data?",
      "This will remove all water entries recorded today. Your settings, reminders, and past history will be kept.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: async () => {
            await clearTodayData(dailyGoal);
            Alert.alert('Cleared', "Today's hydration data has been reset to 0.");
          },
        },
      ]
    );
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Hydration History?',
      'This will permanently remove your past water history. Today\'s current progress and personal settings will not be changed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear History',
          style: 'destructive',
          onPress: async () => {
            await clearHistory(dailyGoal);
            Alert.alert('Cleared', 'Past hydration history has been cleared.');
          },
        },
      ]
    );
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset HydroReminder?',
      'This will delete your hydration data, reminders, and personal settings. All scheduled notifications will be cancelled and you will return to the setup screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await notificationService.cancelAllReminders();
            await resetUser();
            await resetWaterStore();
            await resetSchedule();
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

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 0);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPadding + Spacing.sm }]}>
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
              onPress={() => setNameModalVisible(true)}
            />
          </View>
        </View>

        {/* 2. HYDRATION SETTINGS */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
            HYDRATION
          </Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
              Shadows.sm,
            ]}
          >
            <SettingRow
              icon="flag-outline"
              title="Daily Water Goal"
              subtitle="Target volume per day"
              valueText={formatVolume(dailyGoal, unit)}
              onPress={() => setGoalModalVisible(true)}
            />

            <SettingRow
              icon="swap-horizontal-outline"
              title="Water Unit"
              subtitle="Display unit for all volumes"
              valueText={unit === 'ml' ? 'Milliliters (ml)' : 'Liters (L)'}
              onPress={handleToggleUnit}
            />

            <SettingRow
              icon="water-outline"
              title="Default Drink Amount"
              subtitle="Quick-add single portion"
              valueText={formatVolume(defaultAmountMl || 250, unit)}
              onPress={() => setAmountModalVisible(true)}
            />
          </View>
        </View>

        {/* 3. STREAKS & ACHIEVEMENTS */}
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
              subtitle="Consecutive completed days"
              valueText={`${currentStreak} ${currentStreak === 1 ? 'day' : 'days'} 🔥`}
            />
            <SettingRow
              icon="trophy-outline"
              title="Longest Streak"
              subtitle="All-time personal record"
              valueText={`${longestStreak} ${longestStreak === 1 ? 'day' : 'days'} 🏆`}
            />
          </View>
        </View>

        {/* 4. REMINDERS SECTION */}
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
              icon="notifications-outline"
              title="Enable Reminders"
              subtitle="Active water scheduling"
              isSwitch
              switchValue={notificationsEnabled}
              onSwitchChange={(val) => updateNotificationSettings({ notificationsEnabled: val })}
            />

            <SettingRow
              icon="time-outline"
              title="Next Reminder"
              subtitle="Upcoming scheduled alert"
              valueText={nextReminderText}
            />

            <SettingRow
              icon="calendar-outline"
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
              icon="options-outline"
              title="Reminder Mode"
              subtitle="Schedule behavior"
              valueText={reminderMode === 'interval' ? 'Fixed Interval' : 'Custom Times'}
              onPress={() => router.push('/(tabs)/reminders' as any)}
            />
          </View>
        </View>

        {/* 5. NOTIFICATIONS SECTION */}
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
                  Notifications are disabled by Android.
                </Text>
                <Text style={[styles.permissionNoticeBody, { color: colors.textSecondary }]}>
                  Enable notifications in Android system settings to receive your scheduled drink alerts.
                </Text>
                <TouchableOpacity
                  style={[styles.openSettingsBtn, { backgroundColor: colors.warning }]}
                  onPress={() => Linking.openSettings()}
                  accessibilityLabel="Open Android notification settings"
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
              icon="volume-high-outline"
              title="Sound"
              subtitle="Audible chime on reminder"
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
              icon="alarm-outline"
              title="Alarm-style reminders"
              subtitle="High-intensity vibration & heads-up banner"
              isSwitch
              switchValue={alarmMode}
              onSwitchChange={(val) => setAlarmMode(val)}
            />

            <SettingRow
              icon="hourglass-outline"
              title="Snooze Duration"
              subtitle="Delay reminder duration"
              valueText={`${snoozeMinutes} mins`}
              onPress={() => {
                const nextSnooze = snoozeMinutes === 10 ? 15 : snoozeMinutes === 15 ? 30 : 10;
                updateNotificationSettings({ snoozeMinutes: nextSnooze });
              }}
            />
          </View>
        </View>

        {/* 6. BATTERY & RELIABILITY GUIDE */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
            BATTERY & RELIABILITY
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
              Some Android manufacturers (e.g. Samsung, Xiaomi, OnePlus) aggressively restrict background tasks, which can delay scheduled reminders.
            </Text>
            <View style={styles.batteryTipList}>
              <View style={styles.batteryTipRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[styles.batteryTipText, { color: colors.text }]}>
                  {'Set battery usage to "Unrestricted" in Android App Info.'}
                </Text>
              </View>
              <View style={styles.batteryTipRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[styles.batteryTipText, { color: colors.text }]}>
                  Allow background activity for HydroReminder.
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

        {/* 7. APPEARANCE SECTION */}
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
                    accessibilityLabel={`Theme option ${opt.label}`}
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

        {/* 8. DATA MANAGEMENT SECTION */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
            DATA MANAGEMENT
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

        {/* 9. ABOUT & PRIVACY SECTION */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
            ABOUT & PRIVACY
          </Text>
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: colors.card, borderColor: colors.border, padding: Spacing.md },
              Shadows.sm,
            ]}
          >
            <View style={styles.aboutHeader}>
              <View style={[styles.aboutLogoBadge, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name="water" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.aboutAppName, { color: colors.text }]}>HydroReminder</Text>
                <Text style={[styles.aboutVersion, { color: colors.textSecondary }]}>
                  Version {appVersion} (Android Phone Edition)
                </Text>
              </View>
            </View>

            <Text style={[styles.aboutDescription, { color: colors.textSecondary }]}>
              A simple offline water reminder and hydration tracking app designed for daily wellness.
            </Text>

            <View style={[styles.privacyBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.success} />
              <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
                Your hydration data is stored locally on this device. HydroReminder operates 100% offline and never transmits personal or health information to any server or cloud service.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.versionFooter}>
          <Text style={[styles.versionText, { color: colors.textMuted }]}>
            HydroReminder • 100% Local & Offline
          </Text>
          <Text style={[styles.versionSub, { color: colors.textMuted }]}>
            com.hydroreminder.app
          </Text>
        </View>
      </ScrollView>

      {/* Edit Name Modal */}
      <EditProfileModal
        visible={nameModalVisible}
        currentName={name}
        onClose={() => setNameModalVisible(false)}
        onSave={handleSaveName}
      />

      {/* Edit Daily Goal Modal */}
      <DailyGoalModal
        visible={goalModalVisible}
        currentGoalMl={dailyGoal}
        unit={unit}
        onClose={() => setGoalModalVisible(false)}
        onSave={handleSaveGoal}
      />

      {/* Edit Default Amount Modal */}
      <DefaultAmountModal
        visible={amountModalVisible}
        currentAmountMl={defaultAmountMl || 250}
        unit={unit}
        onClose={() => setAmountModalVisible(false)}
        onSave={handleSaveDefaultAmount}
      />

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
                      accessibilityLabel={`Every ${mins} minutes`}
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
    paddingBottom: Spacing.xxl + 24,
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
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  aboutLogoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutAppName: {
    fontSize: 16,
    fontWeight: '800',
  },
  aboutVersion: {
    fontSize: 12,
    marginTop: 2,
  },
  aboutDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  privacyText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
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
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
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
