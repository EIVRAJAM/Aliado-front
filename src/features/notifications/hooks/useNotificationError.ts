import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useAuthSession } from '../../auth';
import { NotificationError } from '../types/notification';
import { getNotificationErrorMessage } from '../utils/notification-error-message';

export function useNotificationError() {
  const { clearSession } = useAuthSession();

  return useCallback(
    (error: unknown, fallback: string): string | null => {
      if (error instanceof NotificationError && error.code === 'SESSION_EXPIRED') {
        Alert.alert('Sesión expirada', 'Inicia sesión de nuevo.');
        clearSession();
        return null;
      }
      return getNotificationErrorMessage(error, fallback);
    },
    [clearSession]
  );
}
