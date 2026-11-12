import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useAuthSession } from '../../auth';
import { ProfileError } from '../types/profile';
import { getProfileErrorMessage } from '../utils/profile-error-message';

export function useProfileError() {
  const { clearSession } = useAuthSession();

  return useCallback(
    (error: unknown, fallback: string): string | null => {
      if (error instanceof ProfileError && error.code === 'SESSION_EXPIRED') {
        Alert.alert('Sesión expirada', 'Inicia sesión de nuevo.');
        clearSession();
        return null;
      }
      return getProfileErrorMessage(error, fallback);
    },
    [clearSession]
  );
}
