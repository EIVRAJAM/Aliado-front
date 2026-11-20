import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { ProfileActionCard } from '../../profile/components/ProfileActionCard';

type AccountActivityScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'AccountActivity'
>;

export function AccountActivityScreen({ navigation }: AccountActivityScreenProps) {
  const { session } = useAuthSession();

  if (!session) {
    return null;
  }

  return (
    <ScreenLayout
      title="Actividad y avisos"
      subtitle="Consulta tu historial, eventos y preferencias de notificación."
      onBack={() => navigation.goBack()}
    >
      <InlineMessage
        variant="info"
        message="Solo se muestra la información autorizada de tu propia cuenta."
      />

      <ProfileActionCard
        icon="▤"
        title="Historial de trabajos"
        subtitle="Servicios en los que participaste como Cliente o Prestador."
        tone="green"
        onPress={() => navigation.navigate('WorkHistory')}
      />
      <ProfileActionCard
        icon="◷"
        title="Actividad reciente"
        subtitle="Últimos eventos visibles de tu cuenta."
        tone="teal"
        onPress={() => navigation.navigate('RecentActivity')}
      />
      <ProfileActionCard
        icon="◉"
        title="Preferencias de notificación"
        subtitle="Elige qué avisos recibir y por qué canal."
        onPress={() => navigation.navigate('NotificationPreferences')}
      />
      {session.role === 'PRESTADOR' ? (
        <ProfileActionCard
          icon="▥"
          title="Indicadores"
          subtitle="Resumen de tu actividad y reputación como Prestador."
          tone="green"
          onPress={() => navigation.navigate('ProviderIndicators')}
        />
      ) : null}

      <View style={styles.note}>
        <Text style={styles.noteText}>
          El historial y la actividad se construyen con los servicios y eventos asociados a tu
          cuenta; no se combinan datos de otras personas.
        </Text>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  note: {
    borderRadius: radii.md,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  noteText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
});
