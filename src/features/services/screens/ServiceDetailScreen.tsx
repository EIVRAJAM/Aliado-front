import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { ServiceRatingCard } from '../../trust/components/ServiceRatingCard';
import { ServiceHistoryCard } from '../components/ServiceHistoryCard';
import { ServiceMessagesCard } from '../components/ServiceMessagesCard';
import { ServiceStateBadge } from '../components/ServiceStateBadge';
import { useServiceDetail } from '../hooks/useServiceDetail';
import { useServiceError } from '../hooks/useServiceError';
import { serviceGateway } from '../services/service-gateway-instance';
import {
  isServiceConflict,
  isServiceNotFound,
  isUncertainServiceError,
  type ContractedService,
  type ServiceMessage,
  type ServiceState,
  type ServiceTransitionAction,
} from '../types/service';
import {
  categoryName,
  expectedStateForAction,
  formatServiceDate,
  urgencyLabel,
  zoneName,
} from '../utils/service-format';

type ServiceDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'ServiceDetail'>;

export function ServiceDetailScreen({ navigation, route }: ServiceDetailScreenProps) {
  const { session } = useAuthSession();
  const detail = useServiceDetail(route.params.servicioId);
  const resolveError = useServiceError();
  const [actionLoading, setActionLoading] = useState<ServiceTransitionAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [messageUncertain, setMessageUncertain] = useState(false);

  if (!session) {
    return null;
  }

  const service = detail.service;
  const role = session.role;

  const runTransition = async (
    action: ServiceTransitionAction,
    success: string
  ) => {
    if (!service || actionLoading) {
      return;
    }
    const expectedState = expectedStateForAction(action);
    setActionLoading(action);
    setActionError(null);
    setSuccessMessage(null);
    try {
      await serviceGateway.transition(session.token, service.id, action);
      const refreshed = await detail.reload();
      if (refreshed?.estado === expectedState) {
        setSuccessMessage(success);
      } else {
        setActionError(
          'No se pudo confirmar que el servicio haya alcanzado el estado solicitado. Actualiza antes de intentar de nuevo.'
        );
      }
    } catch (transitionError) {
      const text = resolveError(
        transitionError,
        'No fue posible actualizar el estado del servicio.'
      );
      if (!text) {
        return;
      }
      if (isServiceConflict(transitionError) || isServiceNotFound(transitionError)) {
        await detail.reload();
        setActionError(text);
      } else if (isUncertainServiceError(transitionError)) {
        const refreshed = await detail.reload();
        if (refreshed?.estado === expectedState) {
          setSuccessMessage(success);
        } else {
          setActionError(
            'No se pudo confirmar si el servicio cambió de estado. Actualiza antes de intentar de nuevo.'
          );
        }
      } else {
        setActionError(text);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const confirmAction = (
    action: ServiceTransitionAction,
    success: string,
    title: string,
    messageText: string,
    destructive = false
  ) => {
    Alert.alert(title, messageText, [
      { text: 'Volver', style: 'cancel' },
      {
        text: title,
        style: destructive ? 'destructive' : 'default',
        onPress: () => {
          void runTransition(action, success);
        },
      },
    ]);
  };

  const sendMessage = async () => {
    if (!service || sending || messageUncertain) {
      return;
    }
    const contenido = message.trim();
    if (!contenido) {
      setMessageError('Escribe un mensaje.');
      return;
    }
    if (contenido.length > 2000) {
      setMessageError('El mensaje admite máximo 2000 caracteres.');
      return;
    }
    const baselineIds = new Set(detail.messages.map((item) => item.id));
    const attemptStartedAt = Date.now();
    const ownId = role === 'CLIENTE' ? service.clienteId : service.prestadorId;
    setSending(true);
    setMessageError(null);
    try {
      const sent = await serviceGateway.sendMessage(session.token, service.id, contenido);
      detail.setMessages((current) => [...current, sent]);
      setMessage('');
    } catch (sendError) {
      const text = resolveError(sendError, 'No fue posible enviar el mensaje.');
      if (!text) {
        return;
      }
      if (isUncertainServiceError(sendError)) {
        let refreshed: ServiceMessage[] | null = null;
        try {
          refreshed = await serviceGateway.getMessages(session.token, service.id);
          detail.setMessages(refreshed);
        } catch (refreshError) {
          resolveError(refreshError, 'No fue posible confirmar el mensaje.');
        }
        const confirmed = refreshed?.some(
          (item) =>
            !baselineIds.has(item.id) &&
            item.remitenteId === ownId &&
            item.contenido.trim() === contenido &&
            new Date(item.fechaEnvio).getTime() >= attemptStartedAt - 5000
        );
        if (confirmed) {
          setMessage('');
          setMessageError(null);
          setSuccessMessage('Mensaje enviado.');
        } else {
          setMessageUncertain(true);
          setMessageError(
            'No se pudo confirmar si el mensaje se guardó. No lo reenvíes desde esta pantalla para evitar duplicados.'
          );
        }
      } else {
        if (isServiceConflict(sendError) || isServiceNotFound(sendError)) {
          await detail.reload();
        }
        setMessageError(text);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <ScreenLayout
      title="Servicio contratado"
      subtitle="Consulta el acuerdo, su estado y la comunicación."
      onBack={() => navigation.goBack()}
    >
      {detail.loading || detail.error || !service ? (
        <>
          {detail.loading ? (
            <View style={styles.loading}>
              <Ionicons name="hourglass-outline" size={22} color={colors.primary} />
              <Text style={styles.loadingText}>Cargando servicio…</Text>
            </View>
          ) : (
            <>
              <InlineMessage
                message={detail.error ?? 'El servicio no está disponible.'}
              />
              <PrimaryButton
                label="Reintentar"
                onPress={() => {
                  void detail.reload();
                }}
              />
            </>
          )}
        </>
      ) : (
        <>
          <ServiceSummary service={service} catalogs={detail.catalogs} />

          {actionError ? <InlineMessage message={actionError} /> : null}
          {successMessage ? (
            <InlineMessage variant="success" message={successMessage} />
          ) : null}

          <ServiceActions
            service={service}
            role={role}
            loading={actionLoading}
            onStart={() =>
              confirmAction(
                'en-ejecucion',
                'Servicio marcado en ejecución.',
                'Iniciar servicio',
                'El servicio pasará a estar en ejecución.',
                false
              )
            }
            onFinish={() =>
              confirmAction(
                'terminado',
                'Servicio marcado como terminado.',
                'Marcar como terminado',
                'El Cliente deberá confirmar la finalización.',
                false
              )
            }
            onConfirm={() =>
              confirmAction(
                'confirmar-finalizacion',
                'Finalización confirmada.',
                'Confirmar finalización',
                'El servicio quedará finalizado de forma definitiva.',
                false
              )
            }
            onCancel={() =>
              confirmAction(
                'cancelar',
                'Servicio cancelado.',
                'Cancelar servicio',
                'El servicio quedará cancelado y no admitirá más transiciones.',
                true
              )
            }
          />

          {role === 'CLIENTE' && service.estado === 'FINALIZADO' ? (
            <ServiceRatingCard
              token={session.token}
              serviceId={service.id}
              onRefresh={() => {
                void detail.reload();
              }}
            />
          ) : null}

          <ServiceProposalCard service={service} />
          <ServiceHistoryCard service={service} history={detail.history} />
          <ServiceMessagesCard
            service={service}
            messages={detail.messages}
            currentRole={role}
            value={message}
            onChange={setMessage}
            onSend={() => {
              void sendMessage();
            }}
            sending={sending}
            uncertain={messageUncertain}
            error={messageError}
          />
        </>
      )}
    </ScreenLayout>
  );
}

function ServiceSummary({
  service,
  catalogs,
}: {
  service: ContractedService;
  catalogs: { categories: Array<{ id: string; nombre: string }>; zones: Array<{ id: string; nombre: string }> };
}) {
  const urgency = urgencyLabel(service.solicitud.urgencia);
  return (
    <Card style={[styles.summaryCard, { borderTopColor: toneFor(service.estado) }]}>
      <View style={styles.summaryHeader}>
        <Text style={styles.eyebrow}>SERVICIO</Text>
        <ServiceStateBadge state={service.estado} />
      </View>
      <Text style={styles.title}>
        {service.solicitud.descripcion?.trim() || 'Solicitud sin descripción'}
      </Text>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="pricetag-outline" size={14} color={colors.muted} />
          <Text style={styles.metaText}>
            {categoryName(catalogs.categories, service.solicitud.categoriaId)}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="location-outline" size={14} color={colors.muted} />
          <Text style={styles.metaText}>
            {zoneName(catalogs.zones, service.solicitud.zonaId)}
          </Text>
        </View>
        {urgency ? (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color={colors.muted} />
            <Text style={styles.metaText}>Urgencia {urgency}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.footer}>
        <Ionicons name="calendar-outline" size={14} color={colors.muted} />
        <Text style={styles.footerText}>
          Contratado el {formatServiceDate(service.fechaContratacion)}
        </Text>
      </View>
    </Card>
  );
}

function ServiceProposalCard({ service }: { service: ContractedService }) {
  return (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.iconBadge}>
          <Ionicons name="document-text-outline" size={18} color={colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>Propuesta aceptada</Text>
      </View>
      <Text style={styles.fieldLabel}>Disponibilidad</Text>
      <Text style={styles.fieldValue}>{service.propuesta.disponibilidad}</Text>
      <Text style={styles.fieldLabel}>Mensaje</Text>
      <Text style={styles.fieldValue}>
        {service.propuesta.mensaje?.trim() || 'Sin mensaje.'}
      </Text>
      <Text style={styles.footerText}>
        Prestador {shortId(service.prestadorId)}
      </Text>
    </Card>
  );
}

function ServiceActions({
  service,
  role,
  loading,
  onStart,
  onFinish,
  onConfirm,
  onCancel,
}: {
  service: ContractedService;
  role: 'CLIENTE' | 'PRESTADOR';
  loading: ServiceTransitionAction | null;
  onStart: () => void;
  onFinish: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const canStart = role === 'PRESTADOR' && service.estado === 'CONTRATADO';
  const canFinish = role === 'PRESTADOR' && service.estado === 'EN_EJECUCION';
  const canConfirm = role === 'CLIENTE' && service.estado === 'TERMINADO';
  const canCancel =
    service.estado !== 'FINALIZADO' && service.estado !== 'CANCELADO';
  const disabled = loading !== null;

  if (!canStart && !canFinish && !canConfirm && !canCancel) {
    return null;
  }

  return (
    <View style={styles.actions}>
      {canStart ? (
        <PrimaryButton
          label="Iniciar servicio"
          onPress={onStart}
          loading={loading === 'en-ejecucion'}
          disabled={disabled}
        />
      ) : null}
      {canFinish ? (
        <PrimaryButton
          label="Marcar como terminado"
          onPress={onFinish}
          loading={loading === 'terminado'}
          disabled={disabled}
        />
      ) : null}
      {canConfirm ? (
        <PrimaryButton
          label="Confirmar finalización"
          onPress={onConfirm}
          loading={loading === 'confirmar-finalizacion'}
          disabled={disabled}
        />
      ) : null}
      {canCancel ? (
        <PrimaryButton
          label="Cancelar servicio"
          variant="danger"
          onPress={onCancel}
          loading={loading === 'cancelar'}
          disabled={disabled}
        />
      ) : null}
    </View>
  );
}

function toneFor(state: ServiceState): string {
  switch (state) {
    case 'CONTRATADO':
      return colors.primary;
    case 'EN_EJECUCION':
      return colors.warning;
    case 'TERMINADO':
      return colors.teal;
    case 'FINALIZADO':
      return colors.success;
    case 'CANCELADO':
      return colors.danger;
  }
}

function shortId(value: string): string {
  return value.length > 12 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  loadingText: { color: colors.muted, fontSize: 14 },
  summaryCard: { borderTopWidth: 4, gap: spacing.md, padding: spacing.xl },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', lineHeight: 29 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  metaText: { color: colors.muted, fontSize: 12, flexShrink: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  footerText: { color: colors.muted, fontSize: 12 },
  sectionCard: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  fieldLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
  fieldValue: { color: colors.text, fontSize: 15, lineHeight: 21 },
  actions: { gap: spacing.sm },
});
