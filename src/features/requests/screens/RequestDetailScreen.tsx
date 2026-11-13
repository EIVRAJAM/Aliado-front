import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, spacing } from '../../../shared/ui/theme';
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

type RequestDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'RequestDetail'>;

type Action = 'publish' | 'cancel';

export function RequestDetailScreen({ navigation, route }: RequestDetailScreenProps) {
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
      subtitle="Consulta el estado y los datos de tu solicitud."
      onBack={() => navigation.goBack()}
    >
      {loading || error || !request ? (
        <RequestStateView loading={loading} error={error} onRetry={reload} />
      ) : (
        <>
          <View style={styles.heading}>
            <RequestStatusBadge status={request.estado} />
            <Text style={styles.date}>Creada el {formatRequestDate(request.fechaCreacion)}</Text>
          </View>
          <Text style={styles.description}>{requestSummary(request)}</Text>

          {actionError ? <InlineMessage message={actionError} /> : null}

          <Card style={styles.card}>
            <DetailRow
              label="Categoría"
              value={categoryName(catalogs, request.categoriaId)}
            />
            <DetailRow label="Zona" value={zoneName(catalogs, request.zonaId)} />
            <DetailRow label="Urgencia" value={requestUrgencyLabel(request.urgencia)} />
            <DetailRow
              label="Fotos"
              value={
                request.fotos.length === 1 ? '1 foto' : `${request.fotos.length} fotos`
              }
            />
            <DetailRow
              label="Última actualización"
              value={formatRequestDate(request.fechaActualizacion)}
            />
          </Card>

          {request.fotos.length > 0 ? (
            <InlineMessage
              variant="info"
              message="Esta versión muestra el número de fotos adjuntas; la vista previa de imágenes queda pendiente."
            />
          ) : null}

          {isRequestOpen(request) ? (
            <PrimaryButton
              label="Editar solicitud"
              variant="secondary"
              onPress={() => navigation.navigate('RequestForm', { requestId: request.id })}
              disabled={actionLoading !== null}
            />
          ) : (
            <InlineMessage
              variant="info"
              message="Esta solicitud ya no admite cambios ni cancelación."
            />
          )}

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

          {isRequestOpen(request) ? (
            <PrimaryButton
              label="Cancelar solicitud"
              variant="danger"
              onPress={handleCancel}
              loading={actionLoading === 'cancel'}
              disabled={actionLoading !== null}
            />
          ) : null}
        </>
      )}
    </ScreenLayout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  date: {
    color: colors.muted,
    fontSize: 12,
  },
  description: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 25,
  },
  card: {
    gap: spacing.md,
  },
  row: {
    gap: 2,
  },
  rowLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  rowValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
