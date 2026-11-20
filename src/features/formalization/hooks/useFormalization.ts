import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { formalizationGateway } from '../services/formalization-gateway-instance';
import type {
  FormalizationLinkState,
  FormalizationProgress,
  FormalizationProgressStatus,
  FormalizationRoute,
} from '../types/formalization';
import {
  indexProgressByRoute,
  progressStatusFromError,
} from '../utils/formalization-progress';
import { useFormalizationError } from './useFormalizationError';

export function useFormalization() {
  const { session } = useAuthSession();
  const resolveError = useFormalizationError();
  const [routes, setRoutes] = useState<FormalizationRoute[]>([]);
  const [progress, setProgress] = useState<FormalizationProgress[]>([]);
  const [progressStatus, setProgressStatus] =
    useState<FormalizationProgressStatus>('loaded');
  const [linkStates, setLinkStates] = useState<Record<string, FormalizationLinkState>>({});
  const [loading, setLoading] = useState(true);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session || session.role !== 'PRESTADOR') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setRouteError(null);
    setProgressError(null);
    setProgressStatus('loaded');
    setLinkStates({});

    const [routeResult, progressResult] = await Promise.allSettled([
      formalizationGateway.getRoute(session.token),
      formalizationGateway.getProgress(session.token),
    ]);

    if (routeResult.status === 'fulfilled') {
      setRoutes(routeResult.value);
    } else {
      setRoutes([]);
      const message = resolveError(
        routeResult.reason,
        'No fue posible cargar la ruta de formalización.'
      );
      if (message) {
        setRouteError(message);
      }
    }

    if (progressResult.status === 'fulfilled') {
      setProgress(progressResult.value);
      setProgressStatus('loaded');
    } else {
      setProgress([]);
      const status = progressStatusFromError(progressResult.reason);
      setProgressStatus(status);
      if (status === 'error') {
        const message = resolveError(
          progressResult.reason,
          'No fue posible consultar tu progreso de formalización.'
        );
        if (message) {
          setProgressError(message);
        }
      }
    }

    setLoading(false);
  }, [resolveError, session]);

  const setLinkState = useCallback((linkId: string, state: FormalizationLinkState) => {
    setLinkStates((current) => ({ ...current, [linkId]: state }));
  }, []);

  const progressByRoute = useMemo(() => indexProgressByRoute(progress), [progress]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return {
    routes,
    progressByRoute,
    progressStatus,
    linkStates,
    loading,
    routeError,
    progressError,
    reload: load,
    setLinkState,
  };
}
