import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import type {
  FormalizationLink,
  FormalizationLinkState,
  FormalizationProgress,
  FormalizationProgressStatus,
  FormalizationRoute,
} from '../types/formalization';
import { shouldShowRouteProgress } from '../utils/formalization-progress';
import { FormalizationLinkRow } from './FormalizationLinkRow';

interface FormalizationRouteCardProps {
  route: FormalizationRoute;
  progress?: FormalizationProgress;
  progressStatus: FormalizationProgressStatus;
  linkStates: Record<string, FormalizationLinkState>;
  openingLinkId: string | null;
  onOpenLink: (link: FormalizationLink) => void;
}

export function FormalizationRouteCard({
  route,
  progress,
  progressStatus,
  linkStates,
  openingLinkId,
  onOpenLink,
}: FormalizationRouteCardProps) {
  const hasLinks = route.pasos.some((step) => step.enlaces.length > 0);
  const showProgressSection = shouldShowRouteProgress(progressStatus);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="map-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{route.nombre}</Text>
          {route.descripcion ? (
            <Text style={styles.description}>{route.descripcion}</Text>
          ) : null}
        </View>
      </View>

      {showProgressSection ? (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Avance orientativo</Text>
            {progress ? (
              <Text style={styles.progressValue}>{progress.valorOrientativo}%</Text>
            ) : null}
          </View>
          {progress ? (
            <>
              <View
                accessibilityRole="progressbar"
                accessibilityLabel={`Avance orientativo: ${progress.valorOrientativo}%`}
                accessibilityValue={{ min: 0, max: 100, now: progress.valorOrientativo }}
                style={styles.progressTrack}
              >
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress.valorOrientativo}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressNote}>{progress.avisoLegal}</Text>
            </>
          ) : (
            <Text style={styles.progressMissing}>
              Aún no hay un avance registrado para esta ruta.
            </Text>
          )}
        </View>
      ) : null}

      <View style={styles.steps}>
        {route.pasos.length === 0 ? (
          <Text style={styles.emptySteps}>Esta ruta no tiene pasos publicados.</Text>
        ) : (
          route.pasos.map((step) => (
            <View key={step.id} style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.orden}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.titulo}</Text>
                {step.descripcion ? (
                  <Text style={styles.stepDescription}>{step.descripcion}</Text>
                ) : null}
                {step.enlaces.length > 0 ? (
                  <View style={styles.links}>
                    {step.enlaces.map((link) => (
                      <FormalizationLinkRow
                        key={link.id}
                        link={link}
                        state={linkStates[link.id] ?? link.estado}
                        opening={openingLinkId === link.id}
                        onPress={() => onOpenLink(link)}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            </View>
          ))
        )}
      </View>

      {hasLinks ? (
        <View style={styles.linkNote}>
          <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
          <Text style={styles.linkNoteText}>
            Abrir un enlace externo no marca el paso como completado ni actualiza tu progreso.
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  description: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  progressCard: {
    gap: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  progressLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  progressValue: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  progressNote: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  progressMissing: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  steps: {
    gap: spacing.lg,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '800',
  },
  stepContent: {
    flex: 1,
    gap: spacing.xs,
  },
  stepTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  stepDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  links: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  emptySteps: {
    color: colors.muted,
    fontSize: 13,
  },
  linkNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  linkNoteText: {
    flex: 1,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
  },
});
