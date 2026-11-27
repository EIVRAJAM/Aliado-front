export const DEFAULT_TERMS_VERSION = 'aliado-academico-mvp-v1';

function readPublicEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export const appEnv = {
  apiBaseUrl: readPublicEnv(process.env.EXPO_PUBLIC_API_BASE_URL),
  termsVersion: readPublicEnv(process.env.EXPO_PUBLIC_TERMS_VERSION) ?? DEFAULT_TERMS_VERSION,
};
