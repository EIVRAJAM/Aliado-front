import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { MainTabParamList, RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { LinkButton } from '../../../shared/ui/LinkButton';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { SelectField } from '../../../shared/ui/SelectField';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { ProviderResultCard } from '../components/ProviderResultCard';
import { useDiscoveryCatalogs } from '../hooks/useDiscoveryCatalogs';
import { useProviderSearch } from '../hooks/useProviderSearch';

type DiscoveryScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Discovery'>,
  NativeStackScreenProps<RootStackParamList>
>;

interface FilterErrors {
  category?: string;
  zone?: string;
}

export function DiscoveryScreen({ navigation }: DiscoveryScreenProps) {
  const { session } = useAuthSession();

  if (!session) {
    return null;
  }

  if (session.role !== 'CLIENTE') {
    return (
      <ScreenLayout
        title="Buscar prestadores"
        subtitle="Esta sección pertenece a las cuentas de cliente."
      >
        <InlineMessage
          variant="info"
          message="Tu cuenta no tiene el rol Cliente, por lo que no puede buscar prestadores."
        />
      </ScreenLayout>
    );
  }

  return <ClientDiscoveryScreen navigation={navigation} />;
}

function ClientDiscoveryScreen({ navigation }: { navigation: DiscoveryScreenProps['navigation'] }) {
  const { catalogs, loading: catalogsLoading, error: catalogsError, reload } =
    useDiscoveryCatalogs();
  const { result, loading: searchLoading, error: searchError, searched, search, clear } =
    useProviderSearch();
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [zonaId, setZonaId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FilterErrors>({});

  const categoryOptions = (catalogs?.categories ?? []).map((category) => ({
    value: category.id,
    label: category.nombre,
  }));
  const zoneOptions = (catalogs?.zones ?? []).map((zone) => ({
    value: zone.id,
    label: zone.nombre,
    description: zone.coberturaGeografica ?? undefined,
  }));

  const handleSearch = () => {
    const nextErrors: FilterErrors = {};
    if (!categoriaId) {
      nextErrors.category = 'Selecciona una categoría.';
    }
    if (!zonaId) {
      nextErrors.zone = 'Selecciona una zona.';
    }
    setErrors(nextErrors);
    if (nextErrors.category || nextErrors.zone || !categoriaId || !zonaId) {
      return;
    }
    void search(categoriaId, zonaId);
  };

  const handleClear = () => {
    setCategoriaId(null);
    setZonaId(null);
    setErrors({});
    clear();
  };

  return (
    <ScreenLayout
      title="Buscar prestadores"
      subtitle="Encuentra prestadores por categoría y zona."
    >
      {catalogsLoading ? (
        <Card style={styles.stateCard}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.stateText}>Cargando categorías y zonas…</Text>
        </Card>
      ) : catalogsError ? (
        <>
          <InlineMessage message={catalogsError} />
          <PrimaryButton label="Reintentar" onPress={() => void reload()} />
        </>
      ) : (
        <>
          <Card style={styles.filterCard}>
            <View style={styles.filterHeader}>
              <View style={styles.filterIcon}>
                <Ionicons name="search-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.filterText}>
                <Text style={styles.filterTitle}>Criterios de búsqueda</Text>
                <Text style={styles.filterSubtitle}>
                  Selecciona una categoría y una zona para buscar.
                </Text>
              </View>
            </View>

            <SelectField
              label="Categoría"
              placeholder="Selecciona una categoría"
              value={categoriaId}
              options={categoryOptions}
              onChange={setCategoriaId}
              error={errors.category}
              disabled={searchLoading}
            />
            <SelectField
              label="Zona"
              placeholder="Selecciona una zona"
              value={zonaId}
              options={zoneOptions}
              onChange={setZonaId}
              error={errors.zone}
              hint="La búsqueda usa la zona aproximada del catálogo."
              disabled={searchLoading}
            />

            <PrimaryButton
              label="Buscar prestadores"
              onPress={handleSearch}
              loading={searchLoading}
              disabled={searchLoading}
            />
            <LinkButton label="Limpiar filtros" onPress={handleClear} />
          </Card>

          {searchLoading ? (
            <Card style={styles.stateCard}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.stateText}>Buscando prestadores…</Text>
            </Card>
          ) : searchError ? (
            <>
              <InlineMessage message={searchError} />
              <PrimaryButton label="Reintentar búsqueda" onPress={handleSearch} />
            </>
          ) : !searched || !result ? (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={28} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Encuentra un prestador</Text>
              <Text style={styles.emptyText}>
                Elige una categoría y una zona para ver prestadores compatibles.
              </Text>
            </Card>
          ) : result.sugerencias.length > 0 ? (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="sparkles-outline" size={28} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Revisa los criterios</Text>
              <Text style={styles.emptyText}>
                No encontramos esos criterios en el catálogo. Puedes probar con:
              </Text>
              <View style={styles.suggestions}>
                {result.sugerencias.map((suggestion) => (
                  <View key={suggestion} style={styles.suggestion}>
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </View>
                ))}
              </View>
              <LinkButton label="Ajustar criterios" onPress={handleClear} />
            </Card>
          ) : result.prestadores.length === 0 ? (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="search-outline" size={28} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptyText}>
                No encontramos prestadores con esa categoría y zona.
              </Text>
              <LinkButton label="Ajustar criterios" onPress={handleClear} />
            </Card>
          ) : (
            <>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>
                  {result.prestadores.length}{' '}
                  {result.prestadores.length === 1 ? 'prestador' : 'prestadores'}
                </Text>
                <Text style={styles.resultsHint}>Resultados para tus criterios.</Text>
              </View>
              <View style={styles.results}>
                {result.prestadores.map((provider) => (
                  <ProviderResultCard
                    key={provider.id}
                    provider={provider}
                    onPress={() =>
                      navigation.navigate('ProviderProfile', { providerId: provider.id })
                    }
                  />
                ))}
              </View>
            </>
          )}
        </>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  filterCard: {
    gap: spacing.lg,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  filterIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    flex: 1,
    gap: 2,
  },
  filterTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  filterSubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  stateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stateText: {
    color: colors.muted,
    fontSize: 14,
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.sm,
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
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  suggestion: {
    backgroundColor: colors.background,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  suggestionText: {
    color: colors.neutral,
    fontSize: 12,
  },
  resultsHeader: {
    gap: 2,
  },
  resultsTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  resultsHint: {
    color: colors.muted,
    fontSize: 12,
  },
  results: {
    gap: spacing.md,
  },
});
