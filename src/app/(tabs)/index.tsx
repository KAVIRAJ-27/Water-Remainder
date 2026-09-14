import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useUserStore } from '../../store/userStore';
import { useWaterStore } from '../../store/waterStore';
import { useReminderStore } from '../../store/reminderStore';
import { WaterProgress } from '../../components/dashboard/WaterProgress';
import { WaterButton } from '../../components/dashboard/WaterButton';
import { NextReminder } from '../../components/dashboard/NextReminder';
import { DailyStats } from '../../components/dashboard/DailyStats';
import { QuickAddModal } from '../../components/dashboard/QuickAddModal';
import { PrimaryButton } from '../../components/PrimaryButton';
import { BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { formatVolume } from '../../utils/unitUtils';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();

  // Stores
  const user = useUserStore();
  const {
    todayConsumed,
    drinkCount,
    todayLogs,
    currentStreak,
    loadTodayData,
    addWater,
    removeWaterLog,
  } = useWaterStore();
  const { getNextReminderTime, isLoaded, loadReminders } = useReminderStore();

  useEffect(() => {
    if (!isLoaded) {
      loadReminders();
    }
  }, [isLoaded, loadReminders]);

  useFocusEffect(
    React.useCallback(() => {
      loadTodayData(user.dailyGoal);
    }, [user.dailyGoal, loadTodayData])
  );

  const nextReminderTime = getNextReminderTime();

  const [modalVisible, setModalVisible] = useState(false);

  // Dynamic greeting based on current time
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? 'Good Morning 👋'
      : currentHour < 17
      ? 'Good Afternoon 👋'
      : 'Good Evening 👋';

  const handleQuickAdd = async (amountMl: number) => {
    const res = await addWater(amountMl, user.dailyGoal);
    if (!res.success && res.error) {
      Alert.alert('Validation Error', res.error);
    }
  };

  const handleRemoveLog = (id: string, amountMl: number) => {
    Alert.alert(
      'Remove Drink',
      `Are you sure you want to remove this ${amountMl} ml entry?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeWaterLog(id, user.dailyGoal);
          },
        },
      ]
    );
  };

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with greeting */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.logoBadge,
                {
                  backgroundColor: isDark ? 'rgba(56, 189, 248, 0.2)' : '#E0F2FE',
                },
              ]}
            >
              <Ionicons name="water" size={24} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {greeting}
              </Text>
              <Text style={[styles.appTitle, { color: colors.text }]}>
                {user.name}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.datePill,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {formattedDate}
            </Text>
          </View>
        </View>

        {/* 1. Main Water Progress Card */}
        <WaterProgress
          currentMl={todayConsumed}
          goalMl={user.dailyGoal}
          unit={user.unit}
        />

        {/* 2. Next Reminder Card */}
        <NextReminder nextTime={nextReminderTime} />

        {/* 3. Daily Stats Row */}
        <DailyStats
          intakeMl={todayConsumed}
          goalMl={user.dailyGoal}
          drinkCount={drinkCount}
          currentStreak={currentStreak}
          unit={user.unit}
        />

        {/* 4. Water Quick Actions Section */}
        <View style={styles.quickActionSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Quick Add Water
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setModalVisible(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.customActionText, { color: colors.primary }]}>
                + Custom Amount
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Buttons Grid: +100ml, +200ml, +250ml, +500ml */}
          <View style={styles.buttonsGrid}>
            <View style={styles.buttonRow}>
              <WaterButton
                amountMl={100}
                unit={user.unit}
                onPress={handleQuickAdd}
                iconName="cafe-outline"
              />
              <WaterButton
                amountMl={200}
                unit={user.unit}
                onPress={handleQuickAdd}
                iconName="water-outline"
              />
            </View>

            <View style={styles.buttonRow}>
              <WaterButton
                amountMl={250}
                unit={user.unit}
                onPress={handleQuickAdd}
                iconName="beer-outline"
              />
              <WaterButton
                amountMl={500}
                unit={user.unit}
                onPress={handleQuickAdd}
                iconName="flask-outline"
              />
            </View>
          </View>

          {/* Dedicated Primary Add Water Button */}
          <View style={{ marginTop: 12, flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1.3 }}>
              <PrimaryButton
                title={`+ Add Default (${formatVolume(user.defaultAmountMl || 250, user.unit)})`}
                icon="water"
                onPress={() => handleQuickAdd(user.defaultAmountMl || 250)}
              />
            </View>
            <View style={{ flex: 0.9 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setModalVisible(true)}
                style={[
                  styles.customAddButton,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.border,
                  },
                ]}
                accessibilityLabel="Add custom water amount"
              >
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={[styles.customAddButtonText, { color: colors.text }]}>Custom</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 5. Today's Drink Logs */}
        <View style={styles.logsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Today&apos;s Drinks ({todayLogs.length})
            </Text>
          </View>

          {todayLogs.length === 0 ? (
            <View
              style={[
                styles.emptyLogsCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name="water-outline"
                size={36}
                color={colors.textMuted}
                style={{ marginBottom: 6 }}
              />
              <Text style={[styles.emptyLogsTitle, { color: colors.text }]}>
                No drinks logged yet today
              </Text>
              <Text style={[styles.emptyLogsSubtitle, { color: colors.textSecondary }]}>
                Tap any quick add button above to record your hydration.
              </Text>
            </View>
          ) : (
            <View style={styles.logsList}>
              {todayLogs.map((log) => {
                const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <View
                    key={log.id}
                    style={[
                      styles.logItem,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                      Shadows.sm,
                    ]}
                  >
                    <View style={styles.logLeft}>
                      <View
                        style={[
                          styles.logIcon,
                          {
                            backgroundColor: isDark
                              ? 'rgba(56, 189, 248, 0.15)'
                              : '#E0F2FE',
                          },
                        ]}
                      >
                        <Ionicons name="water" size={18} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={[styles.logAmount, { color: colors.text }]}>
                          +{log.amountMl} ml
                          {user.unit === 'L'
                            ? ` (${(log.amountMl / 1000).toFixed(2)} L)`
                            : ''}
                        </Text>
                        <Text style={[styles.logTime, { color: colors.textMuted }]}>
                          {timeStr}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleRemoveLog(log.id, log.amountMl)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Quick Add Custom Modal */}
      <QuickAddModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddWater={handleQuickAdd}
        unit={user.unit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl + 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  quickActionSection: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
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
  customActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  buttonsGrid: {
    gap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  logsSection: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  emptyLogsCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLogsTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyLogsSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  logsList: {
    gap: 8,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logIcon: {
    width: 36,
    height: 36,
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
  customAddButton: {
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
  },
  customAddButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
