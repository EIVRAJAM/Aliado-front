import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useAuthSession } from '../../auth';
import { ReportError } from '../types/report';

export function useReportError() {
  const { clearSession } = useAuthSession();

  return useCallback(
    (error: unknown, fallback: string): string | null => {
      if (error instanceof ReportError && error.code === 'SESSION_EXPIRED') {
        Alert.alert('Sesión expirada', 'Inicia sesión de nuevo.');
        clearSession();
        return null;
      }
      if (error instanceof ReportError) {
        return error.message || fallback;
      }
      return fallback;
    },
    [clearSession]
  );
}
