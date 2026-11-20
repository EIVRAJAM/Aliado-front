import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { trustGateway } from '../services/trust-gateway-instance';
import {
  isVerificationMissing,
  type VerificationRequest,
} from '../types/trust';
import { useTrustError } from './useTrustError';

export function useMyVerification() {
  const { session } = useAuthSession();
  const resolveError = useTrustError();
  const [verification, setVerification] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  const load = useCallback(async () => {
    if (!session || session.role !== 'PRESTADOR') {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setMissing(false);
    try {
      const current = await trustGateway.getMiVerificacion(session.token);
      setVerification(current);
    } catch (loadError) {
      if (isVerificationMissing(loadError)) {
        setVerification(null);
        setMissing(true);
      } else {
        const message = resolveError(
          loadError,
          'No fue posible consultar tu estado de verificación.'
        );
        if (message) {
          setError(message);
        }
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

  return { verification, loading, error, missing, reload: load };
}
