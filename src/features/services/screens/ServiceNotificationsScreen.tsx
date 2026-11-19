import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { ServiceNotificationCard } from '../components/ServiceNotificationCard';
import { useServiceNotifications } from '../hooks/useServiceNotifications';

type ServiceNotificationsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ServiceNotifications'
>;

export function ServiceNotificationsScreen({
  navigation,
}: ServiceNotificationsScreenProps) {
  const { session } = useAuthSession();
  const { notifications, loading, error, reload } = useServiceNotifications();

  if (!session) {
    return null;
  }

  const countLabel = loading
    ? 'Cargando avisos…'
    : error
      ? 'No se pudieron cargar'
      : `${notifications.length} ${notifications.length === 1 ? 'aviso' : 'avisos'}`;

  return (
    <ScreenLayout
      title="Avisos de servicio"
      subtitle="Aceptaciones y cambios de estado de tus servicios."
      onBack={() => navigation.goBack()}
    >
      <View style={styles.toolbar}>
        <View style={styles.toolbarText}>
          <Text style={styles.count}>{countLabel}</Text>
          <Text style={styles.hint}>Se consultan al abrir la pantalla; no hay push.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Actualizar avisos de servicio"
          onPress={() => {
            void reload();
          }}
          style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {loading || error ? (
        <>
          {error ? <InlineMessage message={error} /> : null}
          {error ? (
            <PrimaryButton
              label="Reintentar"
              onPress={() => {
                void reload();
              }}
            />
          ) : (
            <Card style={styles.loadingCard}>
              <Text style={styles.loadingText}>Cargando avisos de servicio…</Text>
            </Card>
          )}
        </>
      ) : notifications.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons name="briefcase-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Sin avisos de servicio</Text>
          <Text style={styles.emptyText}>
            Cuando recibas una propuesta, acepten una tuya o cambie el estado de un servicio,
            aparecerá aquí.
          </Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {notifications.map((notification) => (
            <ServiceNotificationCard
              key={notification.id}
              notification={notification}
              onPress={() => {
                if (notification.tipo === 'PROPUESTA_RECIBIDA' && notification.solicitudId) {
                  navigation.navigate('ReceivedProposals', {
                    solicitudId: notification.solicitudId,
                  });
                } else if (notification.tipo === 'PROPUESTA_RECIBIDA') {
                  navigation.navigate('MainTabs', { screen: 'Requests' });
                } else if (notification.servicioId) {
                  navigation.navigate('ServiceDetail', {
                    servicioId: notification.servicioId,
                  });
                }
              }}
            />
          ))}
        </View>
      )}
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
  toolbarText: { flex: 1, gap: 2 },
  count: { color: colors.text, fontSize: 18, fontWeight: '800' },
  hint: { color: colors.muted, fontSize: 12 },
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
  pressed: { backgroundColor: colors.background },
  loadingCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  loadingText: { color: colors.muted, fontSize: 14 },
  emptyCard: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: radii.xl,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  list: { gap: spacing.md },
});
