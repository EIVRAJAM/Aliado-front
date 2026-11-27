import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { useAuthSession } from '../../auth';
import { notificationGateway } from '../services/notification-gateway-instance';
import type { NotificationPage, NotificationReadFilter } from '../types/notification';
import { useNotificationError } from './useNotificationError';
import { androidPushEnabled } from './useAndroidPush';

export function useNotifications(filter: NotificationReadFilter) {
  const { session } = useAuthSession();
  const token = session?.token;
  const resolveError = useNotificationError();
  const [page, setPage] = useState<NotificationPage>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const paging = useRef(false);
  const writing = useRef(false);

  const reload = useCallback(async () => {
    if (!token) return;
    const request = ++generation.current;
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    try {
      const result = await notificationGateway.listPage(token, filter);
      if (request === generation.current) setPage(result);
    } catch (loadError) {
      if (request === generation.current) {
        setError(resolveError(loadError, 'No fue posible cargar las notificaciones.'));
      }
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [filter, resolveError, token]);

  const loadMore = async () => {
    const cursor = page?.cursorSiguiente;
    if (!token || !cursor || paging.current || writing.current || loading) return;
    const request = generation.current;
    paging.current = true;
    setLoadingMore(true);
    setError(null);
    try {
      const result = await notificationGateway.listPage(token, filter, cursor);
      if (request === generation.current) {
        setPage((previous) => ({
          items: [...(previous?.items ?? []), ...result.items],
          cursorSiguiente: result.cursorSiguiente,
        }));
      }
    } catch (loadError) {
      if (request === generation.current) {
        setError(resolveError(loadError, 'No fue posible cargar más notificaciones.'));
      }
    } finally {
      paging.current = false;
      if (request === generation.current) setLoadingMore(false);
    }
  };

  const markRead = async (id?: string): Promise<boolean> => {
    if (!token || writing.current) return false;
    writing.current = true;
    setSaving(true);
    setError(null);
    try {
      if (id) await notificationGateway.markAsRead(token, id);
      else await notificationGateway.markAllAsRead(token);
      await reload();
      return true;
    } catch (saveError) {
      setError(resolveError(saveError, 'No fue posible guardar la lectura.'));
      return false;
    } finally {
      writing.current = false;
      setSaving(false);
    }
  };

  useFocusEffect(useCallback(() => {
    setPage(undefined);
    void reload();
    let active = true;
    let remove: (() => void) | undefined;
    if (androidPushEnabled && session?.role === 'PRESTADOR') {
      void import('expo-notifications').then((native) => {
        if (!active) return;
        const listener = native.addNotificationReceivedListener((notice) => {
          if (!writing.current && notice.request.content.data?.tipo === 'NUEVA_OPORTUNIDAD') void reload();
        });
        remove = () => listener.remove();
      }).catch(() => undefined);
    }
    return () => {
      active = false;
      generation.current++;
      remove?.();
    };
  }, [reload, session?.role]));

  return {
    notifications: page?.items ?? [],
    hasMore: Boolean(page?.cursorSiguiente),
    loading, loadingMore, saving, error, reload, loadMore, markRead,
  };
}
