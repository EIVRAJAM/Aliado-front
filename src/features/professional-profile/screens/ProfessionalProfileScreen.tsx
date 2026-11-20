import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { MainTabParamList, RootStackParamList } from '../../../navigation/types';
import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { ScreenLayout } from '../../../shared/ui/ScreenLayout';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { ReportReviewModal } from '../../trust/components/ReportReviewModal';
import { VerificationCard } from '../../trust/components/VerificationCard';
import { AgendaSection } from '../components/AgendaSection';
import { PublicPreviewCard } from '../components/PublicPreviewCard';
import { useProfessionalProfileOverview } from '../hooks/useProfessionalProfileOverview';

type ProfessionalProfileScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'ProfessionalProfile'>,
  NativeStackScreenProps<RootStackParamList>
>;

export function ProfessionalProfileScreen({ navigation }: ProfessionalProfileScreenProps) {
  const { session } = useAuthSession();
  const {
    preview,
    agenda,
    previewLoading,
    agendaLoading,
    previewError,
    agendaError,
    previewMissing,
    agendaMissing,
    reload,
  } = useProfessionalProfileOverview();
  const [reviewToReport, setReviewToReport] = useState<{ id: string; texto: string } | null>(null);

  if (!session) {
    return null;
  }

  if (session.role !== 'PRESTADOR') {
    return (
      <ScreenLayout
        title="Perfil profesional"
        subtitle="Esta sección pertenece a las cuentas de prestador."
      >
        <InlineMessage
          variant="info"
          message="Tu cuenta no tiene el rol Prestador, por lo que no puede gestionar un perfil profesional."
        />
      </ScreenLayout>
    );
  }

  const loading = previewLoading && agendaLoading;

  return (
    <ScreenLayout
      title="Perfil profesional"
      subtitle="Consulta tu vista pública y tu agenda."
    >
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Cargando perfil profesional…</Text>
        </View>
      ) : (
        <>
          {previewLoading ? (
            <Card style={styles.loadingCard}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Cargando vista previa…</Text>
            </Card>
          ) : previewError ? (
            <InlineMessage message={previewError} />
          ) : previewMissing || !preview ? (
            <Card style={styles.missingCard}>
              <View style={styles.missingHeader}>
                <View style={styles.missingIcon}>
                  <Ionicons name="id-card-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.missingText}>
                  <Text style={styles.missingTitle}>Sin perfil profesional</Text>
                  <Text style={styles.missingMessage}>
                    No encontramos un perfil profesional asociado a tu cuenta.
                  </Text>
                </View>
              </View>
              <PrimaryButton
                label="Crear mi perfil profesional"
                onPress={() => navigation.navigate('ProfessionalProfileCreate')}
              />
            </Card>
          ) : (
            <PublicPreviewCard preview={preview} onReportReview={setReviewToReport} />
          )}

          <VerificationCard />

          <AgendaSection
            agenda={agenda}
            loading={agendaLoading}
            error={agendaError}
            missing={agendaMissing}
          />

          <Card style={styles.limitsCard}>
            <View style={styles.limitsHeader}>
              <View style={styles.limitsIcon}>
                <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
              </View>
              <Text style={styles.limitsTitle}>Alcance actual</Text>
            </View>
            <Text style={styles.limitItem}>
              • La vista pública y la agenda están disponibles en modo consulta.
            </Text>
            <Text style={styles.limitItem}>
              • La edición del perfil, experiencia, portafolio y disponibilidad aún no está
              disponible en la app.
            </Text>
            <Text style={styles.limitItem}>
              • La evidencia del portafolio no se puede mostrar todavía.
            </Text>
            <Text style={styles.limitItem}>
              • La creación o edición de compromisos de agenda espera la definición de la regla de
              zona horaria.
            </Text>
          </Card>

          <PrimaryButton
            label="Actualizar"
            variant="secondary"
            onPress={() => {
              void reload();
            }}
          />
        </>
      )}

      <ReportReviewModal
        visible={reviewToReport !== null}
        token={session.token}
        review={reviewToReport}
        onClose={() => setReviewToReport(null)}
      />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 14,
  },
  missingCard: {
    gap: spacing.lg,
  },
  missingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  missingIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingText: {
    flex: 1,
    gap: 2,
  },
  missingTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  missingMessage: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  limitsCard: {
    gap: spacing.sm,
  },
  limitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  limitsIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  limitsTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  limitItem: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
});
