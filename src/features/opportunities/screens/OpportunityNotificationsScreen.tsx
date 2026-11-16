import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { OpportunityNotificationCard } from '../components/OpportunityNotificationCard';
import { OpportunityStateView } from '../components/OpportunityStateView';
import { useOpportunityNotifications } from '../hooks/useOpportunityNotifications';

type OpportunityNotificationsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'OpportunityNotifications'
>;

export function OpportunityNotificationsScreen({
  navigation,
}: OpportunityNotificationsScreenProps) {
  const { session } = useAuthSession();

  if (!session) {
    return null;
  }

  if (session.role !== 'PRESTADOR') {
    return (
      <ScreenLayout
        title="Avisos de oportunidades"
        subtitle="Esta sección pertenece a las cuentas de prestador."
        onBack={() => navigation.goBack()}
      >
        <InlineMessage
          variant="info"
          message="Tu cuenta no tiene el rol Prestador, por lo que no puede consultar estos avisos."
        />
      </ScreenLayout>
    );
  }

  return <ProviderNotifications navigation={navigation} />;
}

function ProviderNotifications({
  navigation,
}: {
  navigation: OpportunityNotificationsScreenProps['navigation'];
}) {
  const { notifications, loading, error, reload } = useOpportunityNotifications();

  const countLabel = loading
    ? 'Cargando avisos…'
    : error
      ? 'No se pudieron cargar'
      : `${notifications.length} ${
          notifications.length === 1 ? 'aviso' : 'avisos'
        }`;

  return (
    <ScreenLayout
      title="Avisos de oportunidades"
      subtitle="Nuevas coincidencias notificadas por el servidor."
      onBack={() => navigation.goBack()}
    >
      <View style={styles.toolbar}>
        <View style={styles.toolbarText}>
          <Text style={styles.count}>{countLabel}</Text>
          <Text style={styles.countHint}>
            Abre un aviso para consultar la oportunidad actualizada.
          </Text>
        </View>
        <View style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={20} color={colors.primary} />
        </View>
      </View>

      <InlineMessage
        variant="info"
        message="La app consulta estos avisos al abrir la pantalla. No usa push, polling ni actualización automática; el servidor vuelve a validar cada oportunidad al abrirla."
      />

      {loading || error ? (
        <OpportunityStateView
          loading={loading}
          error={error}
          onRetry={() => {
            void reload();
          }}
          loadingLabel="Consultando avisos de oportunidades…"
        />
      ) : notifications.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-off-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Sin avisos de oportunidades</Text>
          <Text style={styles.emptyText}>
            Cuando el servidor detecte una nueva coincidencia compatible, aparecerá en esta
            bandeja.
          </Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {notifications.map((notification) => (
            <OpportunityNotificationCard
              key={notification.id}
              notification={notification}
              onPress={() => {
                if (!notification.solicitudId) {
                  return;
                }
                navigation.navigate('OpportunityDetail', {
                  solicitudId: notification.solicitudId,
                });
              }}
            />
          ))}
        </View>
      )}

      <PrimaryButton
        label="Actualizar avisos"
        variant="secondary"
        disabled={loading}
        onPress={() => {
          void reload();
        }}
      />
    </ScreenLayout>
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
  list: {
    gap: spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.sm,
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
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
