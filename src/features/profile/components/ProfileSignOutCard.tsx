import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { getAuthErrorMessage } from '../../auth/utils/auth-error-message';

export function ProfileSignOutCard() {
  const { signOut, isSigningOut } = useAuthSession();
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }
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
    <>
      {error ? <InlineMessage message={error} /> : null}
      <Card style={styles.card}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión. Finaliza la sesión en este dispositivo."
          accessibilityState={{ busy: isSigningOut, disabled: isSigningOut }}
          disabled={isSigningOut}
          onPress={() => {
            void handleSignOut();
          }}
          style={({ pressed }) => [
            styles.row,
            pressed && !isSigningOut ? styles.pressed : null,
          ]}
        >
          <View style={styles.iconBadge}>
            <Ionicons name="log-out-outline" size={20} color={colors.neutral} />
          </View>
          <View style={styles.text}>
            <Text style={styles.title}>Cerrar sesión</Text>
            <Text style={styles.subtitle}>Finaliza la sesión en este dispositivo.</Text>
          </View>
          {isSigningOut ? (
            <ActivityIndicator color={colors.muted} />
          ) : (
            <Ionicons name="chevron-forward" size={18} color={colors.chevron} />
          )}
        </Pressable>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  pressed: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.neutralSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
});
