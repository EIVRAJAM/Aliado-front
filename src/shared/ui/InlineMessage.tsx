import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radii, spacing } from './theme';
import { useAppTheme, type ThemeColors } from './ThemeProvider';

type MessageVariant = 'error' | 'success' | 'info';

interface InlineMessageProps {
  message: string;
  variant?: MessageVariant;
}

export function InlineMessage({ message, variant = 'error' }: InlineMessageProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const theme =
    variant === 'success'
      ? { background: colors.successSurface, text: colors.success }
      : variant === 'info'
        ? { background: colors.infoSurface, text: colors.info }
        : { background: colors.dangerSurface, text: colors.danger };
  const textColor = theme.text;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <Text style={[styles.text, { color: textColor }]}>{message}</Text>
    </View>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
});
