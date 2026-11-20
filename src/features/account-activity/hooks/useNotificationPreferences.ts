import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { accountActivityGateway } from '../services/account-activity-gateway-instance';
import type {
  NotificationChannel,
  NotificationPreference,
  NotificationPreferenceType,
} from '../types/account-activity';
import { useAccountActivityError } from './useAccountActivityError';

export function useNotificationPreferences() {
  const { session } = useAuthSession();
  const resolveError = useAccountActivityError();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setMutationError(null);
    try {
      setPreferences(await accountActivityGateway.getPreferences(session.token));
    } catch (loadError) {
      const message = resolveError(
        loadError,
        'No fue posible cargar tus preferencias de notificación.'
      );
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

  const updatePreference = useCallback(
    async (
      tipoAviso: NotificationPreferenceType,
      canal: NotificationChannel,
      habilitada: boolean
    ) => {
      if (!session || savingKey) {
        return;
      }
      const key = `${tipoAviso}:${canal}`;
      const current = preferences.find(
        (preference) => preference.tipoAviso === tipoAviso && preference.canal === canal
      );
      if (!current || !current.configurable) {
        return;
      }

      const previous = preferences;
      setMutationError(null);
      setSavingKey(key);
      setPreferences((items) =>
        items.map((preference) =>
          preference.tipoAviso === tipoAviso && preference.canal === canal
            ? { ...preference, habilitada }
            : preference
        )
      );

      try {
        const updated = await accountActivityGateway.updatePreference(session.token, {
          tipoAviso,
          canal,
          habilitada,
        });
        setPreferences((items) =>
          items.map((preference) =>
            preference.tipoAviso === tipoAviso && preference.canal === canal
              ? updated
              : preference
          )
        );
      } catch (updateError) {
        setPreferences(previous);
        const message = resolveError(updateError, 'No fue posible actualizar la preferencia.');
        if (message) {
          setMutationError(message);
        }
      } finally {
        setSavingKey(null);
      }
    },
    [preferences, resolveError, savingKey, session]
  );

  return {
    preferences,
    loading,
    error,
    mutationError,
    savingKey,
    reload: load,
    updatePreference,
  };
}
