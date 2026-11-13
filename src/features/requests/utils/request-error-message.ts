import { RequestError } from '../types/request';

export function isUncertainRequestError(error: unknown): boolean {
  return (
    error instanceof RequestError &&
    (error.code === 'NETWORK' ||
      error.code === 'UNKNOWN' ||
      (error.status !== undefined && error.status >= 500))
  );
}

export function getRequestErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof RequestError)) {
    return fallback;
  }

  switch (error.code) {
    case 'CONFIGURATION':
      return 'La conexión con ALIADO no está configurada en este entorno.';
    case 'NETWORK':
      return 'No se pudo conectar con ALIADO. Revisa tu conexión e intenta de nuevo.';
    case 'VALIDATION':
      return error.message;
    case 'CONFLICT':
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
