import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { requestGateway } from '../services/request-gateway-instance';
import type { ServiceRequest } from '../types/request';
import { useRequestError } from './useRequestError';

export function useRequestDetail(requestId?: string) {
  const { session } = useAuthSession();
  const resolveError = useRequestError();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(Boolean(requestId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || !requestId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const nextRequest = await requestGateway.getMine(session.token, requestId);
      setRequest(nextRequest);
    } catch (loadError) {
      const message = resolveError(
        loadError,
        'No fue posible cargar la solicitud. Intenta de nuevo.'
      );
      if (message) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [requestId, resolveError, session]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return {
    request,
    loading,
    error,
    reload: load,
  };
}
