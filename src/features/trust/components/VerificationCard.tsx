import Ionicons from '@expo/vector-icons/Ionicons';
import { requireOptionalNativeModule } from 'expo';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../shared/ui/Card';
import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useAuthSession } from '../../auth';
import { useMyVerification } from '../hooks/useMyVerification';
import { useTrustError } from '../hooks/useTrustError';
import { trustGateway } from '../services/trust-gateway-instance';
import {
  isTrustConflict,
  type VerificationDocument,
  type VerificationRequest,
} from '../types/trust';
import {
  formatFileSize,
  verificationStatusLabel,
} from '../utils/trust-format';

function statusTone(status: VerificationRequest['estado']) {
  switch (status) {
    case 'PENDIENTE':
      return { icon: 'time-outline' as const, color: colors.warning, surface: colors.warningSurface };
    case 'APROBADA':
      return { icon: 'shield-checkmark-outline' as const, color: colors.success, surface: colors.successSurface };
    case 'RECHAZADA':
      return { icon: 'close-circle-outline' as const, color: colors.danger, surface: colors.dangerSurface };
  }
}

export function VerificationCard() {
  const { session } = useAuthSession();
  const resolveError = useTrustError();
  const { verification, loading, error, missing, reload } = useMyVerification();
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!session || session.role !== 'PRESTADOR') {
    return null;
  }

  const canRequest = missing || verification?.estado === 'RECHAZADA';

  const pickDocuments = async () => {
    if (submitting) {
      return;
    }
    setActionError(null);
    setSuccess(null);
    try {
      if (!requireOptionalNativeModule('ExpoDocumentPicker')) {
        setActionError(
          'El selector de documentos no está incluido en este development build. Reconstruye la app para habilitarlo.'
        );
        return;
      }
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) {
        return;
      }
      const selected: VerificationDocument[] = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType ?? 'application/octet-stream',
        size: asset.size,
      }));
      setDocuments((current) => {
        const seen = new Set(current.map((item) => `${item.uri}:${item.name}`));
        return [
          ...current,
          ...selected.filter((item) => {
            const key = `${item.uri}:${item.name}`;
            if (seen.has(key)) {
              return false;
            }
            seen.add(key);
            return true;
          }),
        ];
      });
    } catch {
      setActionError(
        'No fue posible abrir el selector de documentos. Si usas un development build, puede requerir reconstrucción para incluir el módulo nativo.'
      );
    }
  };

  const submit = async () => {
    if (submitting || documents.length === 0) {
      if (documents.length === 0) {
        setActionError('Selecciona al menos un documento.');
      }
      return;
    }
    setSubmitting(true);
    setActionError(null);
    setSuccess(null);
    try {
      const request = await trustGateway.solicitarVerificacion(session.token, documents);
      setDocuments([]);
      setSuccess(
        request.estado === 'PENDIENTE'
          ? 'Solicitud enviada. Los documentos quedaron en revisión.'
          : 'Solicitud de verificación enviada.'
      );
      await reload();
    } catch (submitError) {
      const message = resolveError(
        submitError,
        'No fue posible enviar la solicitud de verificación.'
      );
      if (message) {
        setActionError(message);
      }
      if (isTrustConflict(submitError)) {
        await reload();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.teal} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Verificación de identidad</Text>
          <Text style={styles.subtitle}>
            La revisión de documentos es privada. La verificación básica no es una certificación legal.
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Consultando tu verificación…</Text>
        </View>
      ) : error ? (
        <>
          <InlineMessage message={error} />
          <PrimaryButton label="Reintentar" variant="secondary" onPress={() => void reload()} />
        </>
      ) : (
        <>
          {verification ? (
            <View
              style={[
                styles.statusBox,
                { backgroundColor: statusTone(verification.estado).surface },
              ]}
            >
              <Ionicons
                name={statusTone(verification.estado).icon}
                size={20}
                color={statusTone(verification.estado).color}
              />
              <View style={styles.statusText}>
                <Text style={[styles.statusTitle, { color: statusTone(verification.estado).color }]}>
                  {verificationStatusLabel(verification.estado)}
                </Text>
                <Text style={styles.statusHint}>
                  {verification.estado === 'PENDIENTE'
                    ? 'No puedes enviar otra solicitud mientras esta siga en revisión.'
                    : verification.estado === 'APROBADA'
                      ? 'Alcanzaste el nivel máximo disponible. No se admite otra solicitud.'
                      : 'La solicitud anterior no fue aprobada. Puedes enviar una nueva.'}
                </Text>
              </View>
            </View>
          ) : (
            <InlineMessage
              variant="info"
              message="No tienes una solicitud de verificación. Puedes enviar documentos para solicitar la verificación básica."
            />
          )}

          {canRequest ? (
            <View style={styles.form}>
              <Text style={styles.label}>Documentos</Text>
              <Text style={styles.hint}>
                El contrato actual no fija tipos, tamaños ni cantidad en la app. El servidor validará
                cada archivo y responderá si no es aceptado.
              </Text>
              <PrimaryButton
                label="Seleccionar documentos"
                variant="secondary"
                disabled={submitting}
                onPress={() => {
                  void pickDocuments();
                }}
              />
              {documents.length > 0 ? (
                <View style={styles.documentList}>
                  {documents.map((document, index) => {
                    const size = formatFileSize(document.size);
                    return (
                      <View key={`${document.uri}:${index}`} style={styles.documentRow}>
                        <Ionicons name="document-outline" size={16} color={colors.primary} />
                        <View style={styles.documentText}>
                          <Text style={styles.documentName} numberOfLines={1}>
                            {document.name}
                          </Text>
                          {size ? <Text style={styles.documentMeta}>{size}</Text> : null}
                        </View>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Quitar ${document.name}`}
                          hitSlop={6}
                          disabled={submitting}
                          onPress={() =>
                            setDocuments((current) =>
                              current.filter((_, itemIndex) => itemIndex !== index)
                            )
                          }
                          style={({ pressed }) => [
                            styles.removeButton,
                            pressed ? styles.pressed : null,
                          ]}
                        >
                          <Ionicons name="close" size={18} color={colors.muted} />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              ) : null}
              {actionError ? <InlineMessage message={actionError} /> : null}
              {success ? <InlineMessage variant="success" message={success} /> : null}
              <PrimaryButton
                label="Enviar solicitud"
                loading={submitting}
                disabled={documents.length === 0}
                onPress={() => {
                  void submit();
                }}
              />
            </View>
          ) : (
            <>
              {actionError ? <InlineMessage message={actionError} /> : null}
              {success ? <InlineMessage variant="success" message={success} /> : null}
            </>
          )}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.tealSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 2 },
  title: { color: colors.text, fontSize: 16, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  loadingText: { color: colors.muted, fontSize: 13 },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  statusText: { flex: 1, gap: 3 },
  statusTitle: { fontSize: 13, fontWeight: '800' },
  statusHint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  form: { gap: spacing.sm },
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  documentList: { gap: spacing.sm },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  documentText: { flex: 1, gap: 1 },
  documentName: { color: colors.text, fontSize: 13, fontWeight: '600' },
  documentMeta: { color: colors.muted, fontSize: 11 },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  pressed: { backgroundColor: colors.background },
});
