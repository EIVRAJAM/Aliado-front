import { useAppTheme, type ThemeColors } from './ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from './PrimaryButton';
import { radii, spacing } from './theme';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectFieldProps {
  label: string;
  placeholder: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
}

export function SelectField({
  label,
  placeholder,
  value,
  options,
  onChange,
  error,
  hint,
  disabled = false,
}: SelectFieldProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${selected?.label ?? placeholder}`}
        accessibilityHint={hint ?? 'Abre la lista de opciones.'}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.control,
          pressed && !disabled ? styles.controlPressed : null,
          error ? styles.controlError : null,
          disabled ? styles.controlDisabled : null,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[styles.value, selected ? null : styles.placeholder]}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </Pressable>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}

      <Modal
        animationType="fade"
        transparent
        visible={open}
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar lista"
            onPress={() => setOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.sheet} accessibilityViewIsModal>
            <Text style={styles.sheetTitle}>{label}</Text>
            {options.length === 0 ? (
              <Text style={styles.empty}>No hay opciones disponibles.</Text>
            ) : (
              <ScrollView
                contentContainerStyle={styles.options}
                keyboardShouldPersistTaps="handled"
              >
                {options.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected }}
                      accessibilityLabel={
                        option.description
                          ? `${option.label}. ${option.description}`
                          : option.label
                      }
                      onPress={() => handleSelect(option.value)}
                      style={[
                        styles.option,
                        isSelected ? styles.optionSelected : null,
                      ]}
                    >
                      <View style={styles.optionText}>
                        <Text
                          style={[
                            styles.optionLabel,
                            isSelected ? styles.optionLabelSelected : null,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {option.description ? (
                          <Text style={styles.optionDescription}>
                            {option.description}
                          </Text>
                        ) : null}
                      </View>
                      {isSelected ? <Text style={styles.check}>✓</Text> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
            <PrimaryButton
              label="Cerrar"
              variant="ghost"
              onPress={() => setOpen(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  control: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.inputBackground,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  controlPressed: {
    borderColor: colors.primary,
  },
  controlError: {
    borderColor: colors.danger,
  },
  controlDisabled: {
    opacity: 0.6,
  },
  value: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  placeholder: {
    color: colors.muted,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
  hint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    maxHeight: '78%',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  options: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoSurface,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  optionLabelSelected: {
    color: colors.primary,
  },
  optionDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  check: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  empty: {
    color: colors.muted,
    fontSize: 14,
  },
});
