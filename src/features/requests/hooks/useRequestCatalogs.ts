import { useCallback, useEffect, useState } from 'react';

import { useAuthSession } from '../../auth';
import { requestGateway } from '../services/request-gateway-instance';
import type { RequestCatalogs } from '../types/request';
import { useRequestError } from './useRequestError';

export function useRequestCatalogs() {
  const { session } = useAuthSession();
  const resolveError = useRequestError();
  const [catalogs, setCatalogs] = useState<RequestCatalogs | null>(null);
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
      const nextCatalogs = await requestGateway.getCatalogs(session.token);
      setCatalogs(nextCatalogs);
    } catch (loadError) {
      const message = resolveError(loadError, 'No fue posible cargar el catálogo.');
      if (message) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [resolveError, session]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    catalogs,
    loading,
    error,
    reload: load,
  };
}
