import { ServiceError } from '../types/service';

export function getServiceErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ServiceError)) {
    return fallback;
  }
  switch (error.code) {
    case 'CONFIGURATION':
      return 'La conexión con ALIADO no está configurada en este entorno.';
    case 'NETWORK':
      return 'No se pudo conectar con ALIADO. Revisa tu conexión e intenta de nuevo.';
    case 'VALIDATION':
    case 'CONFLICT':
    case 'NOT_FOUND':
    case 'FORBIDDEN':
    case 'INVALID_RESPONSE':
      return error.message;
    case 'SESSION_EXPIRED':
      return 'Tu sesión expiró. Inicia sesión de nuevo.';
    case 'UNKNOWN':
    default:
      return fallback;
  }
}
