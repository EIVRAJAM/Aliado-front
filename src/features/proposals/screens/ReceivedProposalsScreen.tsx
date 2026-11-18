import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { useProposalError } from '../hooks/useProposalError';
import { proposalGateway } from '../services/proposal-gateway-instance';
import {
  isUncertainProposalError,
  ProposalError,
  type Proposal,
} from '../types/proposal';
import { formatProposalReference } from '../utils/proposal-format';

type ReceivedProposalsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ReceivedProposals'
>;

export function ReceivedProposalsScreen({
  navigation,
  route,
}: ReceivedProposalsScreenProps) {
  const { session } = useAuthSession();
  const resolveError = useProposalError();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [acceptanceUncertain, setAcceptanceUncertain] = useState(false);

  const load = useCallback(async () => {
    if (!session || session.role !== 'CLIENTE') {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setProposals(await proposalGateway.listReceived(session.token, route.params.solicitudId));
    } catch (loadError) {
      const message = resolveError(
        loadError,
        'No fue posible cargar las propuestas recibidas.'
      );
      if (message) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [resolveError, route.params.solicitudId, session]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  if (!session) {
    return null;
  }

  if (session.role !== 'CLIENTE') {
    return (
      <ScreenLayout
        title="Propuestas recibidas"
        subtitle="Esta sección pertenece a las cuentas de cliente."
        onBack={() => navigation.goBack()}
      >
        <InlineMessage
          variant="info"
          message="Tu cuenta no tiene el rol Cliente, por lo que no puede aceptar propuestas."
        />
      </ScreenLayout>
    );
  }

  const performAccept = async (proposal: Proposal) => {
    if (!session || acceptingId || acceptanceUncertain) {
      return;
    }

    setAcceptingId(proposal.id);
    setError(null);
    try {
      const accepted = await proposalGateway.accept(session.token, proposal.id);
      navigation.replace('ServiceDetail', { servicioId: accepted.servicioId });
    } catch (acceptError) {
      const message = resolveError(
        acceptError,
        'No fue posible aceptar la propuesta. Intenta de nuevo.'
      );
      if (!message) {
        return;
      }
      if (isUncertainProposalError(acceptError)) {
        setAcceptanceUncertain(true);
        setError(
          'No se pudo confirmar si la propuesta fue aceptada. No vuelvas a intentarlo; revisa la solicitud o los avisos de servicio.'
        );
      } else if (
        acceptError instanceof ProposalError &&
        (acceptError.code === 'CONFLICT' || acceptError.code === 'NOT_FOUND')
      ) {
        await load();
        setError(message);
      } else {
        setError(message);
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const handleAccept = (proposal: Proposal) => {
    Alert.alert(
      'Aceptar propuesta',
      `Se contratará el servicio con disponibilidad "${proposal.disponibilidad}". Las demás propuestas de esta solicitud se cerrarán.`,
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Aceptar propuesta',
          onPress: () => {
            void performAccept(proposal);
          },
        },
      ]
    );
  };

  const countLabel = loading
    ? 'Cargando propuestas…'
    : error
      ? 'No se pudieron cargar'
      : `${proposals.length} ${proposals.length === 1 ? 'propuesta' : 'propuestas'}`;

  return (
    <ScreenLayout
      title="Propuestas recibidas"
      subtitle="Compara disponibilidad y mensaje antes de aceptar."
      onBack={() => navigation.goBack()}
    >
      <View style={styles.toolbar}>
        <View style={styles.toolbarText}>
          <Text style={styles.count}>{countLabel}</Text>
          <Text style={styles.reference}>
            Solicitud {formatProposalReference(route.params.solicitudId)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Actualizar propuestas recibidas"
          onPress={() => {
            void load();
          }}
          style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}
        >
          <Ionicons name="refresh-outline" size={20} color={colors.primary} />
        </Pressable>
      </View>

      {error ? <InlineMessage message={error} /> : null}

      {loading ? (
        <View style={styles.state}>
          <Text style={styles.stateText}>Cargando propuestas recibidas…</Text>
        </View>
      ) : proposals.length === 0 ? (
        <Card style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons name="mail-open-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Sin propuestas activas</Text>
          <Text style={styles.emptyText}>
            Cuando un Prestador envíe una propuesta para esta solicitud, aparecerá aquí.
          </Text>
          <PrimaryButton
            label="Actualizar"
            variant="secondary"
            onPress={() => {
              void load();
            }}
          />
        </Card>
      ) : (
        <View style={styles.list}>
          {proposals.map((proposal) => (
            <Card key={proposal.id} style={styles.proposalCard}>
              <View style={styles.proposalHeader}>
                <View style={styles.providerIcon}>
                  <Ionicons name="person-outline" size={17} color={colors.primary} />
                </View>
                <View style={styles.providerText}>
                  <Text style={styles.providerLabel}>Prestador</Text>
                  <Text style={styles.providerReference}>
                    {formatProposalReference(proposal.prestadorId)}
                  </Text>
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Disponibilidad</Text>
                <Text style={styles.fieldValue}>{proposal.disponibilidad}</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Mensaje</Text>
                <Text style={[styles.fieldValue, proposal.mensaje ? null : styles.mutedValue]}>
                  {proposal.mensaje?.trim() || 'Sin mensaje.'}
                </Text>
              </View>
              <PrimaryButton
                label="Aceptar propuesta"
                onPress={() => handleAccept(proposal)}
                loading={acceptingId === proposal.id}
                disabled={acceptingId !== null || acceptanceUncertain}
              />
            </Card>
          ))}
        </View>
      )}
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
  toolbarText: {
    flex: 1,
    gap: 2,
  },
  count: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  reference: {
    color: colors.muted,
    fontSize: 12,
  },
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
  pressed: {
    backgroundColor: colors.background,
  },
  state: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  stateText: {
    color: colors.muted,
    fontSize: 14,
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: radii.xl,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  proposalCard: {
    gap: spacing.md,
  },
  proposalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  providerIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerText: {
    flex: 1,
    gap: 1,
  },
  providerLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  providerReference: {
    color: colors.muted,
    fontSize: 11,
  },
  field: {
    gap: 2,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  fieldValue: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  mutedValue: {
    color: colors.muted,
    fontStyle: 'italic',
  },
});
