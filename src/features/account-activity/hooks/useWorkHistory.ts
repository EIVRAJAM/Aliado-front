import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { accountActivityGateway } from '../services/account-activity-gateway-instance';
import type { WorkHistoryItem } from '../types/account-activity';
import { useAccountActivityError } from './useAccountActivityError';

export const WORK_HISTORY_PAGE_SIZE = 20;

function mergeHistory(current: WorkHistoryItem[], next: WorkHistoryItem[]): WorkHistoryItem[] {
  const seen = new Set(current.map((item) => item.id));
  return [...current, ...next.filter((item) => !seen.has(item.id))];
}

export function useWorkHistory() {
  const { session } = useAuthSession();
  const resolveError = useAccountActivityError();
  const [items, setItems] = useState<WorkHistoryItem[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setMoreError(null);
    setHasMore(false);
    setPage(0);
    try {
      const firstPage = await accountActivityGateway.getHistory(
        session.token,
        0,
        WORK_HISTORY_PAGE_SIZE
      );
      setItems(firstPage);
      setHasMore(firstPage.length === WORK_HISTORY_PAGE_SIZE);
    } catch (loadError) {
      setItems([]);
      const message = resolveError(loadError, 'No fue posible cargar el historial de trabajos.');
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

  const loadMore = useCallback(async () => {
    if (!session || loading || loadingMore || !hasMore) {
      return;
    }
    const nextPage = page + 1;
    setLoadingMore(true);
    setMoreError(null);
    try {
      const next = await accountActivityGateway.getHistory(
        session.token,
        nextPage,
        WORK_HISTORY_PAGE_SIZE
      );
      setItems((current) => mergeHistory(current, next));
      setPage(nextPage);
      setHasMore(next.length === WORK_HISTORY_PAGE_SIZE);
    } catch (loadError) {
      const message = resolveError(loadError, 'No fue posible cargar más historial.');
      if (message) {
        setMoreError(message);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loading, loadingMore, page, resolveError, session]);

  return {
    items,
    loading,
    loadingMore,
    error,
    moreError,
    hasMore,
    reload: load,
    loadMore,
  };
}
