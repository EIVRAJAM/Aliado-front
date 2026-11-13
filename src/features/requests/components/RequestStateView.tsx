import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { colors, spacing } from '../../../shared/ui/theme';

interface RequestStateViewProps {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  emptyMessage?: string | null;
}

export function RequestStateView({
  loading,
  error,
  onRetry,
  emptyMessage,
}: RequestStateViewProps) {
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Cargando solicitudes...</Text>
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

  if (emptyMessage) {
    return <InlineMessage variant="info" message={emptyMessage} />;
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
