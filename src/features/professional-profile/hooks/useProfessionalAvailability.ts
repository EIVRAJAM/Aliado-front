import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthSession } from '../../auth';
import { professionalProfileGateway } from '../services/professional-profile-gateway-instance';
import { ProfessionalProfileError, isProfileMissing, type AvailabilityBlock, type AvailabilityBlockInput } from '../types/professional-profile';
import { getProfessionalProfileErrorMessage } from '../utils/professional-profile-error-message';

export function useProfessionalAvailability() {
  const { session, clearSession } = useAuthSession();
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setLoading(true); setError(null); setMissing(false); setSaveError(null);
    try {
      setBlocks((await professionalProfileGateway.getOwnProfile(session.token)).disponibilidades);
    } catch (loadError) {
      if (loadError instanceof ProfessionalProfileError && loadError.code === 'SESSION_EXPIRED') { Alert.alert('Sesión expirada', 'Inicia sesión de nuevo.'); clearSession(); return; }
      if (isProfileMissing(loadError)) { setBlocks([]); setMissing(true); return; }
      setError(getProfessionalProfileErrorMessage(loadError, 'No fue posible cargar tu disponibilidad.'));
    } finally { setLoading(false); }
  }, [clearSession, session]);

  const save = useCallback(async (nextBlocks: AvailabilityBlockInput[]) => {
    if (!session) return false;
    setSaving(true); setSaveError(null); setSuccess(null);
    try {
      const profile = await professionalProfileGateway.updateAvailability(session.token, nextBlocks);
      setBlocks(profile.disponibilidades); setSuccess('Disponibilidad guardada correctamente.'); return true;
    } catch (saveFailure) {
      if (saveFailure instanceof ProfessionalProfileError && saveFailure.code === 'SESSION_EXPIRED') { Alert.alert('Sesión expirada', 'Inicia sesión de nuevo.'); clearSession(); return false; }
      setSaveError(getProfessionalProfileErrorMessage(saveFailure, 'No fue posible guardar la disponibilidad.')); return false;
    } finally { setSaving(false); }
  }, [clearSession, session]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  return { blocks, loading, error, missing, saving, saveError, success, reload: load, save };
}
