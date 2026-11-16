import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import type { Opportunity } from '../types/opportunity';
import {
  formatOpportunityDate,
  opportunitySummary,
  photoCountLabel,
  urgencyLabel,
  urgencyTone,
} from '../utils/opportunity-format';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onPress: () => void;
}

export function OpportunityCard({ opportunity, onPress }: OpportunityCardProps) {
  const tone = urgencyTone(opportunity.urgencia);
  const summary = opportunitySummary(opportunity);

  return (
    <Card style={[styles.card, { borderLeftColor: tone.accent }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${summary}. ${opportunity.categoria}. ${
          opportunity.zonaAproximada
        }. Urgencia ${urgencyLabel(opportunity.urgencia)}.`}
        accessibilityHint="Abre el detalle de la oportunidad."
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
      >
        <View style={styles.topRow}>
          <View style={styles.categoryRow}>
            <Ionicons name="pricetag-outline" size={13} color={colors.primary} />
            <Text style={styles.category} numberOfLines={1}>
              {opportunity.categoria}
            </Text>
          </View>
          <View style={[styles.urgencyBadge, { backgroundColor: tone.background }]}>
            <View style={[styles.urgencyDot, { backgroundColor: tone.text }]} />
            <Text style={[styles.urgencyText, { color: tone.text }]}>
              {urgencyLabel(opportunity.urgencia)}
            </Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {summary}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={15} color={colors.muted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {opportunity.zonaAproximada}
            </Text>
          </View>
          {opportunity.fotos.length > 0 ? (
            <View style={styles.metaItem}>
              <Ionicons name="images-outline" size={15} color={colors.muted} />
              <Text style={styles.metaText}>
                {photoCountLabel(opportunity.fotos.length)}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.muted} />
            <Text style={styles.footerText}>
              Publicada el {formatOpportunityDate(opportunity.fechaCreacion)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color={colors.chevron} />
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
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
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  urgencyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '700',
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
  footerText: {
    color: colors.muted,
    fontSize: 12,
    flexShrink: 1,
  },
});
