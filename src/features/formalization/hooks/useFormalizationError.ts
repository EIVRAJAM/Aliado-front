import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useAuthSession } from '../../auth';
import { FormalizationError } from '../types/formalization';

export function useFormalizationError() {
  const { clearSession } = useAuthSession();

  return useCallback(
    (error: unknown, fallback: string): string | null => {
      if (error instanceof FormalizationError && error.code === 'SESSION_EXPIRED') {
        Alert.alert('Sesión expirada', 'Inicia sesión de nuevo.');
        clearSession();
        return null;
      }
      if (error instanceof FormalizationError) {
        return error.message || fallback;
      }
      return fallback;
    },
    [clearSession]
  );
}
