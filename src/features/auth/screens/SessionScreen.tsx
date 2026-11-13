import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../session/AuthSessionProvider';
import { getAuthErrorMessage } from '../utils/auth-error-message';

type SessionScreenProps = NativeStackScreenProps<RootStackParamList, 'Session'>;

export function SessionScreen({ navigation }: SessionScreenProps) {
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
    <ScreenLayout title="Sesión iniciada" subtitle={`Has accedido como ${roleLabel}.`}>
      <InlineMessage
        variant="info"
        message="La sesión se mantiene solo durante esta ejecución. Al cerrar la app deberás autenticarte de nuevo."
      />
      {error ? <InlineMessage message={error} /> : null}
      <Card>
        <View style={styles.cardBody}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {session.email.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.identity}>
            <Text style={styles.label}>Cuenta</Text>
            <Text style={styles.value}>{session.email}</Text>
            <Text style={styles.label}>Rol</Text>
            <Text style={styles.value}>{roleLabel}</Text>
          </View>
        </View>
      </Card>
      <PrimaryButton label="Mi perfil" onPress={() => navigation.navigate('Profile')} />
      <PrimaryButton
        label="Cerrar sesión"
        variant="danger"
        onPress={handleSignOut}
        loading={isSigningOut}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.avatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: '800',
  },
  identity: {
    flex: 1,
    gap: 1,
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  value: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
});
