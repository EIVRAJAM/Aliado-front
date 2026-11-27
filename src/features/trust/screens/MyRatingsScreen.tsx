import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { RatingHistoryCard } from '../components/RatingHistoryCard';
import { useMyRatings } from '../hooks/useMyRatings';

type MyRatingsScreenProps = NativeStackScreenProps<RootStackParamList, 'MyRatings'>;

export function MyRatingsScreen({ navigation }: MyRatingsScreenProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const { session } = useAuthSession();
  const {
    ratings,
    loading,
    loadingMore,
    error,
    unavailable,
    totalElements,
    hasMore,
    reload,
    loadMore,
  } = useMyRatings();

  if (!session) {
    return null;
  }

  if (session.role !== 'CLIENTE') {
    return (
      <ScreenLayout
        title="Mis calificaciones y reseñas"
        subtitle="Historial privado del Cliente."
        onBack={() => navigation.goBack()}
      >
        <InlineMessage
          variant="info"
          message="Esta sección pertenece a las cuentas de Cliente."
        />
      </ScreenLayout>
    );
  }

  const countLabel = loading
    ? 'Cargando historial…'
    : unavailable
      ? 'Operación no disponible'
      : error
        ? 'No se pudo cargar'
        : `${totalElements} ${
            totalElements === 1 ? 'calificación' : 'calificaciones'
          }`;

  return (
    <ScreenLayout
      title="Mis calificaciones y reseñas"
      subtitle="Historial privado de los servicios que calificaste."
      onBack={() => navigation.goBack()}
    >
      <View style={styles.toolbar}>
        <View style={styles.toolbarText}>
          <Text style={styles.count}>{countLabel}</Text>
          <Text style={styles.hint}>
            Solo incluye tus calificaciones. No muestra las reseñas recibidas por un Prestador.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Actualizar historial"
          onPress={() => {
            void reload();
          }}
          style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {loading ? (
        <Card style={styles.loadingCard}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Cargando tus calificaciones…</Text>
        </Card>
      ) : unavailable ? (
        <Card style={styles.unavailableCard}>
          <View style={styles.unavailableIcon}>
            <Ionicons name="cloud-offline-outline" size={26} color={colors.warning} />
          </View>
          <Text style={styles.unavailableTitle}>Historial aún no disponible</Text>
          <Text style={styles.unavailableText}>
            Aún no podemos consultar tus calificaciones. Por eso no podemos confirmar si tienes
            reseñas ni mostrar un historial.
          </Text>
          <Text style={styles.unavailableHint}>
            Esta función aún no está disponible. No mostramos datos de ejemplo ni reseñas
            públicas de Prestadores.
          </Text>
          <PrimaryButton
            label="Volver a comprobar"
            variant="secondary"
            onPress={() => {
              void reload();
            }}
          />
        </Card>
      ) : error ? (
        <>
          <InlineMessage message={error} />
          <PrimaryButton
            label="Reintentar"
            onPress={() => {
              void reload();
            }}
          />
        </>
      ) : ratings.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons name="star-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Aún no tienes calificaciones</Text>
          <Text style={styles.emptyText}>
            Cuando califiques un servicio finalizado, aparecerá aquí con su reseña si la
            registraste.
          </Text>
        </Card>
      ) : (
        <>
          <View style={styles.list}>
            {ratings.map((rating) => (
              <RatingHistoryCard key={rating.calificacionId} rating={rating} />
            ))}
          </View>
          {hasMore ? (
            <PrimaryButton
              label="Cargar más"
              variant="secondary"
              loading={loadingMore}
              onPress={() => {
                void loadMore();
              }}
            />
          ) : null}
        </>
      )}
    </ScreenLayout>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  toolbarText: { flex: 1, gap: 2 },
  count: { color: colors.text, fontSize: 18, fontWeight: '800' },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.background },
  loadingCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  loadingText: { color: colors.muted, fontSize: 14 },
  unavailableCard: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl },
  unavailableIcon: {
    width: 60,
    height: 60,
    borderRadius: radii.xl,
    backgroundColor: colors.warningSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailableTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  unavailableText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  unavailableHint: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptyCard: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: radii.xl,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  list: { gap: spacing.md },
});
