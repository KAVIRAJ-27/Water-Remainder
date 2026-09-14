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
import { BorderRadius, Shadows, Spacing } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface EditProfileModalProps {
  visible: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (newName: string) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  currentName,
  onClose,
  onSave,
}) => {
  const { colors } = useTheme();

  const [prevVisible, setPrevVisible] = useState(visible);
  const [nameText, setNameText] = useState(currentName);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setNameText(currentName);
      setErrorMessage(null);
    }
  }

  const handleSave = () => {
    const trimmed = nameText.trim();
    if (!trimmed) {
      setErrorMessage('Name cannot be empty.');
      return;
    }
    if (trimmed.length > 40) {
      setErrorMessage('Name must be 40 characters or fewer.');
      return;
    }
    onSave(trimmed);
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
                    <Ionicons name="person-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      Edit Profile Name
                    </Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                      Personalize your hydration experience
                    </Text>
                  </View>
                </View>

                <View style={[styles.inputContainer, { borderColor: errorMessage ? colors.danger : colors.border, backgroundColor: colors.surfaceElevated }]}>
                  <TextInput
                    style={[styles.inputField, { color: colors.text }]}
                    value={nameText}
                    onChangeText={(val) => {
                      setNameText(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Enter your name"
                    placeholderTextColor={colors.textMuted}
                    maxLength={40}
                    autoFocus
                    accessibilityLabel="Profile name input"
                  />
                </View>

                {errorMessage && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={14} color={colors.danger} />
                    <Text style={[styles.errorText, { color: colors.danger }]}>
                      {errorMessage}
                    </Text>
                  </View>
                )}

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
                    <Text style={styles.btnSaveText}>Save Name</Text>
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
  inputContainer: {
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  inputField: {
    height: '100%',
    fontSize: 16,
    fontWeight: '600',
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
