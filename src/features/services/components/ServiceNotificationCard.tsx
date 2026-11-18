import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import type { ServiceNotification } from '../types/service';
import { formatServiceDateTime } from '../utils/service-format';

export function ServiceNotificationCard({
  notification,
  onPress,
}: {
  notification: ServiceNotification;
  onPress: () => void;
}) {
  return (
    <Card style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${notification.detalle}. Abrir servicio.`}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
      >
        <View style={styles.iconBadge}>
          <Ionicons name="briefcase-outline" size={19} color={colors.primary} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>
            {notification.tipo === 'ACEPTACION_PROPUESTA'
              ? 'Propuesta aceptada'
              : 'Cambio de estado'}
          </Text>
          <Text style={styles.detail}>{notification.detalle}</Text>
          <Text style={styles.date}>{formatServiceDateTime(notification.fechaGeneracion)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
      </Pressable>
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
