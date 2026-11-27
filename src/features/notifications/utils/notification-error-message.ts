import { NotificationError } from '../types/notification';

export function getNotificationErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof NotificationError)) {
    return fallback;
  }
  switch (error.code) {
    case 'CONFIGURATION':
      return 'No podemos conectar con ALIADO en este momento. Intenta de nuevo más tarde.';
    case 'NETWORK':
      return 'No se pudo conectar con ALIADO. Revisa tu conexión e intenta de nuevo.';
    case 'FORBIDDEN':
      return error.message;
    case 'SESSION_EXPIRED':
      return 'Tu sesión expiró. Inicia sesión de nuevo.';
    case 'INVALID_RESPONSE':
    case 'UNKNOWN':
    default:
      return fallback;
  }
}
