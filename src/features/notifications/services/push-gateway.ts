import { ApiError, requestJson } from '../../../shared/api/http-client';
import { appEnv } from '../../../shared/config/env';

const notifications = '/api/v1/notificaciones';
const devicePath = (id: string) => `${notifications}/dispositivos/${encodeURIComponent(id)}`;

function baseUrl(): string {
  if (!appEnv.apiBaseUrl) {
    throw new Error('Missing API base URL');
  }
  return appEnv.apiBaseUrl;
}

export function isPushEnabled(): boolean {
  return process.env.EXPO_PUBLIC_ANDROID_PUSH_ENABLED === 'true' && !!appEnv.apiBaseUrl;
}

export function syncPushDevice(
  id: string,
  proof: string,
  sessionToken: string,
  binding: { token: string; revocation: string },
) {
  return requestJson<void>(baseUrl(), devicePath(id), {
    method: 'PUT',
    token: sessionToken,
    headers: { 'X-ALIADO-Installation-Proof': proof },
    timeoutMs: 4000,
    body: {
      plataforma: 'ANDROID',
      permisoConcedido: true,
      token: binding.token,
      credencialRevocacion: binding.revocation,
    },
  });
}

export function revokePushDevice(
  id: string,
  revocation: string,
  session?: { token: string; proof: string },
) {
  return requestJson<void>(baseUrl(), session ? devicePath(id) : `${devicePath(id)}/revocacion`, {
    method: session ? 'DELETE' : 'POST',
    token: session?.token,
    timeoutMs: 2500,
    headers: {
      'X-ALIADO-Push-Revocation': revocation,
      ...(session && { 'X-ALIADO-Installation-Proof': session.proof }),
    },
  });
}

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string'
  && /^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i.test(value);

export async function resolveOpportunityNotice(id: string, token: string) {
  try {
    const result = await requestJson<{ solicitudId?: unknown; estado?: unknown }>(
      baseUrl(), `${notifications}/${encodeURIComponent(id)}/oportunidad`, { method: 'GET', token },
    );
    if (!isUuid(result?.solicitudId) || (result.estado !== 'ABIERTA' && result.estado !== 'CERRADA')) {
      throw new Error('Invalid opportunity notice response');
    }
    return { solicitudId: result.solicitudId, estado: result.estado };
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
