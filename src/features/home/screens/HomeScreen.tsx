import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { MainTabParamList, RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';

type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function HomeScreen({ navigation }: HomeScreenProps) {
  const { session } = useAuthSession();

  if (!session) {
    return null;
  }

  const roleLabel = session.role === 'CLIENTE' ? 'Cliente' : 'Prestador';
  const isClient = session.role === 'CLIENTE';

  return (
    <ScreenLayout
      title="Inicio"
      headerAction={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Avisos de servicio"
          onPress={() => navigation.navigate('ServiceNotifications')}
          style={({ pressed }) => [
            styles.headerAction,
            pressed ? styles.headerActionPressed : null,
          ]}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.primary} />
        </Pressable>
      }
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{isClient ? 'Espacio Cliente' : 'Espacio Prestador'}</Text>
        <Text style={styles.heroTitle}>
          {isClient ? 'Hola, ¿qué servicio necesitas?' : 'Hola, este es tu espacio profesional'}
        </Text>
        <Text style={styles.heroSubtitle}>
          {isClient
            ? 'Explora prestadores por categoría y zona, y continúa con tus solicitudes desde la barra inferior.'
            : 'Revisa oportunidades compatibles y consulta tu perfil y agenda desde la barra inferior.'}
        </Text>
      </View>

      <Card style={styles.accountCard}>
        <View style={styles.accountRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{session.email.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.accountText}>
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
            name={isClient ? 'compass-outline' : 'briefcase-outline'}
            size={22}
            color={colors.primary}
          />
        </View>
        <View style={styles.contextText}>
          <Text style={styles.contextTitle}>
            {isClient ? 'Tu actividad empieza en Buscar' : 'Tu demanda está en Oportunidades'}
          </Text>
          <Text style={styles.contextMessage}>
            {isClient
              ? 'Usa Buscar para elegir categoría y zona. En Solicitudes puedes revisar lo que ya publicaste.'
              : 'En Oportunidades puedes revisar solicitudes compatibles. Tu perfil público y agenda están en Profesional.'}
          </Text>
        </View>
      </Card>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  heroSubtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  accountCard: {
    padding: spacing.lg,
  },
  accountRow: {
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
    fontSize: 23,
    fontWeight: '800',
  },
  accountText: {
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
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionPressed: {
    backgroundColor: colors.background,
  },
});
