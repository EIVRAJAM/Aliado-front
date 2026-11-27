import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { appEnv } from '../../../shared/config/env';
import { spacing } from '../../../shared/ui/theme';
import type { RootStackParamList } from '../../../navigation/types';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { FormField } from '../../../shared/ui/FormField';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { LinkButton } from '../../../shared/ui/LinkButton';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { useAuthSession } from '../session/AuthSessionProvider';
import { getAuthErrorMessage } from '../utils/auth-error-message';
import {
  hasFieldErrors,
  validateLogin,
  type LoginFieldErrors,
} from '../validation/auth-validation';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation, route }: LoginScreenProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const { signIn } = useAuthSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<LoginFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const notice = route.params?.notice;

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }

    const nextErrors = validateLogin({ email, password });
    setErrors(nextErrors);
    setFormError(null);

    if (hasFieldErrors(nextErrors)) {
      return;
    }

    setSubmitting(true);
    try {
      await signIn({ email: email.trim(), password });
    } catch (error) {
      setFormError(getAuthErrorMessage(error, 'No fue posible iniciar sesión. Intenta de nuevo.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout
      variant="auth"
      title="Inicia sesión"
      subtitle="Accede a tu cuenta de Cliente o Prestador."
    >
      {!appEnv.apiBaseUrl ? (
        <InlineMessage
          variant="info"
          message="El inicio de sesión no está disponible en este momento. Intenta de nuevo más tarde."
        />
      ) : null}
      {notice ? <InlineMessage variant="success" message={notice} /> : null}
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
        autoComplete="current-password"
        textContentType="password"
        error={errors.password}
      />
      <PrimaryButton label="Iniciar sesión" onPress={handleSubmit} loading={submitting} />
      <View style={styles.links}>
        <LinkButton label="Crear una cuenta" onPress={() => navigation.navigate('Register')} />
        <LinkButton
          label="Olvidé mi contraseña"
          onPress={() => navigation.navigate('ForgotPassword')}
        />
      </View>
    </ScreenLayout>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  links: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
});
