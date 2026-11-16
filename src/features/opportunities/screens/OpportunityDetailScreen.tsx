import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { OpportunityStateView } from '../components/OpportunityStateView';
import { useOpportunityDetail } from '../hooks/useOpportunityDetail';
import type { Opportunity } from '../types/opportunity';
import {
  formatOpportunityDate,
  opportunitySummary,
  photoCountLabel,
  urgencyLabel,
  urgencyTone,
} from '../utils/opportunity-format';

type OpportunityDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'OpportunityDetail'
>;
type IconName = ComponentProps<typeof Ionicons>['name'];

export function OpportunityDetailScreen({
  navigation,
  route,
}: OpportunityDetailScreenProps) {
  const { session } = useAuthSession();

  if (!session) {
    return null;
  }

  if (session.role !== 'PRESTADOR') {
    return (
      <ScreenLayout
        title="Detalle de oportunidad"
        subtitle="Esta sección pertenece a las cuentas de prestador."
        onBack={() => navigation.goBack()}
      >
        <InlineMessage
          variant="info"
          message="Tu cuenta no tiene el rol Prestador, por lo que no puede consultar oportunidades."
        />
      </ScreenLayout>
    );
  }

  return (
    <ProviderOpportunityDetailScreen
      navigation={navigation}
      solicitudId={route.params.solicitudId}
    />
  );
}

function ProviderOpportunityDetailScreen({
  navigation,
  solicitudId,
}: {
  navigation: OpportunityDetailScreenProps['navigation'];
  solicitudId: string;
}) {
  const { opportunity, loading, notFound, error, reload } =
    useOpportunityDetail(solicitudId);

  return (
    <ScreenLayout
      title="Detalle de oportunidad"
      subtitle="Revisa la solicitud compatible antes de decidir."
      onBack={() => navigation.goBack()}
    >
      {loading || error ? (
        <OpportunityStateView
          loading={loading}
          error={error}
          onRetry={() => {
            void reload();
          }}
          loadingLabel="Consultando la oportunidad…"
        />
      ) : notFound || !opportunity ? (
        <Card style={styles.notFoundCard}>
          <View style={styles.notFoundIcon}>
            <Ionicons name="alert-circle-outline" size={26} color={colors.muted} />
          </View>
          <Text style={styles.notFoundTitle}>Oportunidad no disponible</Text>
          <Text style={styles.notFoundText}>
            No existe o ya no es compatible con tu perfil.
          </Text>
          <PrimaryButton
            label="Volver a oportunidades"
            variant="secondary"
            onPress={() => navigation.goBack()}
          />
        </Card>
      ) : (
        <OpportunityDetailContent opportunity={opportunity} />
      )}
    </ScreenLayout>
  );
}

function OpportunityDetailContent({
  opportunity,
}: {
  opportunity: Opportunity;
}) {
  const tone = urgencyTone(opportunity.urgencia);
  const summary = opportunitySummary(opportunity);

  return (
    <>
      <Card style={[styles.hero, { borderTopColor: tone.accent }]}>
        <View style={styles.heroTop}>
          <View style={styles.categoryRow}>
            <Ionicons name="pricetag-outline" size={14} color={colors.primary} />
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

        <Text style={styles.title}>{summary}</Text>

        <View style={styles.heroMeta}>
          <View style={styles.metaChip}>
            <Ionicons name="location-outline" size={15} color={colors.muted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {opportunity.zonaAproximada}
            </Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="calendar-outline" size={15} color={colors.muted} />
            <Text style={styles.metaText}>
              {formatOpportunityDate(opportunity.fechaCreacion)}
            </Text>
          </View>
          {opportunity.fotos.length > 0 ? (
            <View style={styles.metaChip}>
              <Ionicons name="images-outline" size={15} color={colors.muted} />
              <Text style={styles.metaText}>
                {photoCountLabel(opportunity.fotos.length)}
              </Text>
            </View>
          ) : null}
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Descripción</Text>
        </View>
        <Text style={styles.description}>
          {opportunity.descripcion?.trim() ||
            'El Cliente no agregó una descripción a esta solicitud.'}
        </Text>
      </Card>

      <Text style={styles.sectionLabel}>Resumen</Text>
      <View style={styles.grid}>
        <InfoTile icon="pricetag-outline" label="Categoría" value={opportunity.categoria} />
        <InfoTile
          icon="location-outline"
          label="Zona aproximada"
          value={opportunity.zonaAproximada}
        />
        <InfoTile
          icon="time-outline"
          label="Urgencia"
          value={urgencyLabel(opportunity.urgencia)}
          valueColor={tone.text}
        />
        <InfoTile
          icon="calendar-outline"
          label="Publicada"
          value={formatOpportunityDate(opportunity.fechaCreacion)}
        />
      </View>

      {opportunity.fotos.length > 0 ? (
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="images-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>{photoCountLabel(opportunity.fotos.length)}</Text>
          </View>
          <Text style={styles.description}>
            Las fotos aún no se pueden mostrar en la app porque el contrato actual solo entrega
            referencias internas, no una URL de descarga.
          </Text>
        </Card>
      ) : null}

      <Card style={styles.privacyCard}>
        <View style={styles.privacyIcon}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.teal} />
        </View>
        <View style={styles.privacyText}>
          <Text style={styles.privacyTitle}>Privacidad del Cliente</Text>
          <Text style={styles.privacyMessage}>
            No se muestra identidad, correo, teléfono ni dirección exacta del Cliente.
          </Text>
        </View>
      </Card>
    </>
  );
}

function InfoTile({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: IconName;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.tile}>
      <Ionicons name={icon} size={16} color={colors.muted} />
      <Text style={styles.tileLabel}>{label}</Text>
      <Text
        style={[styles.tileValue, valueColor ? { color: valueColor } : null]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderTopWidth: 4,
    gap: spacing.md,
    padding: spacing.xl,
  },
  heroTop: {
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
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 28,
  },
  heroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  metaText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  sectionCard: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  description: {
    color: colors.neutral,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 88,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 3,
  },
  tileLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  tileValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.teal,
  },
  privacyIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.tealSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyText: {
    flex: 1,
    gap: 3,
  },
  privacyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  privacyMessage: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  notFoundCard: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  notFoundIcon: {
    width: 60,
    height: 60,
    borderRadius: radii.xl,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  notFoundTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  notFoundText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
