import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { professionalProfileGateway } from '../services/professional-profile-gateway-instance';
import {
  ProfessionalProfileError,
  isProfileMissing,
  type AgendaCommitment,
  type OwnProfessionalProfile,
  type ProfessionalPreview,
} from '../types/professional-profile';
import { getProfessionalProfileErrorMessage } from '../utils/professional-profile-error-message';

export function useProfessionalProfileOverview() {
  const { session, clearSession } = useAuthSession();
  const [profile, setProfile] = useState<OwnProfessionalProfile | null>(null);
  const [preview, setPreview] = useState<ProfessionalPreview | null>(null);
  const [agenda, setAgenda] = useState<AgendaCommitment[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [agendaLoading, setAgendaLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [agendaError, setAgendaError] = useState<string | null>(null);
  const [profileMissing, setProfileMissing] = useState(false);
  const [previewMissing, setPreviewMissing] = useState(false);
  const [agendaMissing, setAgendaMissing] = useState(false);

  const load = useCallback(async () => {
    if (!session) {
      setProfileLoading(false);
      setPreviewLoading(false);
      setAgendaLoading(false);
      return;
    }

    setProfileLoading(true);
    setPreviewLoading(true);
    setAgendaLoading(true);
    setProfileError(null);
    setPreviewError(null);
    setAgendaError(null);
    setProfileMissing(false);
    setPreviewMissing(false);
    setAgendaMissing(false);

    const [profileResult, previewResult, agendaResult] = await Promise.allSettled([
      professionalProfileGateway.getOwnProfile(session.token),
      professionalProfileGateway.getPreview(session.token),
      professionalProfileGateway.getAgenda(session.token),
    ]);

    const sessionExpired = [profileResult, previewResult, agendaResult].some(
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

    if (profileResult.status === 'fulfilled') {
      setProfile(profileResult.value);
    } else if (isProfileMissing(profileResult.reason)) {
      setProfile(null);
      setProfileMissing(true);
    } else {
      setProfileError(
        getProfessionalProfileErrorMessage(
          profileResult.reason,
          'No fue posible cargar tu perfil profesional.'
        )
      );
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

    setProfileLoading(false);
    setPreviewLoading(false);
    setAgendaLoading(false);
  }, [clearSession, session]);

  const saveDescription = useCallback(
    async (descripcion: string | null) => {
      if (!session) {
        throw new ProfessionalProfileError(
          'SESSION_EXPIRED',
          'Tu sesión expiró. Inicia sesión de nuevo.'
        );
      }
      const actualizado = await professionalProfileGateway.updateDescription(
        session.token,
        descripcion
      );
      setProfile(actualizado);
      setPreview((actual) =>
        actual
          ? {
              ...actual,
              datosGenerales: {
                ...actual.datosGenerales,
                descripcion: actualizado.descripcion,
              },
            }
          : actual
      );
      return actualizado;
    },
    [session]
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return {
    profile,
    profileLoading,
    profileError,
    profileMissing,
    preview,
    agenda,
    previewLoading,
    agendaLoading,
    previewError,
    agendaError,
    previewMissing,
    agendaMissing,
    saveDescription,
    reload: load,
  };
}
