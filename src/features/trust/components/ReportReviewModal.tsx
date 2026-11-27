import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReportEvidenceSection } from '../../reports';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useTrustError } from '../hooks/useTrustError';
import { isUncertainTrustError } from '../types/trust';
import { trustGateway } from '../services/trust-gateway-instance';

interface ReportReviewModalProps {
  visible: boolean;
  token: string;
  review: { id: string; texto: string } | null;
  onClose: () => void;
}

export function ReportReviewModal({
  visible,
  token,
  review,
  onClose,
}: ReportReviewModalProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const resolveError = useTrustError();
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [evidenceUncertain, setEvidenceUncertain] = useState(false);

  useEffect(() => {
    if (visible) {
      setMotivo('');
      setError(null);
      setReportId(null);
      setUncertain(false);
      setEvidenceUncertain(false);
    }
  }, [visible, review?.id]);

  const close = () => {
    if (loading) {
      return;
    }
    if (evidenceUncertain) {
      Alert.alert(
        'Carga de evidencia incierta',
        'La carga anterior pudo haberse guardado. Si cierras, solo se descarta la copia local; no se elimina ninguna evidencia que ya se haya guardado y no podrás reintentar esta carga desde esta pantalla.',
        [
          { text: 'Conservar archivo', style: 'cancel' },
          {
            text: 'Cerrar de todos modos',
            style: 'destructive',
            onPress: () => {
              setEvidenceUncertain(false);
              onClose();
            },
          },
        ]
      );
      return;
    }
    onClose();
  };

  const submit = async () => {
    if (!review || loading || reportId) {
      return;
    }
    const reason = motivo.trim();
    if (!reason) {
      setError('Escribe el motivo del reporte.');
      return;
    }
    setLoading(true);
    setError(null);
    setUncertain(false);
    try {
      const created = await trustGateway.reportarResena(token, review.id, reason);
      setReportId(created.reporteId);
    } catch (submitError) {
      const message = resolveError(submitError, 'No fue posible registrar el reporte.');
      if (!message) {
        return;
      }
      if (isUncertainTrustError(submitError)) {
        setUncertain(true);
        setError(
          'No se pudo confirmar si el reporte se creó. No se enviará automáticamente. Reintentar con el mismo motivo puede recuperar un reporte ya abierto.'
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
      presentationStyle="overFullScreen"
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.overlay, { paddingTop: insets.top + spacing.md }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar reporte"
            onPress={close}
            style={StyleSheet.absoluteFill}
          />
          <View
            accessibilityViewIsModal
            style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}
          >
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>Reportar reseña</Text>
                <Text style={styles.subtitle}>
                  El reporte se crea primero. Después puedes adjuntar evidencia opcional.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar reporte"
                onPress={close}
                style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}
              >
                <Ionicons name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {review ? (
                <View style={styles.reviewBox}>
                  <Text style={styles.reviewLabel}>Reseña</Text>
                  <Text style={styles.reviewText} numberOfLines={3}>
                    {review.texto}
                  </Text>
                </View>
              ) : null}

              {reportId ? (
                <>
                  <InlineMessage
                    variant="success"
                    message="Reporte registrado. La reseña sigue visible mientras moderación la revisa."
                  />
                  <ReportEvidenceSection
                    token={token}
                    reportId={reportId}
                    onUncertainChange={setEvidenceUncertain}
                  />
                  <PrimaryButton label="Cerrar" variant="secondary" onPress={close} />
                </>
              ) : (
                <>
                  <TextInput
                    value={motivo}
                    onChangeText={setMotivo}
                    placeholder="Motivo del reporte"
                    placeholderTextColor="#94A3B8"
                    multiline
                    textAlignVertical="top"
                    style={styles.input}
                    editable={!loading}
                  />
                  <Text style={styles.hint}>
                    El motivo es obligatorio. Cuando el reporte esté confirmado, podrás adjuntar
                    evidencia sin volver a crearlo.
                  </Text>
                  {error ? <InlineMessage message={error} /> : null}
                  {uncertain ? (
                    <Text style={styles.hint}>
                      Podrás adjuntar evidencia cuando el reporte esté confirmado.
                    </Text>
                  ) : null}
                  <PrimaryButton
                    label={uncertain ? 'Reintentar reporte' : 'Enviar reporte'}
                    loading={loading}
                    disabled={!motivo.trim()}
                    onPress={() => {
                      void submit();
                    }}
                  />
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    paddingHorizontal: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    maxHeight: '92%',
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  headerText: { flex: 1, gap: 2 },
  title: { color: colors.text, fontSize: 18, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  pressed: { backgroundColor: colors.background },
  content: { gap: spacing.md, paddingTop: spacing.md },
  reviewBox: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  reviewLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  reviewText: { color: colors.text, fontSize: 13, lineHeight: 19 },
  input: {
    minHeight: 104,
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
