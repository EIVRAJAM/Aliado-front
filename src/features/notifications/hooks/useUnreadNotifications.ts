import { useCallback, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { notificationGateway } from '../services/notification-gateway-instance';
import { useNotificationError } from './useNotificationError';

export function useUnreadNotifications() {
  const token = useAuthSession().session?.token;
  const resolveError = useNotificationError();
  const [summary, setSummary] = useState<{ token: string; hasUnread: boolean }>();

  useFocusEffect(useCallback(() => {
    if (!token) return;
    let active = true;
    let pending = false;
    const refresh = async () => {
      if (pending) return;
      pending = true;
      try {
        const hasUnread = await notificationGateway.hasUnread(token);
        if (active) setSummary({ token, hasUnread });
      } catch (error) {
        if (active) resolveError(error, 'No fue posible actualizar la campana.');
      } finally {
        pending = false;
      }
    };

    void refresh();
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') void refresh();
    }, 20_000);
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => {
      active = false;
      clearInterval(interval);
      appState.remove();
    };
  }, [resolveError, token]));

  return Boolean(summary && summary.token === token && summary.hasUnread);
}
