import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { colors, spacing } from '../../../shared/ui/theme';

interface OpportunityStateViewProps {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  loadingLabel: string;
}

export function OpportunityStateView({
  loading,
  error,
  onRetry,
  loadingLabel,
}: OpportunityStateViewProps) {
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>{loadingLabel}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.error}>
        <InlineMessage message={error} />
        <PrimaryButton label="Reintentar" onPress={onRetry} />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
  },
  error: {
    gap: spacing.md,
  },
});
