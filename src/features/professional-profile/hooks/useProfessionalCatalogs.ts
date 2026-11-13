import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { useAuthSession } from '../../auth';
import { professionalProfileGateway } from '../services/professional-profile-gateway-instance';
import {
  ProfessionalProfileError,
  type ProfessionalCatalogs,
} from '../types/professional-profile';
import { getProfessionalProfileErrorMessage } from '../utils/professional-profile-error-message';

export function useProfessionalCatalogs() {
  const { session, clearSession } = useAuthSession();
  const [catalogs, setCatalogs] = useState<ProfessionalCatalogs | null>(null);
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
      setCatalogs(await professionalProfileGateway.getCatalogs(session.token));
    } catch (loadError) {
      if (
        loadError instanceof ProfessionalProfileError &&
        loadError.code === 'SESSION_EXPIRED'
      ) {
        Alert.alert('Sesión expirada', 'Inicia sesión de nuevo.');
        clearSession();
        return;
      }
      setError(
        getProfessionalProfileErrorMessage(
          loadError,
          'No fue posible cargar las categorías y zonas.'
        )
      );
    } finally {
      setLoading(false);
    }
  }, [clearSession, session]);

  useEffect(() => {
    void load();
  }, [load]);

  return { catalogs, loading, error, reload: load };
}
