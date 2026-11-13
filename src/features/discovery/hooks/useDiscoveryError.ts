import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useAuthSession } from '../../auth';
import { DiscoveryError } from '../types/discovery';
import { getDiscoveryErrorMessage } from '../utils/discovery-error-message';

export function useDiscoveryError() {
  const { clearSession } = useAuthSession();

  return useCallback(
    (error: unknown, fallback: string): string | null => {
      if (error instanceof DiscoveryError && error.code === 'SESSION_EXPIRED') {
        Alert.alert('Sesión expirada', 'Inicia sesión de nuevo.');
        clearSession();
        return null;
      }
      return getDiscoveryErrorMessage(error, fallback);
    },
    [clearSession]
  );
}
