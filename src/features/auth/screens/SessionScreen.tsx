import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../../../shared/ui/theme';
import { AuthScreenLayout } from '../components/AuthScreenLayout';
import { InlineMessage } from '../components/InlineMessage';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuthSession } from '../session/AuthSessionProvider';
import { getAuthErrorMessage } from '../utils/auth-error-message';

export function SessionScreen() {
  const { session, signOut, isSigningOut } = useAuthSession();
  const [error, setError] = useState<string | null>(null);

  if (!session) {
    return null;
  }

  const roleLabel = session.role === 'CLIENTE' ? 'Cliente' : 'Prestador';

  const handleSignOut = async () => {
    setError(null);
    try {
      await signOut();
    } catch (signOutError) {
      setError(
        getAuthErrorMessage(signOutError, 'No fue posible cerrar sesión. Intenta de nuevo.')
      );
    }
  };

  return (
    <AuthScreenLayout title="Sesión iniciada" subtitle={`Has accedido como ${roleLabel}.`}>
      <InlineMessage
        variant="info"
        message="La sesión se mantiene solo durante esta ejecución. Al cerrar la app deberás autenticarte de nuevo."
      />
      {error ? <InlineMessage message={error} /> : null}
      <View style={styles.card}>
        <Text style={styles.label}>Cuenta</Text>
        <Text style={styles.value}>{session.email}</Text>
        <Text style={styles.label}>Rol</Text>
        <Text style={styles.value}>{roleLabel}</Text>
      </View>
      <PrimaryButton label="Cerrar sesión" onPress={handleSignOut} loading={isSigningOut} />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  value: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
});
