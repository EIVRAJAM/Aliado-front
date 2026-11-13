import { DiscoveryError } from '../types/discovery';

export function getDiscoveryErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof DiscoveryError)) {
    return fallback;
  }

  switch (error.code) {
    case 'CONFIGURATION':
      return 'La conexión con ALIADO no está configurada en este entorno.';
    case 'NETWORK':
      return 'No se pudo conectar con ALIADO. Revisa tu conexión e intenta de nuevo.';
    case 'VALIDATION':
    case 'NOT_FOUND':
    case 'FORBIDDEN':
      return error.message;
    case 'SESSION_EXPIRED':
      return 'Tu sesión expiró. Inicia sesión de nuevo.';
    case 'UNKNOWN':
    default:
      return fallback;
  }
}
