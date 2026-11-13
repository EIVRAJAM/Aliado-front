import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { appEnv } from '../../../shared/config/env';
import { spacing } from '../../../shared/ui/theme';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { FormField } from '../../../shared/ui/FormField';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { LinkButton } from '../../../shared/ui/LinkButton';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { useAuthSession } from '../session/AuthSessionProvider';
import { getAuthErrorMessage } from '../utils/auth-error-message';
import {
  PASSWORD_POLICY_HINT,
  hasFieldErrors,
  validatePasswordReset,
  type PasswordResetFieldErrors,
} from '../validation/auth-validation';

type ResetPasswordScreenProps = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation, route }: ResetPasswordScreenProps) {
  const { gateway } = useAuthSession();
  const [token, setToken] = useState(route.params?.token ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [errors, setErrors] = useState<PasswordResetFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }

    const nextErrors = validatePasswordReset({ token, newPassword });
    setErrors(nextErrors);
    setFormError(null);

    if (hasFieldErrors(nextErrors)) {
      return;
    }

    setSubmitting(true);
    try {
      await gateway.confirmPasswordRecovery({
        token: token.trim(),
        newPassword,
      });
      navigation.replace('Login', {
        notice: 'Contraseña actualizada. Ya puedes iniciar sesión.',
      });
    } catch (error) {
      setFormError(
        getAuthErrorMessage(error, 'No fue posible actualizar la contraseña. Intenta de nuevo.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout
      variant="auth"
      title="Define una nueva contraseña"
      subtitle="Usa el código de recuperación que recibiste."
    >
      {!appEnv.apiBaseUrl ? (
        <InlineMessage
          variant="info"
          message="La conexión con la API no está configurada en este entorno. La recuperación real permanece pendiente."
        />
      ) : null}
      {formError ? <InlineMessage message={formError} /> : null}
      <FormField
        label="Código de recuperación"
        value={token}
        onChangeText={setToken}
        autoCapitalize="none"
        autoCorrect={false}
        error={errors.token}
        hint="Pega el código recibido por el canal definido por ALIADO."
      />
      <FormField
        label="Nueva contraseña"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        error={errors.newPassword}
        hint={PASSWORD_POLICY_HINT}
      />
      <PrimaryButton label="Actualizar contraseña" onPress={handleSubmit} loading={submitting} />
      <View style={styles.links}>
        <LinkButton
          label="Solicitar un código nuevo"
          onPress={() => navigation.navigate('ForgotPassword')}
        />
        <LinkButton label="Volver a iniciar sesión" onPress={() => navigation.navigate('Login')} />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  links: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
});
