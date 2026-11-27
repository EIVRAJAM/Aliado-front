import { useEffect, useRef, useState } from 'react';
import { Alert, AppState, Platform } from 'react-native';

import { useAuthSession } from '../../auth';
import { isPushEnabled, isUuid, resolveOpportunityNotice } from '../services/push-gateway';

export const androidPushEnabled = Platform.OS === 'android' && isPushEnabled();

function noticeId(data: Record<string, unknown> | undefined): string | undefined {
  if (data?.tipo === 'NUEVA_OPORTUNIDAD' && isUuid(data.notificacionId) && isUuid(data.solicitudId)) {
    return data.notificacionId;
  }
}

export function useAndroidPush(navigationReady: boolean, openOpportunity: (id: string) => void) {
  const { session, isSigningOut } = useAuthSession();
  const [pending, setPending] = useState<{ id: string; account?: string }>();
  const handled = useRef(new Set<string>());
  const currentSession = useRef(session);
  currentSession.current = session;

  useEffect(() => {
    if (!androidPushEnabled) return;
    let alive = true;
    let remove: (() => void) | undefined;
    void import('expo-notifications').then((native) => {
      if (!alive) return;
      native.setNotificationHandler({
        handleNotification: async (notification) => {
          const show = !!noticeId(notification.request.content.data)
            && currentSession.current?.role === 'PRESTADOR';
          return { shouldShowBanner: show, shouldShowList: show, shouldPlaySound: show, shouldSetBadge: false };
        },
      });
      const onResponse = (response: import('expo-notifications').NotificationResponse) => {
        const id = noticeId(response.notification.request.content.data);
        if (!id || handled.current.has(id)) return;
        handled.current.add(id);
        if (handled.current.size > 64) {
          const oldest = handled.current.values().next().value;
          if (oldest) handled.current.delete(oldest);
        }
        setPending({ id, account: currentSession.current?.email });
        void native.clearLastNotificationResponseAsync().catch(() => undefined);
      };
      const listener = native.addNotificationResponseReceivedListener(onResponse);
      remove = () => listener.remove();
      const initial = native.getLastNotificationResponse();
      if (initial) onResponse(initial);
    }).catch(() => undefined);
    return () => { alive = false; remove?.(); };
  }, []);

  useEffect(() => {
    if (!androidPushEnabled || isSigningOut) return;
    let alive = true;
    let remove: (() => void) | undefined;
    const refresh = () => {
      void import('../services/android-push-device').then(({ refreshAndroidPush }) => (
        refreshAndroidPush(session, () => alive && currentSession.current === session)
      )).catch(() => undefined);
    };
    refresh();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    if (session?.role === 'PRESTADOR') {
      void import('expo-notifications').then((native) => {
        if (!alive) return;
        const tokenListener = native.addPushTokenListener(refresh);
        remove = () => tokenListener.remove();
      }).catch(() => undefined);
    }
    return () => { alive = false; appState.remove(); remove?.(); };
  }, [isSigningOut, session]);

  useEffect(() => {
    if (!pending || !navigationReady || !session || isSigningOut) return;
    if (session.role !== 'PRESTADOR' || (pending.account && pending.account !== session.email)) {
      setPending(undefined);
      return;
    }
    let alive = true;
    void resolveOpportunityNotice(pending.id, session.token).then((result) => {
      if (!alive || currentSession.current !== session) return;
      if (result?.estado === 'ABIERTA') openOpportunity(result.solicitudId);
      else Alert.alert(result ? 'La oportunidad cerró' : 'Oportunidad no disponible');
    }).catch(() => {
      if (alive && currentSession.current === session) {
        Alert.alert('No se pudo abrir el aviso', 'Puedes consultarlo en Notificaciones.');
      }
    }).finally(() => {
      if (alive) setPending((value) => value === pending ? undefined : value);
    });
    return () => { alive = false; };
  }, [isSigningOut, navigationReady, openOpportunity, pending, session]);
}
