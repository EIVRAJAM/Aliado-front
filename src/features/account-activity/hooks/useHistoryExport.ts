import { useCallback, useState } from 'react';
import { useAuthSession } from '../../auth';
import { accountActivityGateway } from '../services/account-activity-gateway-instance';
import { useAccountActivityError } from './useAccountActivityError';

export function useHistoryExport() {
  const { session } = useAuthSession();
  const resolveError = useAccountActivityError();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const exportHistory = useCallback(async () => {
    if (!session || exporting) {
      return;
    }
    setExporting(true);
    setExportError(null);
    setExportMessage(null);
    try {
      const exportation = await accountActivityGateway.createHistoryExport(session.token);
      if (exportation.estado !== 'LISTA') {
        setExportError(
          `La exportación quedó en estado ${exportation.estado} y no está disponible para descargar.`
        );
        return;
      }
      const content = await accountActivityGateway.downloadHistoryExport(
        session.token,
        exportation.id
      );
      const [{ File, Paths }, Sharing] = await Promise.all([
        import('expo-file-system'),
        import('expo-sharing'),
      ]);
      const file = new File(
        Paths.cache,
        `historial-aliado-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`
      );
      if (file.exists) {
        file.delete();
      }
      file.create();
      await file.write(content);

      if (!(await Sharing.isAvailableAsync())) {
        setExportError('Este dispositivo no permite guardar o compartir archivos.');
        return;
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Guardar o compartir historial',
        UTI: 'public.comma-separated-values-text',
      });
      setExportMessage(
        'Se abrió el menú del sistema para guardar o compartir tu historial. No se modificó el historial original.'
      );
    } catch (error) {
      const message = resolveError(error, 'No fue posible exportar el historial.');
      if (message) {
        setExportError(message);
      }
    } finally {
      setExporting(false);
    }
  }, [exporting, resolveError, session]);

  return {
    exporting,
    exportError,
    exportMessage,
    exportHistory,
  };
}
