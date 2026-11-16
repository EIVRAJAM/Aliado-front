import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import type { OpportunityNotification } from '../types/opportunity';
import { formatOpportunityDate } from '../utils/opportunity-format';

interface OpportunityNotificationCardProps {
  notification: OpportunityNotification;
  onPress: () => void;
}

export function OpportunityNotificationCard({
  notification,
  onPress,
}: OpportunityNotificationCardProps) {
  const canOpen = Boolean(notification.solicitudId);

  return (
    <Card style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          canOpen
            ? `${notification.detalle}. Abrir oportunidad.`
            : `${notification.detalle}. Sin solicitud asociada.`
        }
        accessibilityState={{ disabled: !canOpen }}
        disabled={!canOpen}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
      >
        <View style={styles.iconBadge}>
          <Ionicons name="notifications-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>Nueva oportunidad</Text>
          <Text style={styles.detail}>{notification.detalle}</Text>
          <View style={styles.footer}>
            <Ionicons name="calendar-outline" size={13} color={colors.muted} />
            <Text style={styles.date}>
              {formatOpportunityDate(notification.fechaGeneracion)}
            </Text>
          </View>
          {!canOpen ? (
            <Text style={styles.unavailable}>Sin solicitud asociada.</Text>
          ) : null}
        </View>
        {canOpen ? (
          <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
        ) : null}
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
  },
  pressed: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  detail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  date: {
    color: colors.muted,
    fontSize: 12,
  },
  unavailable: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '600',
  },
});
