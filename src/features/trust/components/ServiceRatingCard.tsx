import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useTrustError } from '../hooks/useTrustError';
import { trustGateway } from '../services/trust-gateway-instance';
import {
  TrustError,
  isTrustConflict,
  isUncertainTrustError,
  type RatingResult,
} from '../types/trust';

interface ServiceRatingCardProps {
  token: string;
  serviceId: string;
  onRefresh: () => void;
}

type SubmitPhase = 'CALIFICACION' | 'RESENA' | null;

export function ServiceRatingCard({ token, serviceId, onRefresh }: ServiceRatingCardProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const resolveError = useTrustError();
  const [selectedValue, setSelectedValue] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [phase, setPhase] = useState<SubmitPhase>(null);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [savedRating, setSavedRating] = useState<RatingResult | null>(null);
  const [ratingBlocked, setRatingBlocked] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [reviewAlreadyExisted, setReviewAlreadyExisted] = useState(false);

  const submitting = phase !== null;
  const reviewReady = reviewText.trim().length > 0;
  const canSubmit = savedRating
    ? !reviewDone && reviewReady && !submitting
    : selectedValue >= 1 && reviewReady && !submitting && !ratingBlocked;
  const ctaLabel =
    phase === 'CALIFICACION'
      ? 'Guardando calificación'
      : phase === 'RESENA'
        ? 'Guardando reseña'
        : savedRating
          ? 'Reintentar reseña'
          : 'Enviar calificación y reseña';

  const sendReview = async (rating: RatingResult) => {
    setPhase('RESENA');
    setReviewError(null);
    try {
      await trustGateway.agregarResena(token, rating.id, reviewText.trim());
      setReviewAlreadyExisted(false);
      setReviewDone(true);
    } catch (error) {
      if (
        error instanceof TrustError &&
        error.code === 'CONFLICT' &&
        error.serverCode === 'RESENA_YA_EXISTE'
      ) {
        setReviewAlreadyExisted(true);
        setReviewDone(true);
        return;
      }
      const message = resolveError(error, 'No fue posible registrar la reseña.');
      if (!message) {
        return;
      }
      setReviewError(
        isUncertainTrustError(error)
          ? 'No se pudo confirmar si la reseña se guardó. La calificación sí quedó registrada; reintenta solo la reseña. Si ya existe, se rechazará el duplicado.'
          : message
      );
    } finally {
      setPhase(null);
    }
  };

  const submit = async () => {
    if (submitting || reviewDone || ratingBlocked) {
      return;
    }
    const texto = reviewText.trim();
    if (selectedValue < 1) {
      setRatingError('Selecciona una calificación de 1 a 5 estrellas.');
      return;
    }
    if (!texto) {
      setRatingError('La reseña es obligatoria para completar el envío.');
      return;
    }
    setRatingError(null);

    if (savedRating) {
      await sendReview(savedRating);
      return;
    }

    setPhase('CALIFICACION');
    try {
      const rating = await trustGateway.calificar(token, serviceId, selectedValue);
      setSavedRating(rating);
      await sendReview(rating);
    } catch (error) {
      const message = resolveError(error, 'No fue posible registrar la calificación.');
      if (!message) {
        return;
      }
      if (isTrustConflict(error)) {
        setRatingBlocked(true);
        if (error instanceof TrustError && error.serverCode === 'YA_CALIFICADO') {
          setAlreadyRated(true);
          setRatingError(null);
          return;
        }
        if (error instanceof TrustError && error.serverCode === 'SERVICIO_NO_FINALIZADO') {
          onRefresh();
        }
      } else if (error instanceof TrustError && error.code === 'NOT_FOUND') {
        onRefresh();
      }
      setRatingError(
        isUncertainTrustError(error)
          ? 'No se pudo confirmar si la calificación se guardó. La app no la reenviará automáticamente. Si reintentas y ya existe, se rechazará el duplicado.'
          : message
      );
    } finally {
      setPhase((current) => (current === 'CALIFICACION' ? null : current));
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Ionicons name="star-outline" size={18} color={colors.warning} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Calificación y reseña</Text>
          <Text style={styles.subtitle}>
            Ambos campos son obligatorios en la app. La calificación solo se registra una vez.
          </Text>
        </View>
      </View>

      {alreadyRated ? (
        <InlineMessage
          variant="info"
          message="Este servicio ya tiene una calificación registrada. No se envió una segunda calificación. No es posible mostrar ni editar la reseña desde aquí."
        />
      ) : (
        <>
          <View
            style={styles.starsRow}
            accessibilityRole="radiogroup"
            accessibilityState={{ disabled: savedRating !== null || submitting }}
          >
            {[1, 2, 3, 4, 5].map((value) => {
              const selected = value <= selectedValue;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="radio"
                  accessibilityLabel={`${value} ${value === 1 ? 'estrella' : 'estrellas'}`}
                  accessibilityState={{
                    selected: value === selectedValue,
                    disabled: savedRating !== null || submitting,
                  }}
                  disabled={savedRating !== null || submitting}
                  onPress={() => setSelectedValue(value)}
                  style={({ pressed }) => [styles.starButton, pressed ? styles.pressed : null]}
                >
                  <Ionicons
                    name={selected ? 'star' : 'star-outline'}
                    size={30}
                    color={colors.warning}
                  />
                </Pressable>
              );
            })}
          </View>

          {!reviewDone ? (
            <>
              <TextInput
                value={reviewText}
                onChangeText={setReviewText}
                placeholder="Escribe tu reseña (obligatoria)"
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
                editable={!submitting}
                style={styles.input}
              />
              <Text style={styles.hint}>
                La calificación se guarda antes que la reseña. Si la reseña falla, puedes
                reintentarla aquí sin volver a calificar.
              </Text>
              <Text style={styles.hint}>
                Si sales de esta pantalla, no podrás recuperar la calificación ni una reseña
                pendiente.
              </Text>
              {ratingError ? <InlineMessage message={ratingError} /> : null}
              {savedRating ? (
                <InlineMessage
                  variant="success"
                  message={`Calificación guardada. Reputación actualizada: ${savedRating.reputacionActualizada.toFixed(
                    1
                  )}. La reseña sigue pendiente.`}
                />
              ) : null}
              {savedRating && reviewError ? <InlineMessage message={reviewError} /> : null}
              <PrimaryButton
                label={ctaLabel}
                loading={submitting}
                disabled={!canSubmit}
                onPress={() => {
                  void submit();
                }}
              />
            </>
          ) : (
            <>
              <InlineMessage
                variant="success"
                message={
                  reviewAlreadyExisted
                    ? 'La reseña ya estaba registrada para esta calificación. No se creó un duplicado.'
                    : `Calificación y reseña registradas. Reputación actualizada: ${savedRating?.reputacionActualizada.toFixed(
                        1
                      )}.`
                }
              />
              {reviewAlreadyExisted ? (
                <Text style={styles.hint}>
                  La reseña ya estaba registrada. La app no volvió a enviar la calificación.
                </Text>
              ) : null}
            </>
          )}
        </>
      )}
    </Card>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.warningSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 2 },
  title: { color: colors.text, fontSize: 16, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  starButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  pressed: { backgroundColor: colors.background },
  input: {
    minHeight: 112,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
});
