import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { ReportReviewModal } from '../../trust/components/ReportReviewModal';
import { ProviderPublicProfileView } from '../components/ProviderPublicProfileView';
import { useProviderProfile } from '../hooks/useProviderProfile';

type ProviderProfileScreenProps = NativeStackScreenProps<RootStackParamList, 'ProviderProfile'>;

export function ProviderProfileScreen({ navigation, route }: ProviderProfileScreenProps) {
  const { session } = useAuthSession();

  if (!session) {
    return null;
  }

  if (session.role !== 'CLIENTE') {
    return (
      <ScreenLayout
        title="Perfil del prestador"
        subtitle="Esta sección pertenece a las cuentas de cliente."
        onBack={() => navigation.goBack()}
      >
        <InlineMessage
          variant="info"
          message="Tu cuenta no tiene el rol Cliente, por lo que no puede consultar perfiles públicos."
        />
      </ScreenLayout>
    );
  }

  return (
    <ClientProviderProfileScreen
      navigation={navigation}
      route={route}
      token={session.token}
    />
  );
}

function ClientProviderProfileScreen({
  navigation,
  route,
  token,
}: ProviderProfileScreenProps & { token: string }) {
  const { provider, loading, notFound, error, reload } = useProviderProfile(
    route.params.providerId
  );
  const [reviewToReport, setReviewToReport] = useState<{ id: string; texto: string } | null>(null);

  return (
    <ScreenLayout
      title="Perfil del prestador"
      subtitle="Consulta la información pública y la disponibilidad declarada."
      onBack={() => navigation.goBack()}
    >
      {loading ? (
        <Card style={styles.stateCard}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.stateText}>Cargando perfil público…</Text>
        </Card>
      ) : error ? (
        <>
          <InlineMessage message={error} />
          <PrimaryButton label="Reintentar" onPress={() => void reload()} />
        </>
      ) : notFound || !provider ? (
        <Card style={styles.notFoundCard}>
          <View style={styles.notFoundIcon}>
            <Ionicons name="alert-circle-outline" size={26} color={colors.muted} />
          </View>
          <Text style={styles.notFoundTitle}>Perfil no disponible</Text>
          <Text style={styles.notFoundText}>
            No podemos mostrar este perfil en este momento.
          </Text>
          <PrimaryButton
            label="Volver a la búsqueda"
            variant="secondary"
            onPress={() => navigation.goBack()}
          />
        </Card>
      ) : (
        <>
          <ProviderPublicProfileView provider={provider} onReportReview={setReviewToReport} />
          <PrimaryButton
            label="Volver a la búsqueda"
            variant="secondary"
            onPress={() => navigation.goBack()}
          />
        </>
      )}

      <ReportReviewModal
        visible={reviewToReport !== null}
        token={token}
        review={reviewToReport}
        onClose={() => setReviewToReport(null)}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  stateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stateText: {
    color: colors.muted,
    fontSize: 14,
  },
  notFoundCard: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  notFoundIcon: {
    width: 60,
    height: 60,
    borderRadius: radii.xl,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  notFoundTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  notFoundText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
