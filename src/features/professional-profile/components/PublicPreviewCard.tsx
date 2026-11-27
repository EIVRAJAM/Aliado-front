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
import type { ProfessionalPreview, PublicReview } from '../types/professional-profile';
import {
  formatAvailability,
  formatReviewDate,
  ratingLabel,
  verificationLabel,
} from '../utils/professional-profile-format';

export function PublicPreviewCard({
  preview,
  onReportReview,
}: {
  preview: ProfessionalPreview;
  onReportReview?: (review: PublicReview) => void;
}) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const publicFields = PUBLIC_PROFILE_FIELDS.flatMap((field) => {
    const formatted = formatPublicValue(preview.datosGenerales[field.key]);
    return formatted ? [{ ...field, formatted }] : [];
  });
  const unsupportedPublicFields = PUBLIC_PROFILE_FIELDS.filter((field) => {
    const value = preview.datosGenerales[field.key];
    return value !== undefined && formatPublicValue(value) === null;
  }).length;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Ionicons name="eye-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Vista previa pública</Text>
          <Text style={styles.subtitle}>Así se muestra tu perfil a los clientes.</Text>
        </View>
        <View style={styles.readOnlyPill}>
          <Text style={styles.readOnlyText}>Solo lectura</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons name="star-outline" size={16} color={colors.warning} />
          <Text style={styles.statValue}>
            {ratingLabel(preview.reputacion, preview.cantidadCalificaciones)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.teal} />
          <Text style={styles.statValue}>{verificationLabel(preview.nivelVerificacion)}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.muted} />
          <Text style={styles.statValue}>
            {preview.resenas.length} {preview.resenas.length === 1 ? 'reseña' : 'reseñas'}
          </Text>
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.groupLabel}>Datos públicos</Text>
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
      </View>

      <View style={styles.group}>
        <Text style={styles.groupLabel}>Categorías</Text>
        <View style={styles.chips}>
          {preview.categorias.length > 0 ? (
            preview.categorias.map((category) => (
              <View key={category} style={styles.chip}>
                <Text style={styles.chipText}>{category}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>Sin categorías visibles.</Text>
          )}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.groupLabel}>Zonas de atención</Text>
        <View style={styles.chips}>
          {preview.zonas.length > 0 ? (
            preview.zonas.map((zone) => (
              <View key={zone} style={[styles.chip, styles.zoneChip]}>
                <Ionicons name="location-outline" size={12} color={colors.teal} />
                <Text style={[styles.chipText, styles.zoneChipText]}>{zone}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>Sin zonas visibles.</Text>
          )}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.groupLabel}>Disponibilidad</Text>
        {preview.disponibilidad.length > 0 ? (
          <View style={styles.availabilityList}>
            {preview.disponibilidad.map((block, index) => (
              <View key={block.id ?? `${block.diaSemana}-${index}`} style={styles.availabilityRow}>
                <Ionicons name="time-outline" size={14} color={colors.muted} />
                <Text style={styles.availabilityText}>{formatAvailability(block)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>Sin disponibilidad configurada.</Text>
        )}
      </View>

      <View style={styles.group}>
        <Text style={styles.groupLabel}>Reseñas visibles</Text>
        {preview.resenas.length > 0 ? (
          <View style={styles.reviewList}>
            {preview.resenas.map((review) => (
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
          <Text style={styles.empty}>Aún no hay reseñas visibles.</Text>
        )}
      </View>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={15} color={colors.muted} />
        <Text style={styles.noteText}>
          La experiencia, el portafolio y la agenda no se muestran en esta vista. La verificación
          básica no es una certificación legal.
        </Text>
      </View>
    </Card>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  readOnlyPill: {
    backgroundColor: colors.neutralSurface,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  readOnlyText: {
    color: colors.neutral,
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  statValue: {
    color: colors.neutral,
    fontSize: 12,
    fontWeight: '600',
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
  availabilityList: {
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
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  noteText: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
});
