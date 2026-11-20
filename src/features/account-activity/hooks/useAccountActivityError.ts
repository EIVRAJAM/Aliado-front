import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useAuthSession } from '../../auth';
import { AccountActivityError } from '../types/account-activity';

export function useAccountActivityError() {
  const { clearSession } = useAuthSession();

  return useCallback(
    (error: unknown, fallback: string): string | null => {
      if (error instanceof AccountActivityError && error.code === 'SESSION_EXPIRED') {
        Alert.alert('Sesión expirada', 'Inicia sesión de nuevo.');
        clearSession();
        return null;
      }
      if (error instanceof AccountActivityError) {
        return error.message || fallback;
      }
      return fallback;
    },
    [clearSession]
  );
}
