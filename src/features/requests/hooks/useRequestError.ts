import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useAuthSession } from '../../auth';
import { RequestError } from '../types/request';
import { getRequestErrorMessage } from '../utils/request-error-message';

export function useRequestError() {
  const { clearSession } = useAuthSession();

  return useCallback(
    (error: unknown, fallback: string): string | null => {
      if (error instanceof RequestError && error.code === 'SESSION_EXPIRED') {
        Alert.alert('Sesión expirada', 'Inicia sesión de nuevo.');
        clearSession();
        return null;
      }
      return getRequestErrorMessage(error, fallback);
    },
    [clearSession]
  );
}
