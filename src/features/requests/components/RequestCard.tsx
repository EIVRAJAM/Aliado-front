import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { radii, spacing } from '../../../shared/ui/theme';
import type { RequestCatalogs, ServiceRequest } from '../types/request';
import {
  categoryName,
  formatRequestDate,
  requestSummary,
  requestUrgencyLabel,
  zoneName,
} from '../utils/request-format';
import { requestStatusTone, urgencyTone } from '../utils/request-visuals';
import { RequestStatusBadge } from './RequestStatusBadge';

interface RequestCardProps {
  request: ServiceRequest;
  catalogs: RequestCatalogs | null;
  onPress: () => void;
}

export function RequestCard({ request, catalogs, onPress }: RequestCardProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const statusTone = requestStatusTone(request.estado, colors);
  const urgency = request.urgencia ? urgencyTone(request.urgencia, colors) : null;
  const photoCount = request.fotos.length;

  return (
    <Card style={[styles.card, { borderLeftColor: statusTone.accent }]}>
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
          <View style={styles.categoryRow}>
            <Ionicons name="pricetag-outline" size={13} color={colors.primary} />
            <Text style={styles.category} numberOfLines={1}>
              {categoryName(catalogs, request.categoriaId)}
            </Text>
          </View>
          <RequestStatusBadge status={request.estado} />
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {requestSummary(request)}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={15} color={colors.muted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {zoneName(catalogs, request.zonaId)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons
              name="time-outline"
              size={15}
              color={urgency?.text ?? colors.muted}
            />
            <Text
              style={[styles.metaText, { color: urgency?.text ?? colors.muted }]}
              numberOfLines={1}
            >
              {requestUrgencyLabel(request.urgencia)}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.muted} />
            <Text style={styles.footerText}>{formatRequestDate(request.fechaCreacion)}</Text>
          </View>
          <View style={styles.footerRight}>
            {photoCount > 0 ? (
              <View style={styles.metaItem}>
                <Ionicons name="images-outline" size={14} color={colors.muted} />
                <Text style={styles.footerText}>
                  {photoCount} {photoCount === 1 ? 'foto' : 'fotos'}
                </Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={17} color={colors.chevron} />
          </View>
        </View>
      </Pressable>
    </Card>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    padding: 0,
    borderLeftWidth: 4,
    overflow: 'hidden',
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
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  category: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 23,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: spacing.lg,
    rowGap: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 0,
  },
  metaText: {
    color: colors.muted,
    fontSize: 13,
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  footerText: {
    color: colors.muted,
    fontSize: 12,
  },
});
