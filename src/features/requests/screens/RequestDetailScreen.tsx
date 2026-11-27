import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ComponentProps } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { RequestStateView } from '../components/RequestStateView';
import { RequestStatusBadge } from '../components/RequestStatusBadge';
import { useRequestCatalogs } from '../hooks/useRequestCatalogs';
import { useRequestDetail } from '../hooks/useRequestDetail';
import { useRequestError } from '../hooks/useRequestError';
import { requestGateway } from '../services/request-gateway-instance';
import { isRequestOpen } from '../types/request';
import {
  categoryName,
  formatRequestDate,
  requestSummary,
  requestUrgencyLabel,
  zoneName,
} from '../utils/request-format';
import { requestStatusTone, urgencyTone } from '../utils/request-visuals';

type RequestDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'RequestDetail'>;
type IconName = ComponentProps<typeof Ionicons>['name'];
type Action = 'publish' | 'cancel';

export function RequestDetailScreen({ navigation, route }: RequestDetailScreenProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const { session } = useAuthSession();
  const detailState = useRequestDetail(route.params.requestId);
  const catalogsState = useRequestCatalogs();
  const resolveError = useRequestError();
  const [actionLoading, setActionLoading] = useState<Action | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const request = detailState.request;
  const catalogs = catalogsState.catalogs;
  const loading = detailState.loading || catalogsState.loading;
  const error = detailState.error ?? catalogsState.error;

  const reload = () => {
    void detailState.reload();
    void catalogsState.reload();
  };

  const handlePublish = async () => {
    if (!session || !request || actionLoading) {
      return;
    }

    setActionLoading('publish');
    setActionError(null);
    try {
      await requestGateway.publish(session.token, request.id);
      await detailState.reload();
      Alert.alert('Solicitud publicada', 'Ahora está visible para los prestadores de la zona.');
    } catch (publishError) {
      const message = resolveError(
        publishError,
        'No fue posible publicar la solicitud. Intenta de nuevo.'
      );
      if (message) {
        setActionError(message);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const performCancel = async () => {
    if (!session || !request || actionLoading) {
      return;
    }

    setActionLoading('cancel');
    setActionError(null);
    try {
      await requestGateway.cancel(session.token, request.id);
      await detailState.reload();
      Alert.alert('Solicitud cancelada', 'La solicitud dejó de estar disponible para prestadores.');
    } catch (cancelError) {
      const message = resolveError(
        cancelError,
        'No fue posible cancelar la solicitud. Intenta de nuevo.'
      );
      if (message) {
        setActionError(message);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar solicitud',
      'La solicitud dejará de estar visible para prestadores. Esta acción no se puede deshacer.',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Cancelar solicitud',
          style: 'destructive',
          onPress: () => {
            void performCancel();
          },
        },
      ]
    );
  };

  return (
    <ScreenLayout
      title="Detalle de solicitud"
      subtitle="Revisa la información y el estado de tu solicitud."
      onBack={() => navigation.goBack()}
    >
      {loading || error || !request ? (
        <RequestStateView loading={loading} error={error} onRetry={reload} />
      ) : (
        <>
          <Card
            style={[
              styles.hero,
              {
                borderTopColor: requestStatusTone(request.estado, colors).accent,
              },
            ]}
          >
            <View style={styles.heroTop}>
              <View style={styles.categoryRow}>
                <Ionicons name="pricetag-outline" size={14} color={colors.primary} />
                <Text style={styles.category} numberOfLines={1}>
                  {categoryName(catalogs, request.categoriaId)}
                </Text>
              </View>
              <RequestStatusBadge status={request.estado} />
            </View>

            <Text style={styles.title}>{requestSummary(request)}</Text>

            <View style={styles.heroMeta}>
              <View style={styles.metaChip}>
                <Ionicons name="location-outline" size={15} color={colors.muted} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {zoneName(catalogs, request.zonaId)}
                </Text>
              </View>
              {request.urgencia ? (
                <View
                  style={[
                    styles.metaChip,
                    { backgroundColor: urgencyTone(request.urgencia, colors).background },
                  ]}
                >
                  <Ionicons
                    name="time-outline"
                    size={15}
                    color={urgencyTone(request.urgencia, colors).text}
                  />
                  <Text
                    style={[
                      styles.metaText,
                      { color: urgencyTone(request.urgencia, colors).text },
                    ]}
                  >
                    {requestUrgencyLabel(request.urgencia)}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.heroFooter}>
              <Ionicons name="calendar-outline" size={14} color={colors.muted} />
              <Text style={styles.heroFooterText}>
                Creada el {formatRequestDate(request.fechaCreacion)}
              </Text>
            </View>
          </Card>

          {actionError ? <InlineMessage message={actionError} /> : null}

          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.grid}>
            <InfoTile
              icon="location-outline"
              label="Zona"
              value={zoneName(catalogs, request.zonaId)}
            />
            <InfoTile
              icon="time-outline"
              label="Urgencia"
              value={requestUrgencyLabel(request.urgencia)}
              valueColor={request.urgencia ? urgencyTone(request.urgencia, colors).text : undefined}
            />
            <InfoTile
              icon="images-outline"
              label="Fotos"
              value={
                request.fotos.length === 0
                  ? 'Sin fotos'
                  : `${request.fotos.length} ${
                      request.fotos.length === 1 ? 'foto' : 'fotos'
                    }`
              }
            />
            <InfoTile
              icon="calendar-outline"
              label="Actualizada"
              value={formatRequestDate(request.fechaActualizacion)}
            />
          </View>

          {isRequestOpen(request) ? (
            <>
              <Text style={styles.sectionTitle}>Acciones</Text>
              <View style={styles.actions}>
                {request.estado === 'PUBLICADA' ? (
                  <PrimaryButton
                    label="Ver propuestas recibidas"
                    variant="secondary"
                    onPress={() =>
                      navigation.navigate('ReceivedProposals', { solicitudId: request.id })
                    }
                    disabled={actionLoading !== null}
                  />
                ) : null}
                {request.estado === 'BORRADOR' ? (
                  <PrimaryButton
                    label="Publicar solicitud"
                    onPress={() => {
                      void handlePublish();
                    }}
                    loading={actionLoading === 'publish'}
                    disabled={actionLoading !== null}
                  />
                ) : null}
                <PrimaryButton
                  label="Editar solicitud"
                  variant="secondary"
                  onPress={() => navigation.navigate('RequestForm', { requestId: request.id })}
                  disabled={actionLoading !== null}
                />
                <PrimaryButton
                  label="Cancelar solicitud"
                  variant="danger"
                  onPress={handleCancel}
                  loading={actionLoading === 'cancel'}
                  disabled={actionLoading !== null}
                />
              </View>
            </>
          ) : (
            <Card
              style={[
                styles.closedCard,
                { borderLeftColor: requestStatusTone(request.estado, colors).accent },
              ]}
            >
              <View style={styles.closedIcon}>
                <Ionicons
                  name={
                    request.estado === 'CANCELADA'
                      ? 'ban-outline'
                      : 'checkmark-circle-outline'
                  }
                  size={22}
                  color={requestStatusTone(request.estado, colors).text}
                />
              </View>
              <View style={styles.closedText}>
                <Text style={styles.closedTitle}>
                  {request.estado === 'CANCELADA'
                    ? 'Solicitud cancelada'
                    : 'Solicitud contratada'}
                </Text>
                <Text style={styles.closedMessage}>
                  {request.estado === 'CANCELADA'
                    ? 'Esta solicitud ya no admite cambios.'
                    : 'La solicitud ya fue contratada y no admite cambios.'}
                </Text>
              </View>
            </Card>
          )}
        </>
      )}
    </ScreenLayout>
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
  const { colors } = useAppTheme();
  const styles = useStyles();
  return (
    <View style={styles.tile}>
      <Ionicons name={icon} size={16} color={colors.muted} />
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileValue, valueColor ? { color: valueColor } : null]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  heroFooterText: {
    color: colors.muted,
    fontSize: 12,
  },
  sectionTitle: {
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
  actions: {
    gap: spacing.sm,
  },
  closedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderLeftWidth: 4,
    padding: spacing.lg,
  },
  closedIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedText: {
    flex: 1,
    gap: 2,
  },
  closedTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  closedMessage: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});
