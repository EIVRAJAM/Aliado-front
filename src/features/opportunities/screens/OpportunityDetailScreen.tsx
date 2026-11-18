import Ionicons from '@expo/vector-icons/Ionicons';
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
  formatOpportunityReference,
  photoCountLabel,
  urgencyLabel,
  urgencyTone,
} from '../utils/opportunity-format';

type OpportunityDetailScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'OpportunityDetail'
>;

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
        <OpportunityDetailContent
          opportunity={opportunity}
          onPropose={() =>
            navigation.navigate('ProposalFlow', {
              solicitudId: opportunity.solicitudId,
              opportunity: {
                categoria: opportunity.categoria,
                zonaAproximada: opportunity.zonaAproximada,
                urgencia: opportunity.urgencia,
                descripcion: opportunity.descripcion,
              },
            })
          }
        />
      )}
    </ScreenLayout>
  );
}

function OpportunityDetailContent({
  opportunity,
  onPropose,
}: {
  opportunity: Opportunity;
  onPropose: () => void;
}) {
  const tone = urgencyTone(opportunity.urgencia);
  const description = opportunity.descripcion?.trim() ?? '';
  const hasDescription = description.length > 0;
  const photoCount = opportunity.fotos.length;

  return (
    <>
      <Card style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.categoryRow}>
            <Ionicons name="pricetag-outline" size={14} color={colors.primary} />
            <Text style={styles.category} numberOfLines={1}>
              {opportunity.categoria}
            </Text>
          </View>
          <View
            accessibilityLabel={`Urgencia ${urgencyLabel(opportunity.urgencia)}`}
            style={[styles.urgencyBadge, { backgroundColor: tone.background }]}
          >
            <View style={[styles.urgencyDot, { backgroundColor: tone.text }]} />
            <Text style={[styles.urgencyText, { color: tone.text }]}>
              Urgencia {urgencyLabel(opportunity.urgencia)}
            </Text>
          </View>
        </View>

        <View style={styles.zoneRow}>
          <Ionicons name="location-outline" size={15} color={colors.muted} />
          <Text style={styles.zoneLabel}>Zona aproximada</Text>
          <Text style={styles.zoneValue} numberOfLines={1}>
            {opportunity.zonaAproximada}
          </Text>
        </View>

        <View style={styles.descriptionBlock}>
          <Text style={styles.descriptionLabel}>Descripción</Text>
          <Text
            style={[styles.description, hasDescription ? null : styles.descriptionEmpty]}
          >
            {hasDescription ? description : 'La solicitud no incluye una descripción.'}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.muted} />
            <Text style={styles.metaText}>
              Publicada el {formatOpportunityDate(opportunity.fechaCreacion)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="document-text-outline" size={14} color={colors.muted} />
            <Text style={styles.metaText}>
              {formatOpportunityReference(opportunity.solicitudId)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="images-outline" size={14} color={colors.muted} />
            <Text style={styles.metaText}>{photoCountLabel(photoCount)}</Text>
          </View>
        </View>
      </Card>

      {photoCount > 0 ? (
        <View style={styles.photoNotice}>
          <Ionicons name="images-outline" size={16} color={colors.info} />
          <Text style={styles.photoNoticeText}>
            Las fotos no pueden abrirse: el contrato actual entrega solo referencias internas, no
            una URL de descarga.
          </Text>
        </View>
      ) : null}

      <View style={styles.privacyNotice}>
        <Ionicons name="shield-checkmark-outline" size={16} color={colors.teal} />
        <Text style={styles.privacyText}>
          Solo se muestran los datos autorizados para Prestador. No se incluye nombre, contacto
          ni dirección exacta del Cliente, estado, horarios ni precio.
        </Text>
      </View>

      <PrimaryButton label="Enviar propuesta" onPress={onPropose} />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.xl,
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
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  zoneLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  zoneValue: {
    color: colors.text,
    fontSize: 13,
    flexShrink: 1,
  },
  descriptionBlock: {
    gap: spacing.xs,
  },
  descriptionLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  description: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '500',
    lineHeight: 27,
  },
  descriptionEmpty: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    color: colors.muted,
    fontSize: 12,
    flexShrink: 1,
  },
  photoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.infoSurface,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  photoNoticeText: {
    flex: 1,
    color: colors.info,
    fontSize: 12,
    lineHeight: 17,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.tealSurface,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  privacyText: {
    flex: 1,
    color: colors.neutral,
    fontSize: 12,
    lineHeight: 17,
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
