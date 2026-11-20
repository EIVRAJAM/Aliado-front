import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { trustGateway } from '../services/trust-gateway-instance';
import {
  isHistoryUnavailable,
  type ClientRating,
} from '../types/trust';
import { useTrustError } from './useTrustError';

const PAGE_SIZE = 20;

function sortRatings(items: ClientRating[]): ClientRating[] {
  return [...items].sort((left, right) => {
    const leftTime = Date.parse(left.fechaCalificacion);
    const rightTime = Date.parse(right.fechaCalificacion);
    const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
    const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
    return safeRight - safeLeft;
  });
}

function mergeRatings(current: ClientRating[], next: ClientRating[]): ClientRating[] {
  const byId = new Map(current.map((item) => [item.calificacionId, item]));
  next.forEach((item) => byId.set(item.calificacionId, item));
  return sortRatings([...byId.values()]);
}

export function useMyRatings() {
  const { session } = useAuthSession();
  const resolveError = useTrustError();
  const [ratings, setRatings] = useState<ClientRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const loadPage = useCallback(
    async (targetPage: number, append: boolean) => {
      if (!session || session.role !== 'CLIENTE') {
        setLoading(false);
        return;
      }
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      setUnavailable(false);
      try {
        const result = await trustGateway.getMyRatings(
          session.token,
          targetPage,
          PAGE_SIZE
        );
        setRatings((current) =>
          append ? mergeRatings(current, result.items) : sortRatings(result.items)
        );
        setPage(result.pagina);
        setTotalPages(result.totalPaginas);
        setTotalElements(result.totalElementos);
      } catch (loadError) {
        if (isHistoryUnavailable(loadError)) {
          setRatings([]);
          setPage(0);
          setTotalPages(0);
          setTotalElements(0);
          setUnavailable(true);
          return;
        }
        const message = resolveError(
          loadError,
          'No fue posible cargar tus calificaciones y reseñas.'
        );
        if (message) {
          setError(message);
        }
      } finally {
        if (append) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [resolveError, session]
  );

  useFocusEffect(
    useCallback(() => {
      void loadPage(0, false);
    }, [loadPage])
  );

  return {
    ratings,
    loading,
    loadingMore,
    error,
    unavailable,
    totalElements,
    hasMore: page + 1 < totalPages,
    reload: () => loadPage(0, false),
    loadMore: () => loadPage(page + 1, true),
  };
}
