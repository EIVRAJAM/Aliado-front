import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { FormField } from '../../../shared/ui/FormField';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { LinkButton } from '../../../shared/ui/LinkButton';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { ProfileStateView } from '../components/ProfileStateView';
import { useMyProfile } from '../hooks/useMyProfile';
import { useProfileError } from '../hooks/useProfileError';
import { profileGateway } from '../services/profile-gateway-instance';
import {
  hasFieldErrors,
  validateLocation,
  type LocationFieldErrors,
} from '../validation/profile-validation';

type ProfileLocationScreenProps = NativeStackScreenProps<RootStackParamList, 'ProfileLocation'>;

export function ProfileLocationScreen({ navigation }: ProfileLocationScreenProps) {
  const { session } = useAuthSession();
  const { profile, loading, error, reload } = useMyProfile();
  const resolveError = useProfileError();
  const [zonaAproximada, setZonaAproximada] = useState('');
  const [direccionExacta, setDireccionExacta] = useState('');
  const [errors, setErrors] = useState<LocationFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setZonaAproximada(profile.zonaAproximada ?? '');
      setDireccionExacta(profile.direccionExacta ?? '');
    }
  }, [profile]);

  const handleSubmit = async () => {
    if (!session || !profile || submitting) {
      return;
    }

    const nextErrors = validateLocation({ zonaAproximada, direccionExacta });
    setErrors(nextErrors);
    setFormError(null);
    if (hasFieldErrors(nextErrors)) {
      return;
    }

    const exactAddress = direccionExacta.trim();
    setSubmitting(true);
    try {
      await profileGateway.updateLocation(session.token, {
        zonaAproximada: zonaAproximada.trim(),
        direccionExacta: exactAddress ? exactAddress : undefined,
      });
      Alert.alert('Ubicación actualizada', 'Tu zona aproximada se guardó correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (updateError) {
      const message = resolveError(updateError, 'No fue posible actualizar tu ubicación.');
      if (message) {
        setFormError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout
      title="Ubicación"
      subtitle="La zona aproximada es pública; la dirección exacta solo se muestra a ti y a servicios autorizados."
    >
      {loading || error || !profile ? (
        <ProfileStateView loading={loading} error={error} onRetry={reload} />
      ) : (
        <>
          <InlineMessage
            variant="info"
            message="La dirección exacta no se expone en búsquedas ni en la vista pública del perfil."
          />
          {formError ? <InlineMessage message={formError} /> : null}
          <FormField
            label="Zona aproximada"
            value={zonaAproximada}
            onChangeText={setZonaAproximada}
            autoCapitalize="words"
            maxLength={100}
            error={errors.zonaAproximada}
            hint="Ejemplo: zona norte de la ciudad. Máximo 100 caracteres."
          />
          <FormField
            label="Dirección exacta"
            value={direccionExacta}
            onChangeText={setDireccionExacta}
            autoCapitalize="sentences"
            maxLength={500}
            error={errors.direccionExacta}
            hint="Opcional. Dejarla vacía conserva la dirección actual."
          />
          <PrimaryButton label="Guardar ubicación" onPress={handleSubmit} loading={submitting} />
        </>
      )}
      <View style={styles.links}>
        <LinkButton label="Volver a mi perfil" onPress={() => navigation.goBack()} />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  links: {
    marginTop: spacing.sm,
  },
});
