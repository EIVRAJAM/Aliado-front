import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { MainTabParamList, RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { ServiceStateBadge } from '../../services/components/ServiceStateBadge';
import { formatServiceDateTime } from '../../services/utils/service-format';
import { useProviderIndicators } from '../hooks/useProviderIndicators';
import { useRecentActivity } from '../hooks/useRecentActivity';
import { useWorkHistory } from '../hooks/useWorkHistory';
import type { ProviderIndicators, RecentActivityItem, WorkHistoryItem } from '../types/account-activity';
import { activitySummaryText, activityTypeLabel } from '../utils/account-activity-format';

type ActivityScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Activity'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function ActivityScreen({ navigation }: ActivityScreenProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const { session } = useAuthSession();
  const indicatorsState = useProviderIndicators();
  const recentState = useRecentActivity();
  const historyState = useWorkHistory();

  if (!session) {
    return null;
  }

  const isProvider = session.role === 'PRESTADOR';
  const reloadAll = () => {
    void recentState.reload();
    void historyState.reload();
    if (isProvider) {
      void indicatorsState.reload();
    }
  };

  return (
    <ScreenLayout
      title="Actividad"
      subtitle="Historial y eventos asociados a tu cuenta."
    >
      <InlineMessage
        variant="info"
        message="Solo se muestra información autorizada de tu propia cuenta."
      />

      {isProvider ? (
        <ProviderSummary
          indicators={indicatorsState.indicators}
          loading={indicatorsState.loading}
          error={indicatorsState.error}
          onRetry={() => void indicatorsState.reload()}
        />
      ) : null}

      <RecentActivitySection
        items={recentState.items}
        loading={recentState.loading}
        error={recentState.error}
        onRetry={() => void recentState.reload()}
      />

      <WorkHistorySection
        items={historyState.items}
        loading={historyState.loading}
        error={historyState.error}
        onRetry={() => void historyState.reload()}
        onOpenHistory={() => navigation.navigate('WorkHistory')}
        onOpenService={(servicioId) => navigation.navigate('ServiceDetail', { servicioId })}
      />

      <PrimaryButton label="Actualizar" variant="secondary" onPress={reloadAll} />
    </ScreenLayout>
  );
}

function ProviderSummary({
  indicators,
  loading,
  error,
  onRetry,
}: {
  indicators: ProviderIndicators | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  return (
    <Card style={styles.summaryCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons name="stats-chart-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>Resumen del Prestador</Text>
          <Text style={styles.sectionSubtitle}>Resumen calculado por ALIADO.</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Cargando indicadores…</Text>
        </View>
      ) : error ? (
        <>
          <InlineMessage message={error} />
          <PrimaryButton label="Reintentar indicadores" variant="secondary" onPress={onRetry} />
        </>
      ) : !indicators ? (
        <InlineMessage variant="info" message="Aún no hay indicadores disponibles para esta cuenta." />
      ) : (
        <>
          <View style={styles.metricsRow}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricValue}>{indicators.totalServicios}</Text>
              <Text style={styles.metricLabel}>Servicios totales</Text>
              <Text style={styles.metricDetail}>
                {indicators.enCurso} en curso · {indicators.finalizados} finalizados
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricBlock}>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={20} color={colors.warning} />
                <Text style={styles.metricValue}>{indicators.reputacion.toFixed(1)}</Text>
              </View>
              <Text style={styles.metricLabel}>Reputación</Text>
              <Text style={styles.metricDetail}>
                {indicators.cantidadCalificaciones}{' '}
                {indicators.cantidadCalificaciones === 1 ? 'calificación' : 'calificaciones'}
              </Text>
            </View>
          </View>
          <Text style={styles.limitNote}>
            El periodo y la fórmula de estos indicadores aún no están definidos. La app no
            recalcula los valores.
          </Text>
        </>
      )}
    </Card>
  );
}

function RecentActivitySection({
  items,
  loading,
  error,
  onRetry,
}: {
  items: RecentActivityItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  return (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>Actividad reciente</Text>
          <Text style={styles.sectionSubtitle}>Últimos eventos visibles de tu cuenta.</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Cargando actividad…</Text>
        </View>
      ) : error ? (
        <>
          <InlineMessage message={error} />
          <PrimaryButton label="Reintentar actividad" variant="secondary" onPress={onRetry} />
        </>
      ) : items.length === 0 ? (
        <InlineMessage variant="info" message="No hay actividad reciente disponible." />
      ) : (
        <View style={styles.activityList}>
          {items.map((item, index) => (
            <View key={`${item.tipo}-${item.fecha}-${index}`} style={styles.activityItem}>
              <View style={styles.activityTop}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeText}>{activityTypeLabel(item.tipo)}</Text>
                </View>
                <Text style={styles.activityDate}>{formatServiceDateTime(item.fecha)}</Text>
              </View>
              <Text style={styles.activitySummary}>{activitySummaryText(item.resumen)}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

function WorkHistorySection({
  items,
  loading,
  error,
  onRetry,
  onOpenHistory,
  onOpenService,
}: {
  items: WorkHistoryItem[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpenHistory: () => void;
  onOpenService: (servicioId: string) => void;
}) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  return (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>Historial de trabajos</Text>
          <Text style={styles.sectionSubtitle}>Servicios en los que participaste.</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Cargando historial…</Text>
        </View>
      ) : error ? (
        <>
          <InlineMessage message={error} />
          <PrimaryButton label="Reintentar historial" variant="secondary" onPress={onRetry} />
        </>
      ) : items.length === 0 ? (
        <InlineMessage variant="info" message="Aún no tienes servicios registrados." />
      ) : (
        <View style={styles.historyList}>
          {items.slice(0, 3).map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`Abrir servicio ${item.estado}`}
              onPress={() => onOpenService(item.id)}
              style={({ pressed }) => [styles.historyItem, pressed ? styles.pressed : null]}
            >
              <View style={styles.historyInfo}>
                <Text style={styles.historyTitle}>Servicio contratado</Text>
                <Text style={styles.historyDate}>
                  {formatServiceDateTime(item.fechaContratacion)}
                </Text>
              </View>
              <ServiceStateBadge state={item.estado} />
            </Pressable>
          ))}
        </View>
      )}

      <PrimaryButton
        label="Ver historial completo"
        variant="secondary"
        onPress={onOpenHistory}
      />
    </Card>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  summaryCard: {
    gap: spacing.lg,
  },
  sectionCard: {
    gap: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    flex: 1,
    gap: 2,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 13,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.lg,
  },
  metricBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  metricDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  metricValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
  },
  metricLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  metricDetail: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  limitNote: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  activityList: {
    gap: spacing.md,
  },
  activityItem: {
    gap: spacing.xs,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  typeBadge: {
    borderRadius: radii.sm,
    backgroundColor: colors.infoSurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  typeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  activityDate: {
    color: colors.muted,
    fontSize: 11,
  },
  activitySummary: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  historyList: {
    gap: spacing.sm,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
  historyInfo: {
    flex: 1,
    gap: 2,
  },
  historyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  historyDate: {
    color: colors.muted,
    fontSize: 12,
  },
});
