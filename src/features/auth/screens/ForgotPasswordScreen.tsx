import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { appEnv } from '../../../shared/config/env';
import { spacing } from '../../../shared/ui/theme';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { FormField } from '../components/FormField';
import { InlineMessage } from '../components/InlineMessage';
import { LinkButton } from '../components/LinkButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuthSession } from '../session/AuthSessionProvider';
import { getAuthErrorMessage } from '../utils/auth-error-message';
import {
  hasFieldErrors,
  validatePasswordRecovery,
  type PasswordRecoveryFieldErrors,
} from '../validation/auth-validation';

type ForgotPasswordScreenProps = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

const RECOVERY_MESSAGE =
  'Si el correo está registrado, recibirás un mecanismo de recuperación. Por seguridad, no confirmamos si existe una cuenta.';

export function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const { gateway } = useAuthSession();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<PasswordRecoveryFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }

    const nextErrors = validatePasswordRecovery({ email });
    setErrors(nextErrors);
    setFormError(null);

    if (hasFieldErrors(nextErrors)) {
      return;
    }

    setSubmitting(true);
    try {
      await gateway.requestPasswordRecovery({ email: email.trim() });
      setSubmitted(true);
    } catch (error) {
      setFormError(
        getAuthErrorMessage(error, 'No fue posible solicitar la recuperación. Intenta de nuevo.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout
      title="Recupera tu acceso"
      subtitle="Te enviaremos un mecanismo de verificación si el correo está registrado."
    >
      {!appEnv.apiBaseUrl ? (
        <InlineMessage
          variant="info"
          message="La conexión con la API no está configurada en este entorno. La recuperación real permanece pendiente."
        />
      ) : null}
      {submitted ? <InlineMessage variant="success" message={RECOVERY_MESSAGE} /> : null}
      {formError ? <InlineMessage message={formError} /> : null}
      <FormField
        label="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        error={errors.email}
      />
      <PrimaryButton label="Solicitar recuperación" onPress={handleSubmit} loading={submitting} />
      <View style={styles.links}>
        <LinkButton
          label="Ya tengo un código de recuperación"
          onPress={() => navigation.navigate('ResetPassword')}
        />
        <LinkButton label="Volver a iniciar sesión" onPress={() => navigation.navigate('Login')} />
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  links: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
});
