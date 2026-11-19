import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import type { AppNotification, NotificationType } from '../types/notification';
import {
  formatNotificationDate,
  notificationTypeLabel,
} from '../utils/notification-format';

function notificationIcon(type: NotificationType) {
  switch (type) {
    case 'NUEVA_OPORTUNIDAD':
      return 'flash-outline' as const;
    case 'PROPUESTA_RECIBIDA':
      return 'mail-unread-outline' as const;
    case 'ACEPTACION_PROPUESTA':
      return 'checkmark-circle-outline' as const;
    case 'CAMBIO_ESTADO_SERVICIO':
      return 'swap-horizontal-outline' as const;
    case 'AVISO_SEGURIDAD_CUENTA':
      return 'shield-checkmark-outline' as const;
  }
}

function actionLabel(notification: AppNotification): string {
  switch (notification.tipo) {
    case 'NUEVA_OPORTUNIDAD':
      return 'Abrir oportunidad.';
    case 'PROPUESTA_RECIBIDA':
      return notification.solicitudId
        ? 'Abrir propuestas recibidas.'
        : 'Abrir mis solicitudes.';
    case 'ACEPTACION_PROPUESTA':
    case 'CAMBIO_ESTADO_SERVICIO':
      return 'Abrir servicio.';
    case 'AVISO_SEGURIDAD_CUENTA':
      return 'Aviso informativo.';
  }
}

export function NotificationCard({
  notification,
  onPress,
}: {
  notification: AppNotification;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={styles.iconBadge}>
        <Ionicons
          name={notificationIcon(notification.tipo)}
          size={20}
          color={colors.primary}
        />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{notificationTypeLabel(notification.tipo)}</Text>
        <Text style={styles.detail}>{notification.detalle}</Text>
        <Text style={styles.date}>
          {formatNotificationDate(notification.fechaGeneracion)}
        </Text>
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
      ) : null}
    </>
  );

  return (
    <Card style={styles.card}>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${notificationTypeLabel(notification.tipo)}. ${
            notification.detalle
          } ${actionLabel(notification)}`}
          onPress={onPress}
          style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
        >
          {content}
        </Pressable>
      ) : (
        <View
          accessible
          accessibilityLabel={`${notificationTypeLabel(notification.tipo)}. ${
            notification.detalle
          } Aviso informativo.`}
          style={styles.row}
        >
          {content}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
  },
  pressed: { backgroundColor: colors.background, borderRadius: radii.lg },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: 3 },
  title: { color: colors.text, fontSize: 15, fontWeight: '800' },
  detail: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  date: { color: colors.muted, fontSize: 12 },
});
