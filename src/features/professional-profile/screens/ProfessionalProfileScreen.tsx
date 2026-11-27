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
import { VerificationCard } from '../../trust/components/VerificationCard';
import { ProfessionalDescriptionCard } from '../components/ProfessionalDescriptionCard';
import { PublicPreviewCard } from '../components/PublicPreviewCard';
import { useProfessionalProfileOverview } from '../hooks/useProfessionalProfileOverview';
import { formatAvailability } from '../utils/professional-profile-format';

type ProfessionalProfileScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ProfessionalProfile'
>;

export function ProfessionalProfileScreen({ navigation }: ProfessionalProfileScreenProps) {
  const { session } = useAuthSession();
  const {
    profile,
    profileLoading,
    profileError,
    profileMissing,
    preview,
    previewLoading,
    previewError,
    previewMissing,
    saveDescription,
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

  const loading = profileLoading && previewLoading;

  return (
    <ScreenLayout
      title="Perfil profesional"
      subtitle="Gestiona tu descripción, vista pública y verificación."
      onBack={() => navigation.goBack()}
    >
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Cargando perfil profesional…</Text>
        </View>
      ) : (
        <>
          {profileError ? (
            <>
              <InlineMessage message={profileError} />
              <PrimaryButton
                label="Reintentar"
                variant="secondary"
                onPress={() => {
                  void reload();
                }}
              />
            </>
          ) : profileMissing ? (
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
            <>
              <ProfessionalDescriptionCard
                description={profile?.descripcion ?? null}
                onSave={saveDescription}
              />

              <Card style={styles.availabilityCard}>
                <View style={styles.availabilityHeader}><View style={styles.availabilityIcon}><Ionicons name="time-outline" size={18} color={colors.primary} /></View><View style={styles.availabilityText}><Text style={styles.availabilityTitle}>Disponibilidad</Text><Text style={styles.availabilitySubtitle}>Bloques semanales de atención declarados.</Text></View></View>
                {profile?.disponibilidades.length ? <Text style={styles.availabilityList}>{profile.disponibilidades.map(formatAvailability).join(' · ')}</Text> : <InlineMessage variant="info" message="Aún no configuraste bloques de disponibilidad." />}
                <PrimaryButton label="Configurar disponibilidad" variant="secondary" onPress={() => navigation.navigate('ProfessionalAvailability')} />
              </Card>

              {previewLoading ? (
                <Card style={styles.loadingCard}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.loadingText}>Cargando vista previa…</Text>
                </Card>
              ) : previewError ? (
                <InlineMessage message={previewError} />
              ) : previewMissing || !preview ? (
                <InlineMessage
                  variant="info"
                  message="La vista previa pública no está disponible en este momento. Puedes seguir editando tu descripción profesional."
                />
              ) : (
                <PublicPreviewCard preview={preview} onReportReview={setReviewToReport} />
              )}
            </>
          )}

          <VerificationCard />

          <Card style={styles.limitsCard}>
            <View style={styles.limitsHeader}>
              <View style={styles.limitsIcon}>
                <Ionicons name="information-circle-outline" size={18} color={colors.muted} />
              </View>
              <Text style={styles.limitsTitle}>Alcance actual</Text>
            </View>
            <Text style={styles.limitItem}>
              • Puedes consultar y editar la descripción profesional; la vista pública la muestra
              cuando tiene contenido.
            </Text>
            <Text style={styles.limitItem}>
              • La disponibilidad semanal y los compromisos de agenda ya se pueden editar desde la
              app con el contrato actual.
            </Text>
            <Text style={styles.limitItem}>
              • El matching automático entre solicitudes y disponibilidad sigue pendiente de D-03.
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
  availabilityCard: { gap: spacing.md },
  availabilityHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  availabilityIcon: { width: 38, height: 38, borderRadius: radii.md, backgroundColor: colors.infoSurface, alignItems: 'center', justifyContent: 'center' },
  availabilityText: { flex: 1, gap: 2 },
  availabilityTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  availabilitySubtitle: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  availabilityList: { color: colors.text, fontSize: 13, lineHeight: 19 },
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
