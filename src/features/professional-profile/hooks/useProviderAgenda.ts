import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { professionalProfileGateway } from '../services/professional-profile-gateway-instance';
import {
  ProfessionalProfileError,
  isProfileMissing,
  type AgendaCommitment,
  type CommitmentInput,
} from '../types/professional-profile';
import { getProfessionalProfileErrorMessage } from '../utils/professional-profile-error-message';

export function useProviderAgenda() {
  const { session, clearSession } = useAuthSession();
  const [agenda, setAgenda] = useState<AgendaCommitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setMissing(false);
    setMutationError(null);
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

  const clearFeedback = useCallback(() => { setMutationError(null); setSuccess(null); }, []);

  const saveCommitment = useCallback(
    async (input: CommitmentInput, commitmentId?: string) => {
      if (!session) return false;
      setSaving(true); setMutationError(null); setSuccess(null);
      try {
        const saved = commitmentId
          ? await professionalProfileGateway.updateCommitment(session.token, commitmentId, input)
          : await professionalProfileGateway.createCommitment(session.token, input);
        setAgenda((current) => {
          const next = commitmentId ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved];
          return next.sort((a, b) => a.fechaHoraInicio.localeCompare(b.fechaHoraInicio));
        });
        setSuccess(commitmentId ? 'Compromiso actualizado correctamente.' : 'Compromiso creado correctamente.');
        return true;
      } catch (saveError) {
        if (saveError instanceof ProfessionalProfileError && saveError.code === 'SESSION_EXPIRED') { Alert.alert('Sesión expirada', 'Inicia sesión de nuevo.'); clearSession(); return false; }
        setMutationError(getProfessionalProfileErrorMessage(saveError, 'No fue posible guardar el compromiso.'));
        return false;
      } finally { setSaving(false); }
    },
    [clearSession, session]
  );

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  return { agenda, loading, error, missing, saving, mutationError, success, reload: load, saveCommitment, clearFeedback };
}
