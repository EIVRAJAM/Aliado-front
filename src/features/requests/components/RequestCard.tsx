import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import type { RequestCatalogs, ServiceRequest } from '../types/request';
import {
  categoryName,
  formatRequestDate,
  requestSummary,
  requestUrgencyLabel,
  zoneName,
} from '../utils/request-format';
import { RequestStatusBadge } from './RequestStatusBadge';

interface RequestCardProps {
  request: ServiceRequest;
  catalogs: RequestCatalogs | null;
  onPress: () => void;
}

export function RequestCard({ request, catalogs, onPress }: RequestCardProps) {
  return (
    <Card style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${requestSummary(request)}. ${categoryName(
          catalogs,
          request.categoriaId
        )}. ${zoneName(catalogs, request.zonaId)}.`}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
      >
        <View style={styles.topRow}>
          <RequestStatusBadge status={request.estado} />
          <Text style={styles.date}>{formatRequestDate(request.fechaCreacion)}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {requestSummary(request)}
        </Text>
        <Text style={styles.meta}>
          {categoryName(catalogs, request.categoriaId)} ·{' '}
          {zoneName(catalogs, request.zonaId)}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.urgency}>
            Urgencia: {requestUrgencyLabel(request.urgencia)}
          </Text>
          {request.fotos.length > 0 ? (
            <Text style={styles.photos}>
              {request.fotos.length} foto{request.fotos.length === 1 ? '' : 's'}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  row: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  date: {
    color: colors.muted,
    fontSize: 12,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  urgency: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  photos: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});
