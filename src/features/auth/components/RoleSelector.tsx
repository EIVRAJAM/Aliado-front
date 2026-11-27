import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../../../shared/ui/theme';
import type { AuthRole } from '../types/auth';

const roles: Array<{ value: AuthRole; label: string; description: string }> = [
  {
    value: 'CLIENTE',
    label: 'Cliente',
    description: 'Quiero buscar y contratar servicios.',
  },
  {
    value: 'PRESTADOR',
    label: 'Prestador',
    description: 'Quiero ofrecer mis servicios.',
  },
];

interface RoleSelectorProps {
  value: AuthRole | null;
  onChange: (role: AuthRole) => void;
  error?: string;
}

export function RoleSelector({ value, onChange, error }: RoleSelectorProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Quiero usar ALIADO como</Text>
      <View style={styles.options}>
        {roles.map((role) => {
          const selected = value === role.value;
          return (
            <Pressable
              key={role.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${role.label}. ${role.description}`}
              onPress={() => onChange(role.value)}
              style={[styles.option, selected ? styles.optionSelected : null]}
            >
              <Text style={[styles.optionLabel, selected ? styles.optionLabelSelected : null]}>
                {role.label}
              </Text>
              <Text style={styles.optionDescription}>{role.description}</Text>
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
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  options: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
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
  error: {
    color: colors.danger,
    fontSize: 13,
  },
});
