import { createNavigationContainerRef, type LinkingOptions } from '@react-navigation/native';

import type { RootStackParamList } from './types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROVIDER_PATH_PATTERN = /^aliado:\/\/+prestadores\/([^/?#]+)/i;

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['aliado://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: '',
          Discovery: 'buscar',
          Requests: 'solicitudes',
          ProfessionalProfile: 'perfil-profesional',
          Profile: 'perfil',
        },
      },
      ProviderProfile: 'prestadores/:providerId',
    },
  },
};

export function parseProviderDeepLink(url: string): string | null {
  const match = url.match(PROVIDER_PATH_PATTERN);
  if (!match?.[1] || !UUID_PATTERN.test(match[1])) {
    return null;
  }
  return match[1];
}
