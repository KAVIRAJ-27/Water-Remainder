import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { UnitPreference } from '../../types';
import { BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { validateDailyGoal, mlToDisplayValue } from '../../utils/unitUtils';
import { Ionicons } from '@expo/vector-icons';

interface DailyGoalModalProps {
  visible: boolean;
  currentGoalMl: number;
  unit: UnitPreference;
  onClose: () => void;
  onSave: (newGoalMl: number) => void;
}

const PRESET_GOALS_ML = [2000, 2500, 3000, 3500];

export const DailyGoalModal: React.FC<DailyGoalModalProps> = ({
  visible,
  currentGoalMl,
  unit,
  onClose,
  onSave,
}) => {
  const { colors } = useTheme();

  const [prevVisible, setPrevVisible] = useState(visible);
  const [inputVal, setInputVal] = useState(() => mlToDisplayValue(currentGoalMl, unit).toString());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setInputVal(mlToDisplayValue(currentGoalMl, unit).toString());
      setErrorMessage(null);
    }
  }

  const handleSelectPreset = (presetMl: number) => {
    const displayVal = mlToDisplayValue(presetMl, unit);
    setInputVal(displayVal.toString());
    setErrorMessage(null);
  };

  const handleSave = () => {
    const res = validateDailyGoal(inputVal, unit);
    if (!res.isValid) {
      setErrorMessage(res.errorMessage || 'Invalid hydration goal.');
      return;
    }
    onSave(res.amountMl);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
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
                <View style={styles.modalHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.primary + '18' }]}>
                    <Ionicons name="flag-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      Daily Hydration Target
                    </Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                      Set your daily goal ({unit})
                    </Text>
                  </View>
                </View>

                {/* Preset Chips */}
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                  Quick Presets:
                </Text>
                <View style={styles.presetsGrid}>
                  {PRESET_GOALS_ML.map((pMl) => {
                    const presetDisplay = mlToDisplayValue(pMl, unit);
                    const isSelected =
                      inputVal.trim() === presetDisplay.toString() ||
                      inputVal.trim() === `${presetDisplay}`;

                    return (
                      <TouchableOpacity
                        key={pMl}
                        activeOpacity={0.7}
                        onPress={() => handleSelectPreset(pMl)}
                        style={[
                          styles.presetChip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.surfaceElevated,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.presetChipText,
                            { color: isSelected ? '#FFFFFF' : colors.text },
                          ]}
                        >
                          {presetDisplay} {unit}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Custom Input */}
                <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: Spacing.sm }]}>
                  Custom Target:
                </Text>
                <View style={[styles.inputContainer, { borderColor: errorMessage ? colors.danger : colors.border, backgroundColor: colors.surfaceElevated }]}>
                  <TextInput
                    style={[styles.inputField, { color: colors.text }]}
                    value={inputVal}
                    onChangeText={(val) => {
                      setInputVal(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder={unit === 'L' ? '2.5' : '2500'}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                    accessibilityLabel="Daily water goal input"
                  />
                  <Text style={[styles.inputUnitBadge, { color: colors.textSecondary }]}>
                    {unit}
                  </Text>
                </View>

                {/* Error message */}
                {errorMessage && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color={colors.danger} />
                    <Text style={[styles.errorText, { color: colors.danger }]}>
                      {errorMessage}
                    </Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    onPress={onClose}
                    style={[styles.btnCancel, { borderColor: colors.border }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.btnCancelText, { color: colors.textSecondary }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    style={[styles.btnSave, { backgroundColor: colors.primary }]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.btnSaveText}>Save Target</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalWrap: {
    width: '100%',
    maxWidth: 360,
  },
  modalBox: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  presetChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  inputField: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontWeight: '700',
  },
  inputUnitBadge: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.lg,
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
    flex: 1.3,
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
});
