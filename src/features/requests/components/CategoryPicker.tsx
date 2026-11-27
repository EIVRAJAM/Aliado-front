import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SelectOption } from '../../../shared/ui/SelectField';
import { colors, radii, spacing } from '../../../shared/ui/theme';

interface CategoryPickerProps {
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function CategoryPicker({
  options,
  value,
  onChange,
  error,
  disabled = false,
}: CategoryPickerProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  if (options.length === 0) {
    return <Text style={styles.empty}>No hay categorías disponibles.</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.options}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled }}
              accessibilityLabel={option.label}
              disabled={disabled}
              onPress={() => onChange(option.value)}
              style={[
                styles.option,
                selected ? styles.optionSelected : null,
                disabled ? styles.optionDisabled : null,
              ]}
            >
              <Text style={[styles.label, selected ? styles.labelSelected : null]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
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
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoSurface,
  },
  optionDisabled: {
    opacity: 0.6,
  },
  label: {
    color: colors.neutral,
    fontSize: 13,
    fontWeight: '600',
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
  empty: {
    color: colors.muted,
    fontSize: 13,
  },
});
