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
import { useProfileError } from '../hooks/useProfileError';
import { profileGateway } from '../services/profile-gateway-instance';
import { ProfileError, type DeletionRequest } from '../types/profile';
import { formatDateTime } from '../utils/profile-format';

type ProfileDeleteScreenProps = NativeStackScreenProps<RootStackParamList, 'ProfileDelete'>;

export function ProfileDeleteScreen({ navigation }: ProfileDeleteScreenProps) {
  const { session, clearSession } = useAuthSession();
  const resolveError = useProfileError();
  const [pending, setPending] = useState<DeletionRequest | null>(null);
  const [canConfirm, setCanConfirm] = useState(false);
  const [confirmed, setConfirmed] = useState<DeletionRequest | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!session) {
    return null;
  }

  const handleRequest = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const request = await profileGateway.requestDeletion(session.token);
      setPending(request);
      setCanConfirm(true);
      Alert.alert(
        'Solicitud registrada',
        `Tienes hasta ${formatDateTime(request.expiraEn)} para confirmar la eliminación.`
      );
    } catch (requestError) {
      if (requestError instanceof ProfileError && requestError.serverCode === 'ELIMINACION_PENDIENTE') {
        setCanConfirm(true);
      }
      const message = resolveError(
        requestError,
        'No fue posible solicitar la eliminación de la cuenta.'
      );
      if (message) {
        setFormError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeletion = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const request = await profileGateway.confirmDeletion(session.token);
      setPending(null);
      setCanConfirm(false);
      setConfirmed(request);
      Alert.alert(
        'Cuenta bloqueada',
        'La cuenta quedó bloqueada y la sesión se cerró. La eliminación definitiva y la retención de datos dependen de la política aprobada (D-05); no se garantiza borrado inmediato.',
        [{ text: 'Volver a iniciar sesión', onPress: clearSession }],
        { cancelable: false }
      );
    } catch (confirmError) {
      const message = resolveError(
        confirmError,
        'No fue posible confirmar la eliminación de la cuenta.'
      );
      if (message) {
        setFormError(message);
      }
      if (
        confirmError instanceof ProfileError &&
        (confirmError.code === 'EXPIRED' || confirmError.serverCode === 'SIN_SOLICITUD_PENDIENTE')
      ) {
        setPending(null);
        setCanConfirm(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = () => {
    Alert.alert(
      'Confirmar eliminación',
      'La cuenta se bloqueará y se cerrarán sus sesiones. La eliminación definitiva y la retención de datos dependen de la política aprobada (D-05).',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: () => {
            void confirmDeletion();
          },
        },
      ]
    );
  };

  return (
    <ScreenLayout
      title="Eliminar cuenta"
      subtitle="La eliminación requiere una solicitud y una confirmación explícita."
      onBack={() => navigation.goBack()}
    >
      <InlineMessage
        variant="info"
        message="Solicitar la eliminación no borra la cuenta de inmediato. La confirmación bloquea la cuenta y cierra sus sesiones; la eliminación definitiva y la retención de datos siguen pendientes de D-05."
      />
      {formError ? <InlineMessage message={formError} /> : null}
      {confirmed ? (
        <InlineMessage
          variant="success"
          message="La cuenta quedó bloqueada. La eliminación definitiva y la retención de datos dependen de la política aprobada (D-05)."
        />
      ) : pending ? (
        <InlineMessage
          variant="success"
          message={`Solicitud pendiente hasta ${formatDateTime(pending.expiraEn)}`}
        />
      ) : canConfirm ? (
        <InlineMessage
          variant="info"
          message="Hay una solicitud pendiente registrada. Puedes confirmarla ahora."
        />
      ) : null}
      <Card style={styles.card}>
        <View style={styles.cardBody}>
          <Text style={styles.label}>Cuenta</Text>
          <Text style={styles.value}>{session.email}</Text>
        </View>
      </Card>
      {!confirmed && (pending || canConfirm) ? (
        <PrimaryButton label="Confirmar eliminación" variant="danger" onPress={handleConfirm} loading={submitting} />
      ) : null}
      {!confirmed && !pending && !canConfirm ? (
        <PrimaryButton label="Solicitar eliminación" variant="danger" onPress={handleRequest} loading={submitting} />
      ) : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
  },
  cardBody: {
    gap: spacing.xs,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  value: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
});
