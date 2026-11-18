import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { serviceGateway } from '../services/service-gateway-instance';
import type { ServiceNotification } from '../types/service';
import { useServiceError } from './useServiceError';

export function useServiceNotifications() {
  const { session } = useAuthSession();
  const resolveError = useServiceError();
  const [notifications, setNotifications] = useState<ServiceNotification[]>([]);
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
      setNotifications(await serviceGateway.listServiceNotifications(session.token));
    } catch (loadError) {
      const message = resolveError(loadError, 'No fue posible cargar los avisos de servicio.');
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
