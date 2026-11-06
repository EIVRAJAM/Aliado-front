import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../../../shared/ui/theme';

type MessageVariant = 'error' | 'success' | 'info';

interface InlineMessageProps {
  message: string;
  variant?: MessageVariant;
}

const palette: Record<MessageVariant, { background: string; border: string; text: string }> = {
  error: {
    background: colors.dangerSurface,
    border: colors.danger,
    text: colors.danger,
  },
  success: {
    background: colors.successSurface,
    border: colors.success,
    text: colors.success,
  },
  info: {
    background: colors.infoSurface,
    border: colors.info,
    text: colors.info,
  },
};

export function InlineMessage({ message, variant = 'error' }: InlineMessageProps) {
  const theme = palette[variant];

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.container, { backgroundColor: theme.background, borderColor: theme.border }]}
    >
      <Text style={[styles.text, { color: theme.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderLeftWidth: 4,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
});
