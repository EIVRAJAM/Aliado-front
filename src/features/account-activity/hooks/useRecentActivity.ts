import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { accountActivityGateway } from '../services/account-activity-gateway-instance';
import type { RecentActivityItem } from '../types/account-activity';
import { useAccountActivityError } from './useAccountActivityError';

export function useRecentActivity() {
  const { session } = useAuthSession();
  const resolveError = useAccountActivityError();
  const [items, setItems] = useState<RecentActivityItem[]>([]);
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
      setItems(await accountActivityGateway.getRecentActivity(session.token));
    } catch (loadError) {
      setItems([]);
      const message = resolveError(loadError, 'No fue posible cargar tu actividad reciente.');
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

  return { items, loading, error, reload: load };
}
