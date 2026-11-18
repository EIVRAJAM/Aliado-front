import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { serviceGateway } from '../services/service-gateway-instance';
import type {
  ContractedService,
  ServiceCatalogs,
  ServiceHistoryEntry,
  ServiceMessage,
} from '../types/service';
import { useServiceError } from './useServiceError';

const EMPTY_CATALOGS: ServiceCatalogs = { categories: [], zones: [] };

export function useServiceDetail(serviceId: string) {
  const { session } = useAuthSession();
  const resolveError = useServiceError();
  const [service, setService] = useState<ContractedService | null>(null);
  const [history, setHistory] = useState<ServiceHistoryEntry[]>([]);
  const [messages, setMessages] = useState<ServiceMessage[]>([]);
  const [catalogs, setCatalogs] = useState<ServiceCatalogs>(EMPTY_CATALOGS);
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
      const detail = await serviceGateway.getDetail(session.token, serviceId);
      const [nextHistory, nextCatalogs, nextMessages] = await Promise.all([
        serviceGateway.getHistory(session.token, serviceId),
        serviceGateway.getCatalogs(session.token),
        detail.comunicacionHabilitada
          ? serviceGateway.getMessages(session.token, serviceId)
          : Promise.resolve([]),
      ]);
      setService(detail);
      setHistory(nextHistory);
      setCatalogs(nextCatalogs);
      setMessages(nextMessages);
    } catch (loadError) {
      const message = resolveError(loadError, 'No fue posible cargar el servicio.');
      if (message) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [resolveError, serviceId, session]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return {
    service,
    history,
    messages,
    catalogs,
    loading,
    error,
    setMessages,
    reload: load,
  };
}
