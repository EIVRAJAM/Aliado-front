import { ProfileError } from '../types/profile';

export function getProfileErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ProfileError)) {
    return fallback;
  }

  switch (error.code) {
    case 'CONFIGURATION':
      return 'No podemos conectar con ALIADO en este momento. Intenta de nuevo más tarde.';
    case 'NETWORK':
      return 'No se pudo conectar con ALIADO. Revisa tu conexión e intenta de nuevo.';
    case 'VALIDATION':
      return 'Revisa los datos ingresados e intenta de nuevo.';
    case 'CONFLICT':
    case 'NOT_FOUND':
    case 'EXPIRED':
      return error.message;
    case 'UNSUPPORTED':
      return error.message;
    case 'SESSION_EXPIRED':
      return 'Tu sesión expiró. Inicia sesión de nuevo.';
    case 'UNKNOWN':
    default:
      return fallback;
  }
}
