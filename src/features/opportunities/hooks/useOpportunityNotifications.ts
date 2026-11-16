import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { opportunitiesGateway } from '../services/opportunities-gateway-instance';
import type { OpportunityNotification } from '../types/opportunity';
import { useOpportunitiesError } from './useOpportunitiesError';

export function useOpportunityNotifications() {
  const { session } = useAuthSession();
  const resolveError = useOpportunitiesError();
  const [notifications, setNotifications] = useState<OpportunityNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (!session || session.role !== 'PRESTADOR') {
      setLoading(false);
      return;
    }

    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const nextNotifications = await opportunitiesGateway.listNotifications(session.token);
      if (currentRequest === requestId.current) {
        setNotifications(nextNotifications);
      }
    } catch (loadError) {
      if (currentRequest !== requestId.current) {
        return;
      }
      setNotifications([]);
      const message = resolveError(
        loadError,
        'No fue posible cargar los avisos de oportunidades.'
      );
      if (message) {
        setError(message);
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }, [resolveError, session]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return { notifications, loading, error, reload: load };
}
