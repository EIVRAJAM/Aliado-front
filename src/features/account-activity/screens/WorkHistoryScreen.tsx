import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { ServiceStateBadge } from '../../services/components/ServiceStateBadge';
import { formatServiceDateTime } from '../../services/utils/service-format';
import { useHistoryExport } from '../hooks/useHistoryExport';
import { useWorkHistory } from '../hooks/useWorkHistory';

type WorkHistoryScreenProps = NativeStackScreenProps<RootStackParamList, 'WorkHistory'>;

export function WorkHistoryScreen({ navigation }: WorkHistoryScreenProps) {
  const {
    items,
    loading,
    loadingMore,
    error,
    moreError,
    hasMore,
    reload,
    loadMore,
  } = useWorkHistory();
  const { exporting, exportError, exportMessage, exportHistory } = useHistoryExport();

  return (
    <ScreenLayout
      title="Historial de trabajos"
      subtitle="Servicios en los que participaste como Cliente o Prestador."
      onBack={() => navigation.goBack()}
    >
      <InlineMessage
        variant="info"
        message="Solo aparecen los servicios asociados a tu cuenta. El historial no se modifica al exportarlo."
      />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Cargando historial…</Text>
        </View>
      ) : error ? (
        <>
          <InlineMessage message={error} />
          <PrimaryButton label="Reintentar" variant="secondary" onPress={() => void reload()} />
        </>
      ) : items.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons name="file-tray-outline" size={26} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Historial vacío</Text>
          <Text style={styles.emptyText}>
            Aún no tienes servicios registrados en los que hayas participado.
          </Text>
          <PrimaryButton label="Actualizar" variant="secondary" onPress={() => void reload()} />
        </Card>
      ) : (
        <>
          <View style={styles.list}>
            {items.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`Abrir servicio ${item.id.slice(0, 8)}, ${item.estado}`}
                onPress={() => navigation.navigate('ServiceDetail', { servicioId: item.id })}
                style={({ pressed }) => [pressed ? styles.cardPressed : null]}
              >
                <Card style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <View style={styles.historyTitleWrap}>
                      <Text style={styles.historyTitle}>Servicio contratado</Text>
                      <Text style={styles.historyId}>ID {item.id.slice(0, 8)}…</Text>
                    </View>
                    <ServiceStateBadge state={item.estado} />
                  </View>
                  <View style={styles.historyFooter}>
                    <Text style={styles.historyDate}>
                      {formatServiceDateTime(item.fechaContratacion)}
                    </Text>
                    <Text style={styles.historyAction}>Ver servicio ›</Text>
                  </View>
                </Card>
              </Pressable>
            ))}
          </View>

          {moreError ? <InlineMessage message={moreError} /> : null}
          {hasMore ? (
            <PrimaryButton
              label={loadingMore ? 'Cargando más…' : 'Cargar más'}
              variant="secondary"
              loading={loadingMore}
              onPress={() => void loadMore()}
            />
          ) : (
            <Text style={styles.listEnd}>No hay más servicios para mostrar.</Text>
          )}

          <Card style={styles.exportCard}>
            <View style={styles.exportHeader}>
              <View style={styles.exportIcon}>
                <Ionicons name="download-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.exportText}>
                <Text style={styles.exportTitle}>Exportar historial</Text>
                <Text style={styles.exportDescription}>
                  Genera un CSV con todo tu historial actual y abre el menú del sistema para
                  guardarlo o compartirlo.
                </Text>
              </View>
            </View>
            {exportError ? <InlineMessage message={exportError} /> : null}
            {exportMessage ? <InlineMessage variant="success" message={exportMessage} /> : null}
            <PrimaryButton
              label={exporting ? 'Generando exportación…' : 'Exportar todo mi historial'}
              variant="secondary"
              loading={exporting}
              disabled={items.length === 0}
              onPress={() => void exportHistory()}
            />
          </Card>
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
  cardPressed: {
    opacity: 0.85,
  },
  historyCard: {
    gap: spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  historyTitleWrap: {
    flex: 1,
    gap: 2,
  },
  historyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  historyId: {
    color: colors.muted,
    fontSize: 11,
  },
  historyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  historyDate: {
    color: colors.muted,
    fontSize: 12,
  },
  historyAction: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  listEnd: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  exportCard: {
    gap: spacing.md,
  },
  exportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  exportIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportText: {
    flex: 1,
    gap: 2,
  },
  exportTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  exportDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
});
