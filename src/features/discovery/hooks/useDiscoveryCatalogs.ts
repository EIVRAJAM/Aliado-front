import { useCallback, useEffect, useState } from 'react';

import { useAuthSession } from '../../auth';
import { discoveryGateway } from '../services/discovery-gateway-instance';
import type { DiscoveryCatalogs } from '../types/discovery';
import { useDiscoveryError } from './useDiscoveryError';

export function useDiscoveryCatalogs() {
  const { session } = useAuthSession();
  const resolveError = useDiscoveryError();
  const [catalogs, setCatalogs] = useState<DiscoveryCatalogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || session.role !== 'CLIENTE') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setCatalogs(await discoveryGateway.getCatalogs(session.token));
    } catch (loadError) {
      const message = resolveError(loadError, 'No fue posible cargar las categorías y zonas.');
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

  return { catalogs, loading, error, reload: load };
}
