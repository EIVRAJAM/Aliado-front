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
import { formatCop } from '../../../shared/format/currency';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { ProposalFields } from '../components/ProposalFields';
import { ProposalStateBadge } from '../components/ProposalStateBadge';
import { ReferenceCopyRow } from '../components/ReferenceCopyRow';
import { useProposalError } from '../hooks/useProposalError';
import { proposalGateway } from '../services/proposal-gateway-instance';
import {
  isProposalStateUnavailable,
  isUncertainProposalError,
  type Proposal,
  type ProposalOpportunityContext,
} from '../types/proposal';
import {
  formatProposalAvailability,
  formatProposalReference,
  parseProposalAvailability,
  type ProposalVisualState,
} from '../utils/proposal-format';
import {
  hasProposalFieldErrors,
  validateProposal,
  type ProposalFieldErrors,
} from '../validation/proposal-validation';

type ProposalFlowScreenProps = NativeStackScreenProps<RootStackParamList, 'ProposalFlow'>;
type IconName = ComponentProps<typeof Ionicons>['name'];

const URGENCY_LABELS: Record<string, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

export function ProposalFlowScreen({ navigation, route }: ProposalFlowScreenProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const { session } = useAuthSession();

  if (!session) {
    return null;
  }

  if (session.role !== 'PRESTADOR') {
    return (
      <ScreenLayout
        title="Propuesta"
        subtitle="Esta sección pertenece a las cuentas de prestador."
        onBack={() => navigation.goBack()}
      >
        <InlineMessage
          variant="info"
          message="Tu cuenta no tiene el rol Prestador, por lo que no puede crear propuestas."
        />
      </ScreenLayout>
    );
  }

  return (
    <ProviderProposalFlow
      navigation={navigation}
      solicitudId={route.params.solicitudId}
      opportunity={route.params.opportunity}
    />
  );
}

