import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { discoveryGateway } from '../services/discovery-gateway-instance';
import { isProviderNotFound, type PublicProvider } from '../types/discovery';
import { useDiscoveryError } from './useDiscoveryError';

export function useProviderProfile(providerId: string) {
  const { session } = useAuthSession();
  const resolveError = useDiscoveryError();
  const [provider, setProvider] = useState<PublicProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || session.role !== 'CLIENTE') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      setProvider(await discoveryGateway.getProvider(session.token, providerId));
    } catch (loadError) {
      if (isProviderNotFound(loadError)) {
        setProvider(null);
        setNotFound(true);
        return;
      }
      const message = resolveError(loadError, 'No fue posible cargar el perfil público.');
      if (message) {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [providerId, resolveError, session]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return { provider, loading, notFound, error, reload: load };
}
