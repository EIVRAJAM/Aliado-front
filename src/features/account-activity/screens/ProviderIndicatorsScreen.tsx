import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { useProviderIndicators } from '../hooks/useProviderIndicators';

type ProviderIndicatorsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ProviderIndicators'
>;

interface IndicatorCardProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}

function IndicatorCard({ label, value, icon }: IndicatorCardProps) {
  return (
    <Card style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

export function ProviderIndicatorsScreen({
  navigation,
}: ProviderIndicatorsScreenProps) {
  const { session } = useAuthSession();
  const { indicators, loading, error, reload } = useProviderIndicators();

  if (!session) {
    return null;
  }

  if (session.role !== 'PRESTADOR') {
    return (
      <ScreenLayout
        title="Indicadores"
        subtitle="Resumen de actividad para Prestadores."
        onBack={() => navigation.goBack()}
      >
        <InlineMessage
          variant="info"
          message="Los indicadores están disponibles solo para cuentas de Prestador."
        />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout
      title="Indicadores"
      subtitle="Resumen de tu actividad y reputación como Prestador."
      onBack={() => navigation.goBack()}
    >
      <InlineMessage
        variant="info"
        message="Los valores provienen del cálculo del backend. La fórmula y el rango temporal definitivos están pendientes de aprobación; la app no calcula métricas."
      />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Cargando indicadores…</Text>
        </View>
      ) : error ? (
        <>
          <InlineMessage message={error} />
          <PrimaryButton label="Reintentar" variant="secondary" onPress={() => void reload()} />
        </>
      ) : !indicators ? (
        <>
          <InlineMessage
            variant="info"
            message="No se recibieron indicadores para esta cuenta. Actualiza para consultar de nuevo."
          />
          <PrimaryButton label="Actualizar" variant="secondary" onPress={() => void reload()} />
        </>
      ) : (
        <>
          <View style={styles.grid}>
            <IndicatorCard
              label="Total de servicios"
              value={String(indicators.totalServicios)}
              icon="layers-outline"
            />
            <IndicatorCard
              label="En curso"
              value={String(indicators.enCurso)}
              icon="hourglass-outline"
            />
            <IndicatorCard
              label="Finalizados"
              value={String(indicators.finalizados)}
              icon="checkmark-circle-outline"
            />
            <IndicatorCard
              label="Reputación"
              value={indicators.reputacion.toFixed(1)}
              icon="star-outline"
            />
            <IndicatorCard
              label="Calificaciones"
              value={String(indicators.cantidadCalificaciones)}
              icon="chatbubble-ellipses-outline"
            />
          </View>

          <Card style={styles.disclaimerCard}>
            <View style={styles.disclaimerHeader}>
              <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
              <Text style={styles.disclaimerTitle}>Sobre estos datos</Text>
            </View>
            <Text style={styles.disclaimerText}>
              No se muestra un periodo ni se recalcula la fórmula en la app. Los subtotales y la
              inclusión de servicios cancelados dependen del cálculo real del backend.
            </Text>
          </Card>

          <PrimaryButton label="Actualizar" variant="secondary" onPress={() => void reload()} />
        </>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: spacing.xs,
    minWidth: 140,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  disclaimerCard: {
    gap: spacing.sm,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  disclaimerTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  disclaimerText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
});
