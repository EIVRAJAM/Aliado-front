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
      const pendingFiles = request.archivosPendientes;
      Alert.alert(
        pendingFiles > 0 ? 'Cuenta eliminada; limpieza pendiente' : 'Cuenta eliminada',
        pendingFiles > 0
          ? `La cuenta y sus datos personales fueron eliminados. La limpieza de ${pendingFiles} archivo(s) personales quedó pendiente y se reintentará automáticamente. La sesión se cerró y no podrás iniciar sesión ni recuperar la cuenta. El historial compartido permanece anonimizado.`
          : 'La cuenta y sus datos personales fueron eliminados. Los archivos personales fueron eliminados. La sesión se cerró y no podrás iniciar sesión ni recuperar la cuenta. El historial compartido permanece anonimizado y se muestra como “Cuenta eliminada”.',
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
      'Se eliminarán tu correo, contraseña, sesiones, nombre, teléfono, ubicación exacta, perfil, preferencias y archivos personales. El historial compartido de servicios se conservará anonimizado. Esta acción no se puede deshacer.',
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
        message="Se eliminarán tus credenciales, sesiones, nombre, teléfono, ubicación exacta, perfil, preferencias y archivos personales. Se conservará el historial compartido de servicios, propuestas, mensajes, calificaciones/reseñas y reportes sin asociarlo a tu identidad; la persona aparecerá como “Cuenta eliminada”. No podrás iniciar sesión ni recuperar la cuenta."
      />
      <InlineMessage
        variant="info"
        message="La eliminación se bloquea si tienes un servicio en ejecución."
      />
      {formError ? <InlineMessage message={formError} /> : null}
      {confirmed ? (
        <InlineMessage
          variant="success"
          message={confirmed.archivosPendientes > 0
            ? 'La cuenta fue eliminada, pero la limpieza de algunos archivos personales quedó pendiente y se reintentará automáticamente.'
            : 'La cuenta fue eliminada y los archivos personales fueron eliminados. La sesión se cerró y tus datos personales ya no están disponibles; el historial compartido permanece anonimizado.'}
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
        <PrimaryButton label="Confirmar eliminación definitiva" variant="danger" onPress={handleConfirm} loading={submitting} />
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
