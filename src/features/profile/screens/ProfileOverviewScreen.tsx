import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { LinkButton } from '../../../shared/ui/LinkButton';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { spacing } from '../../../shared/ui/theme';
import { ProfileStateView } from '../components/ProfileStateView';
import { ProfileSummaryCard } from '../components/ProfileSummaryCard';
import { useMyProfile } from '../hooks/useMyProfile';

type ProfileOverviewScreenProps = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export function ProfileOverviewScreen({ navigation }: ProfileOverviewScreenProps) {
  const { profile, loading, error, reload } = useMyProfile();

  return (
    <ScreenLayout
      title="Mi perfil"
      subtitle="Consulta y administra la información de tu cuenta."
    >
      {loading || error || !profile ? (
        <ProfileStateView loading={loading} error={error} onRetry={reload} />
      ) : (
        <>
          <ProfileSummaryCard profile={profile} />
          <InlineMessage
            variant="info"
            message="La zona aproximada es el dato público. La dirección exacta solo se muestra en tu perfil autenticado."
          />
          <View style={styles.actions}>
            <PrimaryButton
              label="Editar datos"
              onPress={() => navigation.navigate('ProfileEdit')}
            />
            <PrimaryButton
              label="Actualizar ubicación"
              onPress={() => navigation.navigate('ProfileLocation')}
            />
            <PrimaryButton
              label="Configurar privacidad"
              onPress={() => navigation.navigate('ProfilePrivacy')}
            />
          </View>
          <LinkButton
            label="Ver vista previa pública"
            onPress={() => navigation.navigate('ProfilePublicPreview', { userId: profile.usuarioId })}
          />
          <LinkButton
            label="Eliminar cuenta"
            onPress={() => navigation.navigate('ProfileDelete')}
          />
        </>
      )}
      <LinkButton label="Volver a la sesión" onPress={() => navigation.goBack()} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
});
