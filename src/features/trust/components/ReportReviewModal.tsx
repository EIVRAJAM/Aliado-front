import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useTrustError } from '../hooks/useTrustError';
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
  const insets = useSafeAreaInsets();
  const resolveError = useTrustError();
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (visible) {
      setMotivo('');
      setError(null);
      setSuccess(false);
    }
  }, [visible, review?.id]);

  const close = () => {
    if (!loading) {
      onClose();
    }
  };

  const submit = async () => {
    if (!review || loading || success) {
      return;
    }
    const reason = motivo.trim();
    if (!reason) {
      setError('Escribe el motivo del reporte.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await trustGateway.reportarResena(token, review.id, reason);
      setSuccess(true);
    } catch (submitError) {
      const message = resolveError(submitError, 'No fue posible registrar el reporte.');
      if (message) {
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
                  El reporte será revisado por moderación. No se adjuntan comprobantes en este contrato.
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

            {review ? (
              <View style={styles.reviewBox}>
                <Text style={styles.reviewLabel}>Reseña</Text>
                <Text style={styles.reviewText} numberOfLines={3}>
                  {review.texto}
                </Text>
              </View>
            ) : null}

            {success ? (
              <>
                <InlineMessage
                  variant="success"
                  message="Reporte registrado. La reseña sigue visible mientras moderación la revisa."
                />
                <PrimaryButton label="Cerrar" onPress={close} />
              </>
            ) : (
              <>
                <TextInput
                  value={motivo}
                  onChangeText={setMotivo}
                  placeholder="Motivo del reporte"
                  placeholderTextColor={colors.disabled}
                  multiline
                  textAlignVertical="top"
                  style={styles.input}
                  editable={!loading}
                />
                <Text style={styles.hint}>
                  El contrato actual solo recibe el motivo. No se ofrece adjuntar comprobantes porque
                  no está disponible en el flujo móvil confirmado.
                </Text>
                {error ? <InlineMessage message={error} /> : null}
                <PrimaryButton
                  label="Enviar reporte"
                  loading={loading}
                  onPress={() => {
                    void submit();
                  }}
                />
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    gap: spacing.md,
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
