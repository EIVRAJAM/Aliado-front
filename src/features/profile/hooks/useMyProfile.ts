import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { profileGateway } from '../services/profile-gateway-instance';
import type { UserProfile } from '../types/profile';
import { useProfileError } from './useProfileError';

export function useMyProfile() {
  const { session } = useAuthSession();
  const resolveError = useProfileError();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const nextProfile = await profileGateway.getMyProfile(session.token);
      setProfile(nextProfile);
    } catch (loadError) {
      const message = resolveError(loadError, 'No fue posible cargar tu perfil. Intenta de nuevo.');
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
    profile,
    loading,
    error,
    reload: load,
  };
}
