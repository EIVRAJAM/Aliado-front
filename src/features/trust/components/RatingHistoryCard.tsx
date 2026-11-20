import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import type { ClientRating } from '../types/trust';
import { formatHistoryDate } from '../utils/trust-format';

export function RatingHistoryCard({ rating }: { rating: ClientRating }) {
  const service = rating.servicio;
  const providerName = rating.prestador?.nombrePublico?.trim();
  const title = service?.descripcion?.trim() || 'Servicio sin descripción';

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Ionicons name="star" size={18} color={colors.warning} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.date}>
            Calificado el {formatHistoryDate(rating.fechaCalificacion)}
          </Text>
        </View>
      </View>

      <View style={styles.ratingRow}>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Ionicons
              key={value}
              name={value <= rating.valor ? 'star' : 'star-outline'}
              size={17}
              color={colors.warning}
            />
          ))}
        </View>
        <Text style={styles.ratingText}>{rating.valor}/5</Text>
      </View>

      {service?.categoria || service?.zonaAproximada ? (
        <View style={styles.metaRow}>
          {service.categoria ? (
            <View style={styles.metaItem}>
              <Ionicons name="pricetag-outline" size={13} color={colors.muted} />
              <Text style={styles.metaText}>{service.categoria}</Text>
            </View>
          ) : null}
          {service.zonaAproximada ? (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color={colors.muted} />
              <Text style={styles.metaText}>{service.zonaAproximada}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {providerName ? (
        <Text style={styles.provider}>Prestador: {providerName}</Text>
      ) : null}

      {rating.resena ? (
        <View style={styles.review}>
          <Text style={styles.reviewLabel}>Tu reseña</Text>
          <Text style={styles.reviewText}>{rating.resena.texto}</Text>
          <Text style={styles.reviewDate}>
            {formatHistoryDate(rating.resena.fechaCreacion)}
          </Text>
        </View>
      ) : (
        <Text style={styles.emptyReview}>Sin reseña registrada.</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.warningSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 2 },
  title: { color: colors.text, fontSize: 16, fontWeight: '800', lineHeight: 21 },
  date: { color: colors.muted, fontSize: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { color: colors.muted, fontSize: 12 },
  provider: { color: colors.teal, fontSize: 12, fontWeight: '600' },
  review: {
    gap: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.border,
    paddingLeft: spacing.md,
  },
  reviewLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  reviewText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  reviewDate: { color: colors.muted, fontSize: 11 },
  emptyReview: { color: colors.muted, fontSize: 12, fontStyle: 'italic' },
});
