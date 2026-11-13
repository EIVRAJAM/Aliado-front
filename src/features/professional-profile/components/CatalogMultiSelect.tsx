import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../../../shared/ui/theme';

export interface MultiSelectOption {
  id: string;
  label: string;
  description?: string | null;
}

interface CatalogMultiSelectProps {
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  error?: string;
  disabled?: boolean;
  emptyMessage: string;
}

export function CatalogMultiSelect({
  options,
  selectedIds,
  onChange,
  error,
  disabled = false,
  emptyMessage,
}: CatalogMultiSelectProps) {
  const toggle = (id: string) => {
    if (disabled) {
      return;
    }
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id]
    );
  };

  if (options.length === 0) {
    return <Text style={styles.empty}>{emptyMessage}</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.options}>
        {options.map((option) => {
          const selected = selectedIds.includes(option.id);
          return (
            <Pressable
              key={option.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected, disabled }}
              accessibilityLabel={
                option.description ? `${option.label}. ${option.description}` : option.label
              }
              disabled={disabled}
              onPress={() => toggle(option.id)}
              style={[
                styles.option,
                selected ? styles.optionSelected : null,
                disabled ? styles.optionDisabled : null,
              ]}
            >
              <Ionicons
                name={selected ? 'checkbox' : 'square-outline'}
                size={20}
                color={selected ? colors.primary : colors.muted}
              />
              <View style={styles.optionText}>
                <Text style={[styles.label, selected ? styles.labelSelected : null]}>
                  {option.label}
                </Text>
                {option.description ? (
                  <Text style={styles.description}>{option.description}</Text>
                ) : null}
              </View>
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

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  options: {
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoSurface,
  },
  optionDisabled: {
    opacity: 0.65,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  labelSelected: {
    color: colors.primary,
  },
  description: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
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
