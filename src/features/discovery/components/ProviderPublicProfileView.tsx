import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import {
  PUBLIC_PROFILE_FIELDS,
  formatPublicValue,
} from '../../../shared/profile/public-profile-data';
import { ReportReviewLink } from '../../trust/components/ReportReviewLink';
import type { ProviderReview, PublicProvider } from '../types/discovery';
import {
  formatAvailability,
  formatReviewDate,
  providerDisplayName,
  ratingLabel,
  verificationLabel,
} from '../utils/discovery-format';

export function ProviderPublicProfileView({
  provider,
  onReportReview,
}: {
  provider: PublicProvider;
  onReportReview?: (review: ProviderReview) => void;
}) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const publicFields = PUBLIC_PROFILE_FIELDS.flatMap((field) => {
    const formatted = formatPublicValue(provider.datosGenerales[field.key]);
    return formatted ? [{ ...field, formatted }] : [];
  });
  const unsupportedPublicFields = PUBLIC_PROFILE_FIELDS.filter((field) => {
    const value = provider.datosGenerales[field.key];
    return value !== undefined && formatPublicValue(value) === null;
  }).length;

  return (
    <>
      <Card style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={28} color={colors.primary} />
          </View>
          <View style={styles.identity}>
            <Text style={styles.title}>{providerDisplayName(provider)}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={15} color={colors.warning} />
              <Text style={styles.ratingText}>
                {ratingLabel(provider.reputacionAgregada, provider.cantidadCalificaciones)}
              </Text>
            </View>
            <View style={styles.verificationRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.teal} />
              <Text style={styles.verificationText}>
                {verificationLabel(provider.nivelVerificacion)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupLabel}>Categorías</Text>
          <View style={styles.chips}>
            {provider.categorias.length > 0 ? (
              provider.categorias.map((category) => (
                <View key={category} style={styles.chip}>
                  <Text style={styles.chipText}>{category}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.empty}>Sin categorías públicas.</Text>
            )}
          </View>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupLabel}>Zonas de atención</Text>
          <View style={styles.chips}>
            {provider.zonas.length > 0 ? (
              provider.zonas.map((zone) => (
                <View key={zone} style={[styles.chip, styles.zoneChip]}>
                  <Ionicons name="location-outline" size={12} color={colors.teal} />
                  <Text style={[styles.chipText, styles.zoneChipText]}>{zone}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.empty}>Sin zonas públicas.</Text>
            )}
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconBadge}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Disponibilidad declarada</Text>
        </View>
        {provider.disponibilidad.length > 0 ? (
          <View style={styles.list}>
            {provider.disponibilidad.map((block, index) => (
              <View key={`${block.diaSemana}-${index}`} style={styles.availabilityRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.muted} />
                <Text style={styles.availabilityText}>{formatAvailability(block)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>Sin disponibilidad pública.</Text>
        )}
      </Card>

      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconBadge}>
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Datos públicos</Text>
        </View>
        {publicFields.length > 0 ? (
          <View style={styles.publicDataList}>
            {publicFields.map((field) => (
              <View key={field.key} style={styles.publicDataRow}>
                <Text style={styles.publicDataLabel}>{field.label}</Text>
                <Text style={styles.publicDataValue}>{field.formatted}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>Sin datos públicos configurados.</Text>
        )}
        {unsupportedPublicFields > 0 ? (
          <Text style={styles.unsupported}>
            Algunos datos públicos no se pudieron mostrar.
          </Text>
        ) : null}
      </Card>

      <Card style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconBadge}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Reseñas</Text>
          <Text style={styles.count}>{provider.resenas.length}</Text>
        </View>
        {provider.resenas.length > 0 ? (
          <View style={styles.reviewList}>
            {provider.resenas.map((review) => (
              <View key={review.id} style={styles.review}>
                <View style={styles.reviewHeader}>
                  <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Ionicons
                        key={value}
                        name={value <= review.valor ? 'star' : 'star-outline'}
                        size={14}
                        color={colors.warning}
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewDate}>{formatReviewDate(review.fechaCreacion)}</Text>
                </View>
                <Text style={styles.reviewText}>{review.texto}</Text>
                {onReportReview ? (
                  <ReportReviewLink onPress={() => onReportReview(review)} />
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>Aún no hay reseñas públicas.</Text>
        )}
      </Card>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={15} color={colors.muted} />
        <Text style={styles.noteText}>
          Este perfil no muestra nombre, contacto, dirección exacta, experiencia ni portafolio. El
          título se basa en las categorías del perfil. La verificación básica indica revisión de
          documentos por ALIADO; no es una certificación legal.
        </Text>
      </View>
    </>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  hero: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderTopWidth: 4,
    borderTopColor: colors.primary,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verificationText: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  count: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  group: {
    gap: spacing.sm,
  },
  groupLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: colors.infoSurface,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  chipText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  zoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.tealSurface,
  },
  zoneChipText: {
    color: colors.teal,
  },
  empty: {
    color: colors.muted,
    fontSize: 13,
  },
  list: {
    gap: spacing.xs,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  availabilityText: {
    color: colors.neutral,
    fontSize: 13,
  },
  publicDataList: {
    gap: spacing.sm,
  },
  publicDataRow: {
    gap: 2,
  },
  publicDataLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  publicDataValue: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  unsupported: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  reviewList: {
    gap: spacing.sm,
  },
  review: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
  reviewDate: {
    color: colors.muted,
    fontSize: 11,
  },
  reviewText: {
    color: colors.neutral,
    fontSize: 13,
    lineHeight: 19,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  noteText: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
});
