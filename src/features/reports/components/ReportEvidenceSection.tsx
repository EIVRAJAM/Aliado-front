import { useMemo } from 'react';
import { useAppTheme, type ThemeColors } from '../../../shared/ui/ThemeProvider';
import Ionicons from '@expo/vector-icons/Ionicons';
import { requireOptionalNativeModule } from 'expo';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { InlineMessage } from '../../../shared/ui/InlineMessage';
import { PrimaryButton } from '../../../shared/ui/PrimaryButton';
import { colors, radii, spacing } from '../../../shared/ui/theme';
import { useReportError } from '../hooks/useReportError';
import { reportGateway } from '../services/report-gateway-instance';
import {
  isUncertainReportError,
  type EvidenceDocument,
  type ReportDetail,
} from '../types/report';
import {
  formatEvidenceSize,
  formatReportDate,
  reportStatusLabel,
} from '../utils/report-format';

interface ReportEvidenceSectionProps {
  token: string;
  reportId: string;
  onUncertainChange?: (uncertain: boolean) => void;
}

export function ReportEvidenceSection({
  token,
  reportId,
  onUncertainChange,
}: ReportEvidenceSectionProps) {
  const { colors } = useAppTheme();
  const styles = useStyles();
  const resolveError = useReportError();
  const [detail, setDetail] = useState<ReportDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [document, setDocument] = useState<EvidenceDocument | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [uncertainBaselineIds, setUncertainBaselineIds] = useState<string[] | null>(null);
  const [reconciling, setReconciling] = useState(false);

  const loadDetail = useCallback(async () => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      setDetail(await reportGateway.getMyReport(token, reportId));
    } catch (error) {
      const message = resolveError(error, 'No fue posible consultar el estado del reporte.');
      if (message) {
        setDetailError(message);
      }
    } finally {
      setDetailLoading(false);
    }
  }, [reportId, resolveError, token]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    onUncertainChange?.(uncertain);
  }, [onUncertainChange, uncertain]);

  const refreshUncertainState = useCallback(
    async (baselineIds: string[] | null) => {
      setReconciling(true);
      try {
        const refreshed = await reportGateway.getMyReport(token, reportId);
        setDetail(refreshed);
        setDetailError(null);
        setUncertain(true);
        setSuccess(null);
        if (baselineIds) {
          const known = new Set(baselineIds);
          const added = refreshed.evidencias.filter((item) => !known.has(item.id));
          if (added.length > 0) {
            setUploadError(
              'El reporte muestra una evidencia nueva, pero no pudimos confirmar que corresponda a este archivo. El archivo se conserva y el resultado sigue pendiente.'
            );
          } else {
            setUploadError(
              'Todavía no vemos la evidencia en el reporte. El intento anterior pudo haberse guardado; revisa el estado antes de reintentar. El archivo se conserva.'
            );
          }
        } else {
          setUploadError(
            'No pudimos comparar con el estado anterior del reporte. Revisa el estado antes de reintentar; el archivo se conserva y el intento anterior pudo haberse guardado.'
          );
        }
      } catch (reconcileError) {
        resolveError(reconcileError, 'No fue posible consultar el estado del reporte.');
        setUncertain(true);
        setUploadError(
          'Resultado incierto: no pudimos confirmar si la evidencia se guardó. Tampoco pudimos consultar el estado. El archivo seleccionado se conserva.'
        );
      } finally {
        setReconciling(false);
      }
    },
    [reportId, resolveError, token]
  );

  const pickDocument = async () => {
    if (uploading) {
      return;
    }
    setUploadError(null);
    setSuccess(null);
    try {
      if (!requireOptionalNativeModule('ExpoDocumentPicker')) {
        setUploadError(
          'La selección de documentos no está disponible en esta versión de la app. Intenta de nuevo más tarde.'
        );
        return;
      }
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (result.canceled) {
        return;
      }
      const asset = result.assets[0];
      if (!asset) {
        return;
      }
      setDocument({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType ?? 'application/octet-stream',
        size: asset.size,
      });
    } catch {
      setUploadError('No fue posible abrir el selector de documentos.');
    }
  };

  const upload = async () => {
    if (!document || uploading) {
      return;
    }
    const baselineIds = detail
      ? detail.evidencias.map((evidence) => evidence.id)
      : null;
    setUploading(true);
    setUploadError(null);
    setSuccess(null);
    setUncertain(false);
    setUncertainBaselineIds(null);
    try {
      await reportGateway.uploadEvidence(token, reportId, document);
      setDocument(null);
      setUncertain(false);
      setUncertainBaselineIds(null);
      setUploadError(null);
      setSuccess('Evidencia adjuntada al reporte.');
      await loadDetail();
    } catch (error) {
      const message = resolveError(error, 'No fue posible adjuntar la evidencia.');
      if (!message) {
        return;
      }
      if (isUncertainReportError(error)) {
        setUncertain(true);
        setUncertainBaselineIds(baselineIds);
        setUploadError(
          'Resultado incierto: es posible que la evidencia se haya guardado aunque no recibimos confirmación. No se reenviará automáticamente. El archivo seleccionado se conserva.'
        );
        await refreshUncertainState(baselineIds);
      } else {
        setUncertain(false);
        setUncertainBaselineIds(null);
        setUploadError(message);
      }
    } finally {
      setUploading(false);
    }
  };

  const confirmUncertainRetry = () => {
    Alert.alert(
      'Reintento con resultado incierto',
      'El intento anterior pudo haberse guardado. Reintentar podría adjuntar una evidencia duplicada. ¿Quieres continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reintentar de todos modos',
          style: 'destructive',
          onPress: () => {
            void upload();
          },
        },
      ]
    );
  };

  const discardLocalDocument = (pickAnother: boolean) => {
    setUncertain(false);
    setUncertainBaselineIds(null);
    setDocument(null);
    setUploadError(null);
    setSuccess(null);
    if (pickAnother) {
      void pickDocument();
    }
  };

  const confirmAbandonDocument = (pickAnother: boolean) => {
    Alert.alert(
      'Carga anterior incierta',
      'La carga anterior pudo haberse guardado. Si descartas este archivo, solo eliminas la copia local; no se elimina ninguna evidencia que ya se haya guardado. Tampoco podrás reintentar esta carga desde esta pantalla.',
      [
        { text: 'Conservar archivo', style: 'cancel' },
        {
          text: 'Descartar copia local',
          style: 'destructive',
          onPress: () => discardLocalDocument(pickAnother),
        },
      ]
    );
  };

  const requestPickDocument = () => {
    if (uploading || reconciling) {
      return;
    }
    if (uncertain) {
      confirmAbandonDocument(true);
      return;
    }
    void pickDocument();
  };

  const requestRemoveDocument = () => {
    if (uploading || reconciling) {
      return;
    }
    if (uncertain) {
      confirmAbandonDocument(false);
      return;
    }
    setDocument(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Ionicons name="attach-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Evidencia del reporte</Text>
          <Text style={styles.subtitle}>
            El reporte ya fue creado. Adjuntar evidencia no vuelve a enviar el reporte.
          </Text>
        </View>
      </View>

      <View style={styles.referenceBox}>
        <Text style={styles.referenceLabel}>Referencia del reporte</Text>
        <Text selectable style={styles.referenceValue}>
          {reportId}
        </Text>
      </View>

      {detailLoading ? (
        <Text style={styles.hint}>Consultando estado del reporte…</Text>
      ) : detailError ? (
        <>
          <InlineMessage message={detailError} />
          <PrimaryButton
            label="Reintentar estado"
            variant="secondary"
            onPress={() => {
              void loadDetail();
            }}
          />
        </>
      ) : detail ? (
        <View style={styles.statusBox}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Estado</Text>
            <Text style={styles.statusValue}>{reportStatusLabel(detail.estado)}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Fecha</Text>
            <Text style={styles.statusValue}>{formatReportDate(detail.fechaCreacion)}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Evidencias</Text>
            <Text style={styles.statusValue}>{detail.evidencias.length}</Text>
          </View>
          {detail.evidencias.length > 0 ? (
            <View style={styles.evidenceList}>
              {detail.evidencias.map((evidence, index) => (
                <View key={evidence.id} style={styles.evidenceRow}>
                  <Ionicons name="document-outline" size={14} color={colors.primary} />
                  <Text style={styles.evidenceText}>Evidencia {index + 1}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.hint}>
        La evidencia es opcional. La app no fija tipos, tamaños ni cantidad; si el archivo no es
        aceptado, verás un error.
      </Text>

      <PrimaryButton
        label={uncertain ? 'Elegir otro archivo' : 'Seleccionar archivo'}
        variant="secondary"
        disabled={uploading || reconciling}
        onPress={requestPickDocument}
      />

      {document ? (
        <View style={styles.documentRow}>
          <Ionicons name="document-outline" size={16} color={colors.primary} />
          <View style={styles.documentText}>
            <Text style={styles.documentName} numberOfLines={1}>
              {document.name}
            </Text>
            {formatEvidenceSize(document.size) ? (
              <Text style={styles.documentMeta}>{formatEvidenceSize(document.size)}</Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Quitar ${document.name}`}
            hitSlop={6}
            disabled={uploading || reconciling}
            onPress={requestRemoveDocument}
            style={({ pressed }) => [styles.removeButton, pressed ? styles.pressed : null]}
          >
            <Ionicons name="close" size={18} color={colors.muted} />
          </Pressable>
        </View>
      ) : null}

      {uncertain ? (
        <InlineMessage
          variant="error"
          message="Resultado incierto: no se puede garantizar que la evidencia no se haya guardado. El archivo se conserva."
        />
      ) : null}
      {uploadError ? <InlineMessage message={uploadError} /> : null}
      {success ? <InlineMessage variant="success" message={success} /> : null}

      {uncertain ? (
        <PrimaryButton
          label="Consultar estado"
          variant="secondary"
          loading={reconciling}
          disabled={uploading || reconciling}
          onPress={() => {
            void refreshUncertainState(uncertainBaselineIds);
          }}
        />
      ) : null}

      <PrimaryButton
        label={uncertain ? 'Reintentar de todos modos' : 'Adjuntar evidencia'}
        loading={uploading}
        disabled={!document || reconciling}
        onPress={() => {
          if (uncertain) {
            confirmUncertainRetry();
          } else {
            void upload();
          }
        }}
      />
    </View>
  );
}

const useStyles = () => {
  const { colors } = useAppTheme();
  return useMemo(() => createStyles(colors), [colors]);
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.infoSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 2 },
  title: { color: colors.text, fontSize: 15, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  referenceBox: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: 2,
  },
  referenceLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  referenceValue: { color: colors.text, fontSize: 11, lineHeight: 16 },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  statusBox: {
    backgroundColor: colors.infoSurface,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  statusLabel: { color: colors.muted, fontSize: 12 },
  statusValue: { color: colors.text, fontSize: 12, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  evidenceList: { gap: spacing.xs, paddingTop: spacing.xs },
  evidenceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  evidenceText: { color: colors.muted, fontSize: 12, flexShrink: 1 },
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
