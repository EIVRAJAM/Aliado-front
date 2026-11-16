import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { opportunitiesGateway } from '../services/opportunities-gateway-instance';
import {
  isOpportunityId,
  isOpportunityNotFound,
  type Opportunity,
} from '../types/opportunity';
import { useOpportunitiesError } from './useOpportunitiesError';

export function useOpportunityDetail(solicitudId: string) {
  const { session } = useAuthSession();
  const resolveError = useOpportunitiesError();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (!session || session.role !== 'PRESTADOR') {
      setLoading(false);
      return;
    }

    if (!isOpportunityId(solicitudId)) {
      setOpportunity(null);
      setNotFound(true);
      setError(null);
      setLoading(false);
      return;
    }

    const currentRequest = ++requestId.current;
    setLoading(true);
    setNotFound(false);
    setError(null);
    try {
      const nextOpportunity = await opportunitiesGateway.get(session.token, solicitudId);
      if (currentRequest === requestId.current) {
        setOpportunity(nextOpportunity);
      }
    } catch (loadError) {
      if (currentRequest !== requestId.current) {
        return;
      }
      if (isOpportunityNotFound(loadError)) {
        setOpportunity(null);
        setNotFound(true);
        return;
      }
      setOpportunity(null);
      const message = resolveError(loadError, 'No fue posible cargar la oportunidad.');
      if (message) {
        setError(message);
      }
    } finally {
      if (currentRequest === requestId.current) {
        setLoading(false);
      }
    }
  }, [resolveError, session, solicitudId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return { opportunity, loading, notFound, error, reload: load };
}
