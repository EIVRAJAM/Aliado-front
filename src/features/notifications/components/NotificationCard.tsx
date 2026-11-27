import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import type { AppNotification, NotificationType } from '../types/notification';
import {
  formatNotificationDate,
  notificationDetailText,
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
  onMarkRead,
  disabled = false,
}: {
  notification: AppNotification;
  onPress?: () => void;
  onMarkRead?: () => void;
  disabled?: boolean;
}) {
  const { colors } = useAppTheme();
  const styles = useStyles();
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
        <Text style={[styles.date, !notification.leidaEn && styles.unread]}>
          {notification.leidaEn ? 'Leída' : 'Sin leer'}
        </Text>
        <Text style={styles.detail}>{notificationDetailText(notification.detalle)}</Text>
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
            notificationDetailText(notification.detalle)
          } ${actionLabel(notification)}`}
          onPress={onPress}
          disabled={disabled}
          style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
        >
          {content}
        </Pressable>
      ) : (
        <View
          accessible
          accessibilityLabel={`${notificationTypeLabel(notification.tipo)}. ${
            notificationDetailText(notification.detalle)
          } Aviso informativo.`}
          style={styles.row}
        >
          {content}
        </View>
      )}
      {onMarkRead ? (
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={onMarkRead}
          style={styles.markRead}
        >
          <Text style={styles.markReadLabel}>Marcar como leída</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
  markRead: {
    alignSelf: 'flex-end',
    justifyContent: 'center',
    minHeight: 44,
    marginRight: spacing.lg,
    marginBottom: spacing.sm,
  },
  markReadLabel: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  text: { flex: 1, gap: 3 },
  title: { color: colors.text, fontSize: 15, fontWeight: '800' },
  detail: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  date: { color: colors.muted, fontSize: 12 },
  unread: { color: colors.primary, fontWeight: '700' },
});
