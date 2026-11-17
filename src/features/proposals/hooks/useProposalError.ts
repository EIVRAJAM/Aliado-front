import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useAuthSession } from '../../auth';
import { ProposalError } from '../types/proposal';
import { getProposalErrorMessage } from '../utils/proposal-error-message';

export function useProposalError() {
  const { clearSession } = useAuthSession();

  return useCallback(
    (error: unknown, fallback: string): string | null => {
      if (error instanceof ProposalError && error.code === 'SESSION_EXPIRED') {
        Alert.alert('Sesión expirada', 'Inicia sesión de nuevo.');
        clearSession();
        return null;
      }
      return getProposalErrorMessage(error, fallback);
    },
    [clearSession]
  );
}
