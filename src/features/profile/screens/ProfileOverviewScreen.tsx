import { StyleSheet, Text, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { MainTabParamList, RootStackParamList } from '../../../navigation/types';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { ProfileActionCard } from '../components/ProfileActionCard';
import { ProfileSignOutCard } from '../components/ProfileSignOutCard';
import { ProfileStateView } from '../components/ProfileStateView';
import { useMyProfile } from '../hooks/useMyProfile';
import { visibilityLabel } from '../utils/profile-format';

type ProfileOverviewScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function ProfileOverviewScreen({ navigation }: ProfileOverviewScreenProps) {
  const { session } = useAuthSession();
  const { profile, loading, error, reload } = useMyProfile();

  return (
    <ScreenLayout
      title="Mi perfil"
      subtitle="Consulta y administra la información de tu cuenta."
    >
      <InlineMessage
        variant="info"
        message="La sesión se mantiene solo durante esta ejecución. Al cerrar la app deberás autenticarte de nuevo."
      />
      {loading || error || !profile ? (
        <ProfileStateView loading={loading} error={error} onRetry={reload} />
      ) : (
        <>
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.nombre?.trim().charAt(0).toUpperCase() || 'A'}
              </Text>
            </View>
            <Text style={styles.name}>{profile.nombre?.trim() || 'Tu cuenta'}</Text>
            <Text style={styles.location}>
              ◎ Ubicación aproximada: {profile.zonaAproximada?.trim() || 'Sin configurar'}
            </Text>
            <View style={styles.visibilityPill}>
              <Text style={styles.visibilityText}>
                Visibilidad: {visibilityLabel(profile.preferenciaVisibilidad)}
              </Text>
            </View>
          </View>

          <ProfileActionCard
            icon="✎"
            title="Datos personales"
            subtitle={`${profile.nombre?.trim() || 'Sin nombre'} · ${
              profile.telefono?.trim() || 'Sin teléfono'
            }`}
            onPress={() => navigation.navigate('ProfileEdit')}
          />
          <ProfileActionCard
            icon="⌖"
            title="Ubicación"
            subtitle={`Zona aproximada: ${profile.zonaAproximada?.trim() || 'Sin configurar'}`}
            tone="teal"
            onPress={() => navigation.navigate('ProfileLocation')}
          />
          <ProfileActionCard
            icon="◉"
            title="Privacidad"
            subtitle={`Visibilidad: ${visibilityLabel(profile.preferenciaVisibilidad)}`}
            onPress={() => navigation.navigate('ProfilePrivacy')}
          />
          {session?.role === 'CLIENTE' ? (
            <ProfileActionCard
              icon="★"
              title="Mis calificaciones y reseñas"
              subtitle="Historial privado de los servicios que calificaste."
              tone="green"
              onPress={() => navigation.navigate('MyRatings')}
            />
          ) : null}
          <ProfileActionCard
            icon="◌"
            title="Vista previa pública"
            subtitle="Solo se muestra tu zona aproximada."
            tone="green"
            onPress={() =>
              navigation.navigate('ProfilePublicPreview', { userId: profile.usuarioId })
            }
          />
          <ProfileActionCard
            icon="!"
            title="Eliminar cuenta"
            subtitle="Solicitud con confirmación explícita."
            tone="danger"
            onPress={() => navigation.navigate('ProfileDelete')}
          />

          <InlineMessage
            variant="info"
            message="La zona aproximada es el dato público. La dirección exacta solo se muestra en tu perfil autenticado."
          />
        </>
      )}
      <ProfileSignOutCard />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  identity: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.avatar,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    color: colors.surface,
    fontSize: 32,
    fontWeight: '800',
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  location: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
  },
  visibilityPill: {
    borderRadius: radii.sm,
    backgroundColor: colors.infoSurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginTop: spacing.xs,
  },
  visibilityText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
});
