import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useUserStore } from '../store/userStore';
import { BorderRadius, Shadows, Spacing } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { UnitPreference } from '../types';
import { PrimaryButton } from '../components/PrimaryButton';

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const completeOnboarding = useUserStore((state) => state.completeOnboarding);

  const [step, setStep] = useState<'welcome' | 'form'>('welcome');
  const [name, setName] = useState('Kaviraj');
  const [dailyGoalText, setDailyGoalText] = useState('2500');
  const [unit, setUnit] = useState<UnitPreference>('ml');
  const [startTime, setStartTime] = useState('08:00 AM');
  const [endTime, setEndTime] = useState('10:00 PM');

  const handleFinish = () => {
    const parsedGoal = parseFloat(dailyGoalText.trim());
    if (isNaN(parsedGoal) || parsedGoal <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid daily water goal greater than 0.');
      return;
    }

    const finalGoalMl = unit === 'L' ? Math.round(parsedGoal * 1000) : Math.round(parsedGoal);

    completeOnboarding({
      name: name.trim() || 'Kaviraj',
      dailyGoal: finalGoalMl,
      unit,
      startTime: startTime.trim() || '08:00 AM',
      endTime: endTime.trim() || '10:00 PM',
    });

    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {step === 'welcome' ? (
            /* STEP 1: WELCOME SCREEN */
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeHero}>
                <View
                  style={[
                    styles.logoOuter,
                    {
                      backgroundColor: isDark ? 'rgba(56, 189, 248, 0.18)' : '#E0F2FE',
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Ionicons name="water" size={64} color={colors.primary} />
                </View>

                <Text style={[styles.brandTitle, { color: colors.text }]}>
                  HydroReminder
                </Text>
                <Text style={[styles.tagline, { color: colors.primary }]}>
                  Stay Hydrated, Stay Healthy
                </Text>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                  Set your hydration goal and let HydroReminder remind you when it&apos;s time to drink water.
                </Text>
              </View>

              <View style={styles.actionContainer}>
                <PrimaryButton
                  title="Get Started"
                  icon="arrow-forward"
                  onPress={() => setStep('form')}
                />
              </View>
            </View>
          ) : (
            /* STEP 2: PROFILE SETUP FORM */
            <View style={styles.formContainer}>
              <View style={styles.formHeader}>
                <TouchableOpacity
                  onPress={() => setStep('welcome')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.formTitle, { color: colors.text }]}>
                  Hydration Setup
                </Text>
                <View style={{ width: 24 }} />
              </View>

              <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>
                Customize your daily hydration target and schedule
              </Text>

              <View
                style={[
                  styles.formCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                  Shadows.md,
                ]}
              >
                {/* 1. Name */}
                <View style={styles.fieldSection}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>Name</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.textInput, { color: colors.text }]}
                      value={name}
                      onChangeText={setName}
                      placeholder="e.g. Kaviraj"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                {/* 2. Daily Goal */}
                <View style={styles.fieldSection}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>Daily Goal</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Ionicons name="water-outline" size={18} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.textInput, { color: colors.text }]}
                      value={dailyGoalText}
                      onChangeText={setDailyGoalText}
                      placeholder={unit === 'L' ? '2.5' : '2500'}
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                    />
                    <Text style={[styles.inputSuffix, { color: colors.primary }]}>{unit}</Text>
                  </View>
                </View>

                {/* 3. Unit Selector (○ ml  ○ L) */}
                <View style={styles.fieldSection}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>Unit</Text>
                  <View style={styles.radioRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        if (unit !== 'ml') {
                          setUnit('ml');
                          setDailyGoalText('2500');
                        }
                      }}
                      style={[
                        styles.radioItem,
                        {
                          backgroundColor: colors.surfaceElevated,
                          borderColor: unit === 'ml' ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={unit === 'ml' ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={unit === 'ml' ? colors.primary : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.radioText,
                          {
                            color: unit === 'ml' ? colors.primary : colors.text,
                            fontWeight: unit === 'ml' ? '700' : '500',
                          },
                        ]}
                      >
                        Milliliters (ml)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        if (unit !== 'L') {
                          setUnit('L');
                          setDailyGoalText('2.5');
                        }
                      }}
                      style={[
                        styles.radioItem,
                        {
                          backgroundColor: colors.surfaceElevated,
                          borderColor: unit === 'L' ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={unit === 'L' ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={unit === 'L' ? colors.primary : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.radioText,
                          {
                            color: unit === 'L' ? colors.primary : colors.text,
                            fontWeight: unit === 'L' ? '700' : '500',
                          },
                        ]}
                      >
                        Liters (L)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 4. Start & End Times */}
                <View style={styles.scheduleRow}>
                  <View style={styles.scheduleItem}>
                    <Text style={[styles.fieldLabel, { color: colors.text }]}>Start Time</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        {
                          backgroundColor: colors.surfaceElevated,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Ionicons name="sunny-outline" size={18} color="#F59E0B" />
                      <TextInput
                        style={[styles.textInput, { color: colors.text }]}
                        value={startTime}
                        onChangeText={setStartTime}
                        placeholder="08:00 AM"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  </View>

                  <View style={styles.scheduleItem}>
                    <Text style={[styles.fieldLabel, { color: colors.text }]}>End Time</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        {
                          backgroundColor: colors.surfaceElevated,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Ionicons name="moon-outline" size={18} color="#818CF8" />
                      <TextInput
                        style={[styles.textInput, { color: colors.text }]}
                        value={endTime}
                        onChangeText={setEndTime}
                        placeholder="10:00 PM"
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.continueWrap}>
                <PrimaryButton
                  title="Continue"
                  icon="checkmark"
                  onPress={handleFinish}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: Spacing.xl,
    minHeight: 520,
  },
  welcomeHero: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  logoOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 22,
    maxWidth: 300,
  },
  actionContainer: {
    width: '100%',
    marginTop: Spacing.xl,
  },
  formContainer: {
    flex: 1,
    paddingTop: Spacing.sm,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  formSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  formCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  fieldSection: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  inputSuffix: {
    fontSize: 14,
    fontWeight: '700',
  },
  radioRow: {
    flexDirection: 'row',
    gap: 10,
  },
  radioItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    gap: 8,
  },
  radioText: {
    fontSize: 13,
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  scheduleItem: {
    flex: 1,
    gap: 6,
  },
  continueWrap: {
    marginTop: Spacing.lg,
  },
});