function ProviderProposalFlow({
  navigation,
  solicitudId,
  opportunity,
}: {
  navigation: ProposalFlowScreenProps['navigation'];
  solicitudId: string;
  opportunity?: ProposalOpportunityContext;
}) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const { session } = useAuthSession();
  const resolveError = useProposalError();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [editing, setEditing] = useState(false);
  const [availabilityDate, setAvailabilityDate] = useState<Date | null>(null);
  const [availabilityTime, setAvailabilityTime] = useState<Date | null>(null);
  const [availabilityRaw, setAvailabilityRaw] = useState<string | null>(null);
  const [availabilityUnreadable, setAvailabilityUnreadable] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [tarifaCop, setTarifaCop] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ProposalFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [retiring, setRetiring] = useState(false);
  const [statusUnknown, setStatusUnknown] = useState(false);
  const [creationUncertain, setCreationUncertain] = useState(false);

  const isCreating = proposal === null;
  const isActive = Boolean(proposal && proposal.estado === 'ACTIVA' && !statusUnknown);
  const opportunityTitle = opportunity?.categoria?.trim();
  const urgency = opportunity?.urgencia
    ? URGENCY_LABELS[opportunity.urgencia] ?? opportunity.urgencia
    : null;
  const contextSubtitle = [
    opportunity?.zonaAproximada,
    urgency ? `Urgencia ${urgency}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const fallbackSubtitle = isCreating
    ? `Envía tu disponibilidad para la solicitud ${formatProposalReference(solicitudId)}.`
    : editing
      ? 'Actualiza tu disponibilidad o mensaje.'
      : 'Revisa el estado de la propuesta que enviaste.';
  const title = isCreating
    ? 'Nueva propuesta'
    : editing
      ? 'Editar propuesta'
      : 'Mi propuesta';
  const subtitle = opportunityTitle
    ? isCreating
      ? 'Envía tu disponibilidad para este servicio.'
      : editing
        ? 'Actualiza tu disponibilidad o mensaje.'
        : 'Revisa el estado de tu propuesta.'
    : fallbackSubtitle;
  const opportunityDescription = opportunity?.descripcion?.trim();

  const resetFields = (nextProposal?: Proposal | null) => {
    const rawAvailability = nextProposal?.disponibilidad ?? null;
    const parsedAvailability = rawAvailability
      ? parseProposalAvailability(rawAvailability)
      : null;
    setAvailabilityDate(parsedAvailability);
    setAvailabilityTime(parsedAvailability);
    setAvailabilityRaw(rawAvailability);
    setAvailabilityUnreadable(Boolean(rawAvailability) && !parsedAvailability);
    setMensaje(nextProposal?.mensaje ?? '');
    setTarifaCop(
      nextProposal?.tarifaCop !== null && nextProposal?.tarifaCop !== undefined
        ? String(nextProposal.tarifaCop)
        : ''
    );
    setFieldErrors({});
  };

  const handleBack = () => {
    if (editing) {
      setEditing(false);
      setFormError(null);
      resetFields(proposal);
      return;
    }
    navigation.goBack();
  };

  const handleCreate = async () => {
    if (!session || submitting || creationUncertain) {
      return;
    }

    const nextErrors = validateProposal({
      date: availabilityDate,
      time: availabilityTime,
      mensaje,
      tarifaCop,
    });
    setFieldErrors(nextErrors);
    setFormError(null);
    setSuccessMessage(null);
    if (hasProposalFieldErrors(nextErrors)) {
      return;
    }

    if (!availabilityDate || !availabilityTime) {
      return;
    }

    const availability = formatProposalAvailability(
      availabilityDate,
      availabilityTime
    );
    const trimmedMessage = mensaje.trim();

    setSubmitting(true);
    try {
      const created = await proposalGateway.create(session.token, {
        solicitudId,
        disponibilidad: availability,
        mensaje: trimmedMessage || null,
        tarifaCop: Number(tarifaCop),
      });
      if (created.solicitudId !== solicitudId) {
        setCreationUncertain(true);
        setFormError(
          'No pudimos confirmar que la propuesta corresponda a esta solicitud. No vuelvas a enviar este formulario.'
        );
        return;
      }
      setProposal(created);
      setMensaje(created.mensaje ?? '');
      setFieldErrors({});
      setSuccessMessage('Propuesta enviada correctamente.');
    } catch (error) {
      const message = resolveError(
        error,
        'No fue posible enviar la propuesta. Intenta de nuevo.'
      );
      if (!message) {
        return;
      }
      if (isUncertainProposalError(error)) {
        setCreationUncertain(true);
        setFormError(
          'No se pudo confirmar si la propuesta se registró. No vuelvas a enviar este formulario; no hay forma de consultar tus propuestas desde la app.'
        );
      } else {
        setFormError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = () => {
    if (!proposal || !isActive) {
      return;
    }
    resetFields(proposal);
    setFormError(null);
    setSuccessMessage(null);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setFormError(null);
    resetFields(proposal);
  };

  const handleUpdate = async () => {
    if (!session || !proposal || submitting) {
      return;
    }

    const nextErrors = validateProposal({
      date: availabilityDate,
      time: availabilityTime,
      mensaje,
      tarifaCop,
    });
    setFieldErrors(nextErrors);
    setFormError(null);
    setSuccessMessage(null);
    if (hasProposalFieldErrors(nextErrors)) {
      return;
    }

    if (!availabilityDate || !availabilityTime) {
      return;
    }

    const availability = formatProposalAvailability(
      availabilityDate,
      availabilityTime
    );

    setSubmitting(true);
    try {
      const updated = await proposalGateway.update(session.token, proposal.id, {
        disponibilidad: availability,
        mensaje: mensaje.trim(),
        tarifaCop: Number(tarifaCop),
      });
      if (
        updated.solicitudId !== proposal.solicitudId ||
        updated.prestadorId !== proposal.prestadorId
      ) {
        setEditing(false);
        setStatusUnknown(true);
        setFormError(
          'No pudimos confirmar el estado actual de esta propuesta.'
        );
        return;
      }
      setProposal(updated);
      setEditing(false);
      setFieldErrors({});
      setSuccessMessage('Propuesta actualizada correctamente.');
    } catch (error) {
      const message = resolveError(
        error,
        'No fue posible actualizar la propuesta. Intenta de nuevo.'
      );
      if (isProposalStateUnavailable(error)) {
        setEditing(false);
        setStatusUnknown(true);
      }
      if (message) {
        setFormError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const performRetire = async () => {
    if (!session || !proposal || retiring) {
      return;
    }

    setRetiring(true);
    setFormError(null);
    setSuccessMessage(null);
    try {
      const retired = await proposalGateway.retire(session.token, proposal.id);
      setProposal({ ...proposal, estado: retired.estado });
      setStatusUnknown(false);
      setSuccessMessage('Propuesta retirada correctamente.');
    } catch (error) {
      const message = resolveError(
        error,
        'No fue posible retirar la propuesta. Intenta de nuevo.'
      );
      if (isProposalStateUnavailable(error)) {
        setStatusUnknown(true);
      }
      if (message) {
        setFormError(message);
      }
    } finally {
      setRetiring(false);
    }
  };

  const handleRetire = () => {
    Alert.alert(
      'Retirar propuesta',
      'La propuesta dejará de estar activa para el Cliente. Esta acción no se puede deshacer.',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Retirar propuesta',
          style: 'destructive',
          onPress: () => {
            void performRetire();
          },
        },
      ]
    );
  };

  const visualState: ProposalVisualState = statusUnknown
    ? 'UNKNOWN'
    : proposal?.estado ?? 'UNKNOWN';

  return (
    <ScreenLayout title={title} subtitle={subtitle} onBack={handleBack}>
      {opportunityTitle || opportunityDescription ? (
        <View style={styles.opportunityHeader}>
          {opportunityTitle ? (
            <Text style={styles.opportunityTitle} accessibilityRole="header">
              {opportunityTitle}
            </Text>
          ) : null}
          {contextSubtitle ? <Text style={styles.opportunityMeta}>{contextSubtitle}</Text> : null}
          {opportunityDescription ? (
            <Text style={styles.opportunityDescription} numberOfLines={2}>
              {opportunityDescription}
            </Text>
          ) : null}
        </View>
      ) : null}

      {isCreating ? (
        <>
          <Card style={styles.formCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <Ionicons name="paper-plane-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Detalles de tu propuesta</Text>
                <Text style={styles.cardSubtitle}>
                  Elige fecha y hora, indica tu tarifa. El mensaje es opcional.
                </Text>
              </View>
            </View>

            <ProposalFields
              availabilityDate={availabilityDate}
              availabilityTime={availabilityTime}
              onAvailabilityDateChange={setAvailabilityDate}
              onAvailabilityTimeChange={setAvailabilityTime}
              mensaje={mensaje}
              tarifaCop={tarifaCop}
              errors={fieldErrors}
              onChangeMensaje={setMensaje}
              onChangeTarifaCop={setTarifaCop}
              disabled={submitting || creationUncertain}
              existingAvailability={availabilityRaw}
              existingAvailabilityUnreadable={availabilityUnreadable}
            />

            {formError ? <InlineMessage message={formError} /> : null}

            <PrimaryButton
              label={creationUncertain ? 'Envío no confirmado' : 'Enviar propuesta'}
              onPress={() => {
                void handleCreate();
              }}
              loading={submitting}
              disabled={submitting || creationUncertain}
            />
          </Card>
        </>
      ) : (
        <>
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.proposalHeading}>Tu propuesta</Text>
              <ProposalStateBadge state={visualState} />
            </View>

            {successMessage ? (
              <InlineMessage variant="success" message={successMessage} />
            ) : null}

            {statusUnknown ? (
              <>
                <InlineMessage
                  message={
                    formError ??
                    'No se pudo confirmar el estado actual de la propuesta.'
                  }
                />
                <Text style={styles.unknownText}>
                  Estos datos son los últimos disponibles y pueden estar desactualizados.
                </Text>
                <PrimaryButton
                  label="Volver a la oportunidad"
                  variant="secondary"
                  onPress={() => navigation.goBack()}
                />
              </>
            ) : editing ? (
              <>
                <ProposalFields
                  availabilityDate={availabilityDate}
                  availabilityTime={availabilityTime}
                  onAvailabilityDateChange={setAvailabilityDate}
                  onAvailabilityTimeChange={setAvailabilityTime}
                  mensaje={mensaje}
                  tarifaCop={tarifaCop}
                  errors={fieldErrors}
                  onChangeMensaje={setMensaje}
                  onChangeTarifaCop={setTarifaCop}
                  disabled={submitting}
                  existingAvailability={availabilityRaw}
                  existingAvailabilityUnreadable={availabilityUnreadable}
                />
                {formError ? <InlineMessage message={formError} /> : null}
                <View style={styles.actions}>
                  <PrimaryButton
                    label="Guardar cambios"
                    onPress={() => {
                      void handleUpdate();
                    }}
                    loading={submitting}
                    disabled={submitting}
                  />
                  <PrimaryButton
                    label="Cancelar"
                    variant="secondary"
                    onPress={cancelEditing}
                    disabled={submitting}
                  />
                </View>
              </>
            ) : (
              <>
                <ProposalValue
                  icon="calendar-outline"
                  label="Disponibilidad"
                  value={proposal.disponibilidad}
                />
                <ProposalValue
                  icon="cash-outline"
                  label="Tarifa"
                  value={formatCop(proposal.tarifaCop)}
                  empty={proposal.tarifaCop === null}
                />
                <ProposalValue
                  icon="chatbubble-ellipses-outline"
                  label="Mensaje"
                  value={proposal.mensaje?.trim() || 'Sin mensaje.'}
                  empty={!proposal.mensaje?.trim()}
                />

                {formError ? <InlineMessage message={formError} /> : null}

                {isActive ? (
                  <View style={styles.actions}>
                    <PrimaryButton
                      label="Editar propuesta"
                      variant="secondary"
                      onPress={startEditing}
                      disabled={retiring}
                    />
                    <PrimaryButton
                      label="Retirar propuesta"
                      variant="danger"
                      onPress={handleRetire}
                      loading={retiring}
                      disabled={retiring}
                    />
                  </View>
                ) : (
                  <Text style={styles.closedText}>
                    {proposal.estado === 'RETIRADA'
                      ? 'La propuesta ya no está activa para el Cliente.'
                      : 'Esta propuesta ya no admite cambios.'}
                  </Text>
                )}
              </>
            )}

            <View style={styles.referencesBlock}>
              <ReferenceCopyRow
                label="Propuesta"
                displayValue={formatProposalReference(proposal.id)}
                value={proposal.id}
              />
              <ReferenceCopyRow
                label="Solicitud"
                displayValue={formatProposalReference(proposal.solicitudId)}
                value={proposal.solicitudId}
              />
            </View>
          </Card>
        </>
      )}
    </ScreenLayout>
  );
}

function ProposalValue({
  icon,
  label,
  value,
  empty = false,
}: {
  icon: IconName;
  label: string;
  value: string;
  empty?: boolean;
}) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  return (
    <View style={styles.valueBlock}>
      <View style={styles.valueLabelRow}>
        <Ionicons name={icon} size={14} color={colors.muted} />
        <Text style={styles.valueLabel}>{label}</Text>
      </View>
      <Text style={[styles.valueText, empty ? styles.emptyValue : null]}>{value}</Text>
    </View>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  formCard: {
    gap: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  statusCard: {
    gap: spacing.lg,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  opportunityHeader: {
    gap: spacing.xs,
  },
  opportunityTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  opportunityMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  opportunityDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  referencesBlock: {
    gap: spacing.xs,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  proposalHeading: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  valueBlock: {
    gap: spacing.xs,
  },
  valueLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  valueLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  valueText: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 23,
  },
  emptyValue: {
    color: colors.muted,
    fontStyle: 'italic',
  },
  actions: {
    gap: spacing.sm,
  },
  closedText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  unknownText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
});
