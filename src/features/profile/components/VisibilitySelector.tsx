import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../../../shared/ui/theme';
import { visibilityOptions, type VisibilityPreference } from '../types/profile';

interface VisibilitySelectorProps {
  value: VisibilityPreference;
  onChange: (value: VisibilityPreference) => void;
  disabled?: boolean;
}

export function VisibilitySelector({ value, onChange, disabled = false }: VisibilitySelectorProps) {
  return (
    <View style={styles.container}>
      {visibilityOptions.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, disabled }}
            accessibilityLabel={`${option.label}. ${option.description}`}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={[styles.option, selected ? styles.optionSelected : null]}
          >
            <Text style={[styles.optionLabel, selected ? styles.optionLabelSelected : null]}>
              {option.label}
            </Text>
            <Text style={styles.optionDescription}>{option.description}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoSurface,
  },
  optionLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  optionLabelSelected: {
    color: colors.primary,
  },
  optionDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});
