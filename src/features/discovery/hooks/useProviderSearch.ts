import { useCallback, useState } from 'react';

import { useAuthSession } from '../../auth';
import { discoveryGateway } from '../services/discovery-gateway-instance';
import type { ProviderSearchResult } from '../types/discovery';
import { useDiscoveryError } from './useDiscoveryError';

export function useProviderSearch() {
  const { session } = useAuthSession();
  const resolveError = useDiscoveryError();
  const [result, setResult] = useState<ProviderSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const search = useCallback(
    async (categoriaId: string, zonaId: string) => {
      if (!session || loading) {
        return;
      }

      setLoading(true);
      setError(null);
      setSearched(true);
      try {
        setResult(await discoveryGateway.search(session.token, categoriaId, zonaId));
      } catch (searchError) {
        const message = resolveError(searchError, 'No fue posible buscar prestadores.');
        if (message) {
          setError(message);
        }
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [loading, resolveError, session]
  );

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
    setSearched(false);
  }, []);

  return { result, loading, error, searched, search, clear };
}
