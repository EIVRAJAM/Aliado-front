import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useAuthSession } from '../../auth';
import { OpportunityError } from '../types/opportunity';
import { getOpportunityErrorMessage } from '../utils/opportunity-error-message';

export function useOpportunitiesError() {
  const { clearSession } = useAuthSession();

  return useCallback(
    (error: unknown, fallback: string): string | null => {
      if (error instanceof OpportunityError && error.code === 'SESSION_EXPIRED') {
        Alert.alert('Sesión expirada', 'Inicia sesión de nuevo.');
        clearSession();
        return null;
      }
      return getOpportunityErrorMessage(error, fallback);
    },
    [clearSession]
  );
}
