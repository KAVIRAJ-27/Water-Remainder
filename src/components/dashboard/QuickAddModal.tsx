import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { UnitPreference } from '../../types';

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  onAddWater: (amountMl: number) => void;
  unit?: UnitPreference;
}

export function QuickAddModal({
  visible,
  onClose,
  onAddWater,
  unit = 'ml',
}: QuickAddModalProps) {
  const { colors, isDark } = useTheme();
  const [customAmount, setCustomAmount] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleAdd = (amountToLog?: number) => {
    let ml = amountToLog;

    if (ml === undefined) {
      const parsed = parseFloat(customAmount.trim());
      if (isNaN(parsed) || parsed <= 0) {
        setErrorMessage('Amount must be greater than 0');
        return;
      }
      ml = unit === 'L' ? Math.round(parsed * 1000) : Math.round(parsed);
    }

    if (ml <= 0) {
      setErrorMessage('Amount must be greater than 0 ml');
      return;
    }

    onAddWater(ml);
    setCustomAmount('');
    setErrorMessage('');
    onClose();
  };

  const handleClose = () => {
    setCustomAmount('');
    setErrorMessage('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.avoidingView}
          >
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                  Shadows.lg,
                ]}
              >
                <View style={styles.modalHeader}>
                  <View style={styles.headerLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor: isDark
                            ? 'rgba(56, 189, 248, 0.15)'
                            : '#E0F2FE',
                        },
                      ]}
                    >
                      <Ionicons name="water" size={20} color={colors.primary} />
                    </View>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      Custom Amount
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="close" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Input row */}
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Enter amount
                </Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surfaceElevated,
                        color: colors.text,
                        borderColor: errorMessage ? colors.danger : colors.border,
                      },
                    ]}
                    placeholder={unit === 'L' ? '0.35' : '350'}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={customAmount}
                    onChangeText={(val) => {
                      setCustomAmount(val);
                      if (errorMessage) setErrorMessage('');
                    }}
                    autoFocus
                  />
                  <Text style={[styles.unitBadge, { color: colors.primary }]}>
                    {unit}
                  </Text>
                </View>

                {errorMessage ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={16} color={colors.danger} />
                    <Text style={[styles.errorText, { color: colors.danger }]}>
                      {errorMessage}
                    </Text>
                  </View>
                ) : null}

                {/* Quick select pills */}
                <Text style={[styles.presetsHeader, { color: colors.textSecondary }]}>
                  Common Volumes:
                </Text>
                <View style={styles.presetRow}>
                  {[150, 300, 450, 750].map((presetMl) => (
                    <TouchableOpacity
                      key={presetMl}
                      activeOpacity={0.7}
                      onPress={() => handleAdd(presetMl)}
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor: colors.surfaceElevated,
                          borderColor: colors.borderLight,
                        },
                      ]}
                    >
                      <Text style={[styles.presetText, { color: colors.text }]}>
                        {unit === 'L' ? `${(presetMl / 1000).toFixed(2)} L` : `${presetMl} ml`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: colors.border }]}
                    onPress={handleClose}
                  >
                    <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleAdd()}
                  >
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.submitText}>Add Water</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  avoidingView: {
    width: '100%',
    maxWidth: 380,
  },
  modalContent: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginVertical: Spacing.xs,
  },
  input: {
    flex: 1,
    height: 52,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 20,
    fontWeight: '700',
  },
  unitBadge: {
    position: 'absolute',
    right: Spacing.md,
    fontSize: 16,
    fontWeight: '700',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  presetsHeader: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.lg,
  },
  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1.5,
    height: 46,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
