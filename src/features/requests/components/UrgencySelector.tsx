import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radii, spacing } from '../../../shared/ui/theme';
import { urgencyOptions, type RequestUrgency } from '../types/request';
import { urgencyTone } from '../utils/request-visuals';

interface UrgencySelectorProps {
  value: RequestUrgency | null;
  onChange: (value: RequestUrgency) => void;
  error?: string;
  disabled?: boolean;
}

export function UrgencySelector({
  value,
  onChange,
  error,
  disabled = false,
}: UrgencySelectorProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <View style={styles.options}>
        {urgencyOptions.map((option) => {
          const selected = option.value === value;
          const tone = urgencyTone(option.value, colors);
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
                selected
                  ? { backgroundColor: tone.background, borderColor: tone.text }
                  : null,
                disabled ? styles.optionDisabled : null,
              ]}
            >
              <Text style={[styles.label, selected ? { color: tone.text } : null]}>
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
    flexBasis: '22%',
    flexGrow: 1,
    minHeight: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  optionDisabled: {
    opacity: 0.6,
  },
  label: {
    color: colors.neutral,
    fontSize: 13,
    fontWeight: '600',
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
});
