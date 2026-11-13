import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { getAuthErrorMessage } from '../../auth/utils/auth-error-message';

export function HomeScreen() {
  const { session, signOut, isSigningOut } = useAuthSession();
  const [error, setError] = useState<string | null>(null);

  if (!session) {
    return null;
  }

  const roleLabel = session.role === 'CLIENTE' ? 'Cliente' : 'Prestador';
  const isClient = session.role === 'CLIENTE';

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
    <ScreenLayout title="Inicio" subtitle={`Hola, ${roleLabel}.`}>
      {error ? <InlineMessage message={error} /> : null}

      <Card style={styles.identityCard}>
        <View style={styles.identityRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{session.email.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.identity}>
            <Text style={styles.label}>Cuenta</Text>
            <Text style={styles.email} numberOfLines={1}>
              {session.email}
            </Text>
            <View style={styles.rolePill}>
              <Text style={styles.roleText}>{roleLabel}</Text>
            </View>
          </View>
        </View>
      </Card>

      <Card style={styles.contextCard}>
        <View style={styles.contextIcon}>
          <Ionicons
            name={isClient ? 'search-outline' : 'briefcase-outline'}
            size={22}
            color={colors.primary}
          />
        </View>
        <View style={styles.contextText}>
          <Text style={styles.contextTitle}>
            {isClient ? 'Encuentra el servicio que necesitas' : 'Tu espacio profesional'}
          </Text>
          <Text style={styles.contextMessage}>
            {isClient
              ? 'Usa Buscar para explorar prestadores por categoría y zona, o revisa tus solicitudes en la barra inferior.'
              : 'Usa Perfil profesional para consultar tu vista pública y tu agenda desde la barra inferior.'}
          </Text>
        </View>
      </Card>

      <InlineMessage
        variant="info"
        message="La sesión se mantiene solo durante esta ejecución. Al cerrar la app deberás autenticarte de nuevo."
      />

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
  identityCard: {
    padding: spacing.lg,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.avatar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.surface,
    fontSize: 25,
    fontWeight: '800',
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  email: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.infoSurface,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginTop: spacing.xs,
  },
  roleText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  contextCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  contextIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextText: {
    flex: 1,
    gap: 3,
  },
  contextTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  contextMessage: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});
