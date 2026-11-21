import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useMyRequests } from '../hooks/useMyRequests';
import { RequestCard } from './RequestCard';
import { RequestStateView } from './RequestStateView';

interface RequestsBoardProps {
  showPrivacyHint?: boolean;
  onOpenRequest: (requestId: string) => void;
  onCreate: () => void;
}

export function RequestsBoard({
  showPrivacyHint = true,
  onOpenRequest,
  onCreate,
}: RequestsBoardProps) {
  const { requests, catalogs, loading, error, reload } = useMyRequests();
  const showToolbarNewAction = loading || error !== null || requests.length > 0;

  const countLabel = loading
    ? 'Cargando solicitudes…'
    : requests.length === 0
      ? 'Sin solicitudes todavía'
      : `${requests.length} ${requests.length === 1 ? 'solicitud' : 'solicitudes'}`;

  return (
    <>
      <View style={styles.toolbar}>
        <View style={styles.toolbarText}>
          <Text style={styles.count}>{countLabel}</Text>
          {showPrivacyHint ? (
            <Text style={styles.countHint}>Solo tú puedes ver tus borradores.</Text>
          ) : null}
        </View>
        <View style={styles.toolbarActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Actualizar solicitudes"
            onPress={() => {
              void reload();
            }}
            style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
          </Pressable>
          {showToolbarNewAction ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Nueva solicitud"
              onPress={onCreate}
              style={({ pressed }) => [styles.newButton, pressed ? styles.newPressed : null]}
            >
              <Ionicons name="add" size={18} color={colors.surface} />
              <Text style={styles.newButtonText}>Nueva</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {loading || error ? (
        <RequestStateView loading={loading} error={error} onRetry={reload} />
      ) : requests.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons name="document-text-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Aún no tienes solicitudes</Text>
          <Text style={styles.emptyText}>
            Publica una solicitud para que los prestadores de tu zona puedan encontrarla.
          </Text>
          <PrimaryButton label="Publicar una solicitud" onPress={onCreate} />
        </View>
      ) : (
        <View style={styles.list}>
          {requests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              catalogs={catalogs}
              onPress={() => onOpenRequest(request.id)}
            />
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  toolbarText: {
    flex: 1,
    gap: 2,
  },
  count: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  countHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.background,
  },
  newButton: {
    minHeight: 42,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  newPressed: {
    backgroundColor: colors.primaryPressed,
  },
  newButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    gap: spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
