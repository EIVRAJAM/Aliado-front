import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from './theme';

type MessageVariant = 'error' | 'success' | 'info';

interface InlineMessageProps {
  message: string;
  variant?: MessageVariant;
}

const palette: Record<MessageVariant, { background: string; text: string }> = {
  error: {
    background: colors.dangerSurface,
    text: colors.danger,
  },
  success: {
    background: colors.successSurface,
    text: colors.success,
  },
  info: {
    background: colors.infoSurface,
    text: colors.info,
  },
};

export function InlineMessage({ message, variant = 'error' }: InlineMessageProps) {
  const theme = palette[variant];

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <Text style={[styles.text, { color: theme.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
