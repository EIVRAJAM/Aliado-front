import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { requestGateway } from '../services/request-gateway-instance';
import type { RequestCatalogs, ServiceRequest } from '../types/request';
import { useRequestError } from './useRequestError';

export function useMyRequests() {
  const { session } = useAuthSession();
  const resolveError = useRequestError();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [catalogs, setCatalogs] = useState<RequestCatalogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [nextRequests, nextCatalogs] = await Promise.all([
        requestGateway.listMine(session.token),
        requestGateway.getCatalogs(session.token),
      ]);
      setRequests(nextRequests);
      setCatalogs(nextCatalogs);
    } catch (loadError) {
      const message = resolveError(
        loadError,
        'No fue posible cargar tus solicitudes. Intenta de nuevo.'
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

  return {
    requests,
    catalogs,
    loading,
    error,
    reload: load,
  };
}
