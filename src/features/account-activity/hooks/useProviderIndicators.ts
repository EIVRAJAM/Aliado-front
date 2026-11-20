import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { accountActivityGateway } from '../services/account-activity-gateway-instance';
import type { ProviderIndicators } from '../types/account-activity';
import { useAccountActivityError } from './useAccountActivityError';

export function useProviderIndicators() {
  const { session } = useAuthSession();
  const resolveError = useAccountActivityError();
  const [indicators, setIndicators] = useState<ProviderIndicators | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || session.role !== 'PRESTADOR') {
      setIndicators(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setIndicators(await accountActivityGateway.getProviderIndicators(session.token));
    } catch (loadError) {
      const message = resolveError(loadError, 'No fue posible cargar tus indicadores.');
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

  return { indicators, loading, error, reload: load };
}
