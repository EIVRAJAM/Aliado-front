import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { professionalProfileGateway } from '../services/professional-profile-gateway-instance';
import {
  ProfessionalProfileError,
  isProfileMissing,
  type AgendaCommitment,
  type ProfessionalPreview,
} from '../types/professional-profile';
import { getProfessionalProfileErrorMessage } from '../utils/professional-profile-error-message';

export function useProfessionalProfileOverview() {
  const { session, clearSession } = useAuthSession();
  const [preview, setPreview] = useState<ProfessionalPreview | null>(null);
  const [agenda, setAgenda] = useState<AgendaCommitment[]>([]);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [agendaLoading, setAgendaLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [agendaError, setAgendaError] = useState<string | null>(null);
  const [previewMissing, setPreviewMissing] = useState(false);
  const [agendaMissing, setAgendaMissing] = useState(false);

  const load = useCallback(async () => {
    if (!session) {
      setPreviewLoading(false);
      setAgendaLoading(false);
      return;
    }

    setPreviewLoading(true);
    setAgendaLoading(true);
    setPreviewError(null);
    setAgendaError(null);
    setPreviewMissing(false);
    setAgendaMissing(false);

    const [previewResult, agendaResult] = await Promise.allSettled([
      professionalProfileGateway.getPreview(session.token),
      professionalProfileGateway.getAgenda(session.token),
    ]);

    const sessionExpired = [previewResult, agendaResult].some(
      (result) =>
        result.status === 'rejected' &&
        result.reason instanceof ProfessionalProfileError &&
        result.reason.code === 'SESSION_EXPIRED'
    );
    if (sessionExpired) {
      Alert.alert('Sesión expirada', 'Inicia sesión de nuevo.');
      clearSession();
      return;
    }

    if (previewResult.status === 'fulfilled') {
      setPreview(previewResult.value);
    } else if (isProfileMissing(previewResult.reason)) {
      setPreview(null);
      setPreviewMissing(true);
    } else {
      setPreviewError(
        getProfessionalProfileErrorMessage(
          previewResult.reason,
          'No fue posible cargar la vista previa del perfil.'
        )
      );
    }

    if (agendaResult.status === 'fulfilled') {
      setAgenda(agendaResult.value);
    } else if (isProfileMissing(agendaResult.reason)) {
      setAgenda([]);
      setAgendaMissing(true);
    } else {
      setAgendaError(
        getProfessionalProfileErrorMessage(
          agendaResult.reason,
          'No fue posible cargar la agenda.'
        )
      );
    }

    setPreviewLoading(false);
    setAgendaLoading(false);
  }, [clearSession, session]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return {
    preview,
    agenda,
    previewLoading,
    agendaLoading,
    previewError,
    agendaError,
    previewMissing,
    agendaMissing,
    reload: load,
  };
}
