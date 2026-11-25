import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { professionalProfileGateway } from '../services/professional-profile-gateway-instance';
import {
  ProfessionalProfileError,
  isProfileMissing,
  type AgendaCommitment,
} from '../types/professional-profile';
import { getProfessionalProfileErrorMessage } from '../utils/professional-profile-error-message';

export function useProviderAgenda() {
  const { session, clearSession } = useAuthSession();
  const [agenda, setAgenda] = useState<AgendaCommitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  const load = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setMissing(false);
    try {
      setAgenda(await professionalProfileGateway.getAgenda(session.token));
    } catch (loadError) {
      if (
        loadError instanceof ProfessionalProfileError &&
        loadError.code === 'SESSION_EXPIRED'
      ) {
        Alert.alert('Sesión expirada', 'Inicia sesión de nuevo.');
        clearSession();
        return;
      }
      if (isProfileMissing(loadError)) {
        setAgenda([]);
        setMissing(true);
        return;
      }
      setError(
        getProfessionalProfileErrorMessage(
          loadError,
          'No fue posible cargar la agenda.'
        )
      );
    } finally {
      setLoading(false);
    }
  }, [clearSession, session]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return { agenda, loading, error, missing, reload: load };
}
