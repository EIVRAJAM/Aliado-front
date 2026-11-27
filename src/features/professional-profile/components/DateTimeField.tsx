import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../../shared/ui/theme';

interface DateTimeFieldProps {
  label: string;
  value: Date;
  mode: 'date' | 'time';
  onChange: (value: Date) => void;
  disabled?: boolean;
  error?: string;
}

const pad = (value: number) => String(value).padStart(2, '0');

export function formatDateValue(value: Date): string {
  return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()}`;
}

export function formatTimeValue(value: Date): string {
  return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export function DateTimeField({ label, value, mode, onChange, disabled = false, error }: DateTimeFieldProps) {
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(value);
  const displayValue = mode === 'date' ? formatDateValue(value) : formatTimeValue(value);

  const open = () => {
    if (disabled) return;
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode,
        is24Hour: true,
        onChange: (event: DateTimePickerEvent, selected?: Date) => {
          if (event.type === 'set' && selected) {
            selected.setSeconds(0, 0);
            onChange(selected);
          }
        },
      });
      return;
    }
    setDraft(value);
    setVisible(true);
  };

  const close = () => setVisible(false);
  const confirm = () => {
    const next = new Date(draft);
    next.setSeconds(0, 0);
    onChange(next);
    close();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${displayValue}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={open}
        style={({ pressed }) => [styles.button, error ? styles.buttonError : null, pressed && !disabled ? styles.buttonPressed : null, disabled ? styles.buttonDisabled : null]}
      >
        <Text style={styles.value}>{displayValue}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{label}</Text>
            <DateTimePicker value={draft} mode={mode} display="spinner" is24Hour onChange={(_, selected) => selected && setDraft(selected)} />
            <View style={styles.dialogActions}>
              <Pressable accessibilityRole="button" onPress={close} style={styles.dialogAction}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={confirm} style={styles.dialogAction}><Text style={styles.confirmText}>Aceptar</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  label: { color: colors.text, fontSize: 13, fontWeight: '600' },
  button: { minHeight: 46, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, backgroundColor: colors.inputBackground, justifyContent: 'center', paddingHorizontal: spacing.md },
  buttonPressed: { borderColor: colors.primary },
  buttonError: { borderColor: colors.danger },
  buttonDisabled: { opacity: 0.55 },
  value: { color: colors.text, fontSize: 15, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 12, lineHeight: 16 },
  overlay: { flex: 1, justifyContent: 'center', padding: spacing.lg, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  dialog: { gap: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface, padding: spacing.lg },
  dialogTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md },
  dialogAction: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  cancelText: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  confirmText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
});
