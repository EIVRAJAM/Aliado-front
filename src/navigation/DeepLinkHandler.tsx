import { useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';

import { useAuthSession } from '../features/auth';
import { navigationRef, parseProviderDeepLink } from './deep-links';

interface DeepLinkHandlerProps {
  navigationReady: boolean;
}

export function DeepLinkHandler({ navigationReady }: DeepLinkHandlerProps) {
  const { session } = useAuthSession();
  const sessionRef = useRef(session);
  const [pendingProviderId, setPendingProviderId] = useState<string | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    const handleUrl = (url: string | null | undefined) => {
      if (!url) {
        return;
      }
      const providerId = parseProviderDeepLink(url);
      if (!providerId) {
        return;
      }
      if (!sessionRef.current) {
        setPendingProviderId(providerId);
      }
    };

    void Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', (event) => handleUrl(event.url));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!pendingProviderId || !session || !navigationReady || !navigationRef.isReady()) {
      return;
    }
    navigationRef.navigate('ProviderProfile', { providerId: pendingProviderId });
    setPendingProviderId(null);
  }, [navigationReady, pendingProviderId, session]);

  return null;
}
