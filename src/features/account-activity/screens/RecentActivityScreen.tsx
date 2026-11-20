import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { formatServiceDateTime } from '../../services/utils/service-format';
import { useRecentActivity } from '../hooks/useRecentActivity';
import { activityTypeLabel } from '../utils/account-activity-format';

type RecentActivityScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'RecentActivity'
>;

export function RecentActivityScreen({ navigation }: RecentActivityScreenProps) {
  const { items, loading, error, reload } = useRecentActivity();

  return (
    <ScreenLayout
      title="Actividad reciente"
      subtitle="Eventos visibles asociados a tu cuenta."
      onBack={() => navigation.goBack()}
    >
      <InlineMessage
        variant="info"
        message="Se muestran los eventos más recientes que devuelve el servidor para tu propia cuenta."
      />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Cargando actividad…</Text>
        </View>
      ) : error ? (
        <>
          <InlineMessage message={error} />
          <PrimaryButton label="Reintentar" variant="secondary" onPress={() => void reload()} />
        </>
      ) : items.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons name="time-outline" size={26} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Sin actividad reciente</Text>
          <Text style={styles.emptyText}>
            Aún no hay eventos visibles registrados para tu cuenta.
          </Text>
          <PrimaryButton label="Actualizar" variant="secondary" onPress={() => void reload()} />
        </Card>
      ) : (
        <>
          <View style={styles.list}>
            {items.map((item, index) => (
              <Card key={`${item.tipo}-${item.fecha}-${index}`} style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>{activityTypeLabel(item.tipo)}</Text>
                  </View>
                  <Text style={styles.activityDate}>{formatServiceDateTime(item.fecha)}</Text>
                </View>
                <Text style={styles.activitySummary}>{item.resumen}</Text>
              </Card>
            ))}
          </View>
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
  emptyCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  list: {
    gap: spacing.md,
  },
  activityCard: {
    gap: spacing.sm,
  },
  activityHeader: {
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
});
