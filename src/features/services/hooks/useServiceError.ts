import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useAuthSession } from '../../auth';
import { ServiceError } from '../types/service';
import { getServiceErrorMessage } from '../utils/service-error-message';

export function useServiceError() {
  const { clearSession } = useAuthSession();

  return useCallback(
    (error: unknown, fallback: string): string | null => {
      if (error instanceof ServiceError && error.code === 'SESSION_EXPIRED') {
        Alert.alert('Sesión expirada', 'Inicia sesión de nuevo.');
        clearSession();
        return null;
      }
      return getServiceErrorMessage(error, fallback);
    },
    [clearSession]
  );
}
