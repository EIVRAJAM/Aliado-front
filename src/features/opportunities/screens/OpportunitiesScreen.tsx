import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
import { OpportunityCard } from '../components/OpportunityCard';
import { OpportunityFilterModal } from '../components/OpportunityFilterModal';
import { OpportunityStateView } from '../components/OpportunityStateView';
import { useOpportunitiesBoard } from '../hooks/useOpportunitiesBoard';

type OpportunitiesScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Opportunities'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function OpportunitiesScreen({ navigation }: OpportunitiesScreenProps) {
  const { session } = useAuthSession();

  if (!session) {
    return null;
  }

  if (session.role !== 'PRESTADOR') {
    return (
      <ScreenLayout
        title="Oportunidades"
        subtitle="Esta sección pertenece a las cuentas de prestador."
      >
        <InlineMessage
          variant="info"
          message="Tu cuenta no tiene el rol Prestador, por lo que no puede consultar oportunidades."
        />
      </ScreenLayout>
    );
  }

  return <ProviderOpportunitiesScreen navigation={navigation} />;
}

function ProviderOpportunitiesScreen({
  navigation,
}: {
  navigation: OpportunitiesScreenProps['navigation'];
}) {
  const {
    categories,
    categoriesLoading,
    categoriesError,
    opportunities,
    filters,
    loading,
    error,
    applyFilters,
    clearFilters,
    reload,
    reloadCategories,
  } = useOpportunitiesBoard();
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const hasAppliedFilters = Boolean(filters.categoriaId || filters.urgencia);

  const countLabel = loading
    ? 'Cargando oportunidades…'
    : error
      ? 'No se pudieron cargar'
      : `${opportunities.length} ${
          opportunities.length === 1 ? 'oportunidad' : 'oportunidades'
        }`;

  return (
    <ScreenLayout
      title="Oportunidades"
      subtitle="Revisa solicitudes compatibles con tu perfil y tu disponibilidad."
    >
      <View style={styles.toolbar}>
        <Text style={styles.count}>{countLabel}</Text>
        <View style={styles.toolbarActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              hasAppliedFilters
                ? 'Filtros activos. Abrir filtros.'
                : 'Abrir filtros'
            }
            accessibilityHint="Abre las opciones de categoría y urgencia."
            onPress={() => setFilterModalVisible(true)}
            style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
          >
            <Ionicons name="funnel-outline" size={20} color={colors.primary} />
            {hasAppliedFilters ? <View style={styles.filterDot} /> : null}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Actualizar oportunidades"
            onPress={() => {
              void reload();
            }}
            style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.primary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notificaciones"
            onPress={() => navigation.navigate('Notifications')}
            style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {loading || error ? (
        <OpportunityStateView
          loading={loading}
          error={error}
          onRetry={() => {
            void reload();
          }}
          loadingLabel="Cargando oportunidades compatibles…"
        />
      ) : opportunities.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name={hasAppliedFilters ? 'filter-outline' : 'briefcase-outline'}
              size={28}
              color={colors.primary}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {hasAppliedFilters
              ? 'Sin resultados con estos filtros'
              : 'Aún no hay oportunidades compatibles'}
          </Text>
          <Text style={styles.emptyText}>
            {hasAppliedFilters
              ? 'No hay oportunidades compatibles que cumplan los filtros seleccionados.'
              : 'No hay coincidencias disponibles en este momento. Puedes revisar las categorías, zonas y disponibilidad de tu perfil profesional.'}
          </Text>
          {hasAppliedFilters ? (
            <PrimaryButton
              label="Limpiar filtros"
              variant="secondary"
              onPress={clearFilters}
            />
          ) : (
            <PrimaryButton
              label="Revisar Perfil profesional"
              variant="secondary"
              onPress={() => navigation.navigate('ProfessionalProfile')}
            />
          )}
        </Card>
      ) : (
        <View style={styles.list}>
          {opportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.solicitudId}
              opportunity={opportunity}
              onPress={() =>
                navigation.navigate('OpportunityDetail', {
                  solicitudId: opportunity.solicitudId,
                })
              }
            />
          ))}
        </View>
      )}

      <OpportunityFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        categories={categories}
        categoriesLoading={categoriesLoading}
        categoriesError={categoriesError}
        onRetryCategories={() => {
          void reloadCategories();
        }}
        filters={filters}
        onApply={applyFilters}
        onClear={clearFilters}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  count: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    flexShrink: 1,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    position: 'relative',
    width: 42,
    height: 42,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.background,
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  list: {
    gap: spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
