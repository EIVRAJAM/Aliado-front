import { ActivityIndicator, Pressable, StyleSheet, Text, type ColorValue } from 'react-native';

import { colors, getThemePalette, radii, spacing } from './theme';
import { useTheme } from './ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
}

const palette: Record<ButtonVariant, { background: ColorValue; pressed: ColorValue; text: ColorValue; border?: ColorValue }> = {
  primary: {
    background: colors.primary,
    pressed: colors.primaryPressed,
    text: colors.onPrimary,
  },
  secondary: {
    background: colors.infoSurface,
    pressed: 'rgba(29, 78, 216, 0.18)',
    text: colors.primary,
  },
  ghost: {
    background: 'transparent',
    pressed: colors.background,
    text: colors.muted,
  },
  danger: {
    background: colors.danger,
    pressed: '#B91C1C',
    text: colors.onPrimary,
  },
};

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
}: PrimaryButtonProps) {
  const { colors: themeColors, resolvedScheme } = useTheme();
  const isDisabled = disabled || loading;
  const theme = palette[variant];
  const isSecondary = variant === 'secondary';
  const isFlat = isSecondary || variant === 'ghost';
  const buttonTheme = {
    ...theme,
    background: isSecondary ? themeColors.secondarySurface : theme.background,
    border: isSecondary ? themeColors.secondaryBorder : theme.border,
    pressed: isSecondary
      ? themeColors.secondaryPressed
      : variant === 'ghost'
        ? themeColors.background
        : theme.pressed,
    text:
      variant === 'secondary'
        ? themeColors.primary
        : variant === 'ghost'
          ? themeColors.muted
          : theme.text,
  };
  const spinnerColor =
    variant === 'secondary'
      ? themeColors.primary
      : variant === 'ghost'
        ? themeColors.muted
        : colors.onPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed && !isDisabled ? buttonTheme.pressed : buttonTheme.background,
          borderColor: buttonTheme.border ?? buttonTheme.background,
        },
        isDisabled ? styles.disabled : null,
        isFlat ? styles.flat : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text style={[styles.label, { color: buttonTheme.text }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
  flat: {
    shadowOpacity: 0,
    elevation: 0,
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
});
