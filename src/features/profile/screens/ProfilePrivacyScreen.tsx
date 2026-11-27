import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { ProfileStateView } from '../components/ProfileStateView';
import { VisibilitySelector } from '../components/VisibilitySelector';
import { useMyProfile } from '../hooks/useMyProfile';
import { useProfileError } from '../hooks/useProfileError';
import { profileGateway } from '../services/profile-gateway-instance';
import type { VisibilityPreference } from '../types/profile';

type ProfilePrivacyScreenProps = NativeStackScreenProps<RootStackParamList, 'ProfilePrivacy'>;

export function ProfilePrivacyScreen({ navigation }: ProfilePrivacyScreenProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const { session } = useAuthSession();
  const { profile, loading, error, reload } = useMyProfile();
  const resolveError = useProfileError();
  const [visibility, setVisibility] = useState<VisibilityPreference>('SOLO_ZONA');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setVisibility(profile.preferenciaVisibilidad);
    }
  }, [profile]);

  const handleSubmit = async () => {
    if (!session || !profile || submitting) {
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      await profileGateway.updateVisibility(session.token, visibility);
      Alert.alert('Privacidad actualizada', 'Tu preferencia de visibilidad se guardó correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (updateError) {
      const message = resolveError(updateError, 'No fue posible actualizar tu privacidad.');
      if (message) {
        setFormError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenLayout
      title="Privacidad"
      subtitle="Define cómo se muestra tu perfil a otras personas."
      onBack={() => navigation.goBack()}
    >
      {loading || error || !profile ? (
        <ProfileStateView loading={loading} error={error} onRetry={reload} />
      ) : (
        <>
          <InlineMessage
            variant="info"
            message="Tu configuración limita la información visible en tu perfil. La dirección exacta nunca se publica."
          />
          <Card style={styles.formCard}>
            {formError ? <InlineMessage message={formError} /> : null}
            <VisibilitySelector value={visibility} onChange={setVisibility} disabled={submitting} />
            <PrimaryButton label="Guardar privacidad" onPress={handleSubmit} loading={submitting} />
          </Card>
        </>
      )}
    </ScreenLayout>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  formCard: {
    gap: spacing.lg,
  },
});
