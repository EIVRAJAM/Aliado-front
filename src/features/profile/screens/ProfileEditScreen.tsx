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
import type { UpdateProfileInput } from '../types/profile';
import {
  hasFieldErrors,
  validateProfileEdit,
  type ProfileEditFieldErrors,
} from '../validation/profile-validation';

type ProfileEditScreenProps = NativeStackScreenProps<RootStackParamList, 'ProfileEdit'>;

export function ProfileEditScreen({ navigation }: ProfileEditScreenProps) {
  const { session } = useAuthSession();
  const { profile, loading, error, reload } = useMyProfile();
  const resolveError = useProfileError();
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [errors, setErrors] = useState<ProfileEditFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setNombre(profile.nombre ?? '');
      setTelefono(profile.telefono ?? '');
    }
  }, [profile]);

  const handleSubmit = async () => {
    if (!session || !profile || submitting) {
      return;
    }

    const nextErrors = validateProfileEdit({ nombre, telefono });
    setErrors(nextErrors);
    setFormError(null);
    if (hasFieldErrors(nextErrors)) {
      return;
    }

    const trimmedName = nombre.trim();
    const trimmedPhone = telefono.trim();
    const input: UpdateProfileInput = { version: profile.version };

    if (trimmedName && trimmedName !== (profile.nombre ?? '')) {
      input.nombre = trimmedName;
    }
    if (trimmedPhone && trimmedPhone !== (profile.telefono ?? '')) {
      input.telefono = trimmedPhone;
    }

    if (input.nombre === undefined && input.telefono === undefined) {
      setFormError('No hay cambios para guardar. Los campos vacíos conservan el valor actual.');
      return;
    }

    setSubmitting(true);
    try {
      await profileGateway.updateMyProfile(session.token, input);
      Alert.alert('Datos actualizados', 'Tus datos personales se guardaron correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (updateError) {
      const message = resolveError(updateError, 'No fue posible actualizar tus datos.');
      if (message) {
        setFormError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout
      title="Editar datos"
      subtitle="Actualiza tu nombre y teléfono. Los campos vacíos conservan el valor actual."
    >
      {loading || error || !profile ? (
        <ProfileStateView loading={loading} error={error} onRetry={reload} />
      ) : (
        <>
          {formError ? <InlineMessage message={formError} /> : null}
          <FormField
            label="Nombre"
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="words"
            maxLength={120}
            error={errors.nombre}
          />
          <FormField
            label="Teléfono"
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            error={errors.telefono}
            hint="Entre 7 y 30 caracteres: números, espacios, +, paréntesis o guiones."
          />
          <PrimaryButton label="Guardar cambios" onPress={handleSubmit} loading={submitting} />
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
