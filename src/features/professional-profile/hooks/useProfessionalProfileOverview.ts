import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { professionalProfileGateway } from '../services/professional-profile-gateway-instance';
import {
  ProfessionalProfileError,
  isProfileMissing,
  type OwnProfessionalProfile,
  type ProfessionalPreview,
} from '../types/professional-profile';
import { getProfessionalProfileErrorMessage } from '../utils/professional-profile-error-message';

export function useProfessionalProfileOverview() {
  const { session, clearSession } = useAuthSession();
  const [profile, setProfile] = useState<OwnProfessionalProfile | null>(null);
  const [preview, setPreview] = useState<ProfessionalPreview | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [profileMissing, setProfileMissing] = useState(false);
  const [previewMissing, setPreviewMissing] = useState(false);

  const load = useCallback(async () => {
    if (!session) {
      setProfileLoading(false);
      setPreviewLoading(false);
      return;
    }

    setProfileLoading(true);
    setPreviewLoading(true);
    setProfileError(null);
    setPreviewError(null);
    setProfileMissing(false);
    setPreviewMissing(false);

    const [profileResult, previewResult] = await Promise.allSettled([
      professionalProfileGateway.getOwnProfile(session.token),
      professionalProfileGateway.getPreview(session.token),
    ]);

    const sessionExpired = [profileResult, previewResult].some(
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

    setProfileLoading(false);
    setPreviewLoading(false);
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
    previewLoading,
    previewError,
    previewMissing,
    saveDescription,
    reload: load,
  };
}
