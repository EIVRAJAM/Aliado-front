import { useState } from 'react';
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
import { NotificationCard } from '../components/NotificationCard';
import { useNotifications } from '../hooks/useNotifications';
import { androidPushEnabled } from '../hooks/useAndroidPush';
import type { AppNotification, NotificationReadFilter } from '../types/notification';

type NotificationsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Notifications'
>;

const filters: { value: NotificationReadFilter; label: string }[] = [
  { value: 'NO_LEIDA', label: 'No leídas' },
  { value: 'LEIDA', label: 'Leídas' },
  { value: 'TODAS', label: 'Todas' },
];

export function NotificationsScreen({ navigation }: NotificationsScreenProps) {
  const { session } = useAuthSession();
  const [filter, setFilter] = useState<NotificationReadFilter>('NO_LEIDA');
  const {
    notifications, hasMore, loading, loadingMore, saving, error, reload, loadMore, markRead,
  } = useNotifications(filter);

  if (!session) {
    return null;
  }

  const openNotification = (notification: AppNotification) => {
    switch (notification.tipo) {
      case 'NUEVA_OPORTUNIDAD':
        if (session.role === 'PRESTADOR' && notification.solicitudId) {
          navigation.navigate('OpportunityDetail', {
            solicitudId: notification.solicitudId,
          });
        }
        break;
      case 'PROPUESTA_RECIBIDA':
        if (session.role === 'CLIENTE') {
          if (notification.solicitudId) {
            navigation.navigate('ReceivedProposals', {
              solicitudId: notification.solicitudId,
            });
          } else {
            navigation.navigate('MainTabs', { screen: 'Home' });
          }
        }
        break;
      case 'ACEPTACION_PROPUESTA':
      case 'CAMBIO_ESTADO_SERVICIO':
        if (notification.servicioId) {
          navigation.navigate('ServiceDetail', {
            servicioId: notification.servicioId,
          });
        }
        break;
      case 'AVISO_SEGURIDAD_CUENTA':
        break;
    }
  };

  const canOpen = (notification: AppNotification): boolean => {
    switch (notification.tipo) {
      case 'NUEVA_OPORTUNIDAD':
        return session.role === 'PRESTADOR' && Boolean(notification.solicitudId);
      case 'PROPUESTA_RECIBIDA':
        return session.role === 'CLIENTE';
      case 'ACEPTACION_PROPUESTA':
      case 'CAMBIO_ESTADO_SERVICIO':
        return Boolean(notification.servicioId);
      case 'AVISO_SEGURIDAD_CUENTA':
        return false;
    }
  };

  const countLabel = loading
    ? 'Cargando notificaciones…'
    : error
      ? 'No se pudieron cargar'
      : `${notifications.length} ${
          notifications.length === 1 ? 'notificación' : 'notificaciones'
        }`;

  return (
    <ScreenLayout
      title="Notificaciones"
      subtitle="Oportunidades, propuestas y cambios de servicio."
      onBack={() => navigation.goBack()}
    >
      <View style={styles.toolbar}>
        <View style={styles.toolbarText}>
          <Text style={styles.count}>{countLabel}</Text>
          <Text style={styles.hint}>
            {androidPushEnabled && session.role === 'PRESTADOR'
              ? 'Activa Nueva oportunidad en tus preferencias para recibir avisos en Android.'
              : 'Abre un aviso o márcalo como leído desde esta bandeja.'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Actualizar notificaciones"
          disabled={saving || loading}
          onPress={() => void reload()}
          style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <View style={styles.filters}>
        {filters.map(({ value, label }) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === value, disabled: saving }}
            disabled={saving}
            onPress={() => setFilter(value)}
            style={[styles.filter, filter === value && styles.activeFilter]}
          >
            <Text style={[styles.filterLabel, filter === value && styles.activeFilterLabel]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {filter === 'NO_LEIDA' && notifications.length > 0 ? (
        <PrimaryButton
          label="Marcar todas como leídas"
          variant="secondary"
          disabled={loading || loadingMore}
          loading={saving}
          onPress={() => void markRead()}
        />
      ) : null}
      {error ? <InlineMessage message={error} /> : null}
      {loading ? (
        <Card style={styles.loadingCard}>
          <Text style={styles.loadingText}>Cargando notificaciones…</Text>
        </Card>
      ) : notifications.length === 0 ? (
        error ? <PrimaryButton label="Reintentar" onPress={() => void reload()} /> : (
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="notifications-off-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === 'NO_LEIDA' ? 'Estás al día' : 'Sin notificaciones'}
            </Text>
            <Text style={styles.emptyText}>
              {filter === 'NO_LEIDA' ? 'Puedes consultar los avisos anteriores en Leídas.'
                : 'Las notificaciones de esta vista aparecerán aquí.'}
            </Text>
          </Card>
        )
      ) : (
        <View style={styles.list}>
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              disabled={saving || loadingMore}
              onPress={canOpen(notification) ? async () => {
                const canNavigate = notification.leidaEn !== null || await markRead(notification.id);
                if (canNavigate && navigation.isFocused()) openNotification(notification);
              } : undefined}
              onMarkRead={notification.leidaEn ? undefined : () => void markRead(notification.id)}
            />
          ))}
          {hasMore ? (
            <PrimaryButton
              label="Cargar más"
              variant="secondary"
              loading={loadingMore}
              disabled={saving}
              onPress={() => void loadMore()}
            />
          ) : null}
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
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filter: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  activeFilter: { borderColor: colors.primary, backgroundColor: colors.infoSurface },
  filterLabel: { color: colors.muted, fontSize: 14, fontWeight: '600' },
  activeFilterLabel: { color: colors.primary },
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
