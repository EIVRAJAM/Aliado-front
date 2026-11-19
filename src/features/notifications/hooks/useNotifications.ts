import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { notificationGateway } from '../services/notification-gateway-instance';
import type { AppNotification } from '../types/notification';
import { useNotificationError } from './useNotificationError';

export function useNotifications() {
  const { session } = useAuthSession();
  const resolveError = useNotificationError();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setNotifications(await notificationGateway.listMine(session.token));
    } catch (loadError) {
      const message = resolveError(
        loadError,
        'No fue posible cargar las notificaciones.'
      );
      if (message) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [resolveError, session]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return { notifications, loading, error, reload: load };
}
