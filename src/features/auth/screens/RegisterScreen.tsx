import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { appEnv } from '../../../shared/config/env';
import { spacing } from '../../../shared/ui/theme';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { ConsentCheckbox } from '../components/ConsentCheckbox';
import { FormField } from '../../../shared/ui/FormField';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { LinkButton } from '../../../shared/ui/LinkButton';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { RoleSelector } from '../components/RoleSelector';
import { useAuthSession } from '../session/AuthSessionProvider';
import type { AuthRole } from '../types/auth';
import { getAuthErrorMessage } from '../utils/auth-error-message';
import {
  PASSWORD_POLICY_HINT,
  hasFieldErrors,
  validateRegistration,
  type RegisterFieldErrors,
} from '../validation/auth-validation';

type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { gateway } = useAuthSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AuthRole | null>(null);
  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const [errors, setErrors] = useState<RegisterFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const termsVersion = appEnv.termsVersion;

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }

    const nextErrors = validateRegistration({
      email,
      password,
      role,
      acceptsTerms,
      termsVersion,
    });
    setErrors(nextErrors);
    setFormError(null);

    if (hasFieldErrors(nextErrors) || !role || !termsVersion) {
      return;
    }

    setSubmitting(true);
    try {
      await gateway.register({
        email: email.trim(),
        password,
        role,
        acceptsTerms,
        termsVersion,
      });
      navigation.replace('Login', {
        notice: 'Cuenta creada. Ya puedes iniciar sesión.',
      });
    } catch (error) {
      setFormError(
        getAuthErrorMessage(error, 'No fue posible completar el registro. Intenta de nuevo.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout
      title="Crea tu cuenta"
      subtitle="Regístrate como Cliente o Prestador para usar ALIADO."
    >
      {!appEnv.apiBaseUrl ? (
        <InlineMessage
          variant="info"
          message="La conexión con la API no está configurada en este entorno. El registro real permanece pendiente."
        />
      ) : null}
      {!termsVersion ? (
        <InlineMessage
          variant="info"
          message="La versión de términos no está configurada. El registro no puede enviarse hasta definirla."
        />
      ) : null}
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
      <FormField
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        error={errors.password}
        hint={PASSWORD_POLICY_HINT}
      />
      <RoleSelector value={role} onChange={setRole} error={errors.role} />
      <ConsentCheckbox
        checked={acceptsTerms}
        onChange={setAcceptsTerms}
        error={errors.acceptsTerms}
      />
      {errors.termsVersion ? <InlineMessage message={errors.termsVersion} /> : null}
      <PrimaryButton label="Crear cuenta" onPress={handleSubmit} loading={submitting} />
      <View style={styles.links}>
        <LinkButton label="Ya tengo una cuenta" onPress={() => navigation.navigate('Login')} />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  links: {
    marginTop: spacing.sm,
  },
});
