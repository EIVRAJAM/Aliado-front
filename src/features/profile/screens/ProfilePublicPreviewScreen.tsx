import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { LinkButton } from '../../../shared/ui/LinkButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { ProfileStateView } from '../components/ProfileStateView';
import { profileGateway } from '../services/profile-gateway-instance';
import type { PublicProfile } from '../types/profile';
import { getProfileErrorMessage } from '../utils/profile-error-message';

type ProfilePublicPreviewScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ProfilePublicPreview'
>;

export function ProfilePublicPreviewScreen({ navigation, route }: ProfilePublicPreviewScreenProps) {
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await profileGateway.getPublicProfile(route.params.userId);
      setPublicProfile(result);
    } catch (loadError) {
      setError(
        getProfileErrorMessage(loadError, 'No fue posible cargar la vista pública del perfil.')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [route.params.userId]);

  return (
    <ScreenLayout
      title="Vista previa pública"
      subtitle="Así se muestra tu zona a otras personas."
    >
      {loading || error || !publicProfile ? (
        <ProfileStateView loading={loading} error={error} onRetry={load} />
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.label}>Zona aproximada</Text>
            <Text style={styles.value}>
              {publicProfile.zonaAproximada?.trim() || 'Sin zona configurada'}
            </Text>
          </View>
          <InlineMessage
            variant="info"
            message="La dirección exacta no se expone en esta vista pública."
          />
          {!publicProfile.zonaAproximada ? (
            <InlineMessage
              variant="info"
              message="Configura una zona aproximada para que tu perfil público esté disponible."
            />
          ) : null}
        </>
      )}
      <LinkButton label="Volver a mi perfil" onPress={() => navigation.goBack()} />
    </ScreenLayout>
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
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  value: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
});
