import { AuthError } from '../types/auth';

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof AuthError)) {
    return fallback;
  }

  switch (error.code) {
    case 'CONFIGURATION':
      return 'No podemos conectar con ALIADO en este momento. Intenta de nuevo más tarde.';
    case 'NETWORK':
      return 'No se pudo conectar con ALIADO. Revisa tu conexión e intenta de nuevo.';
    case 'EMAIL_TAKEN':
      return 'Este correo ya está registrado. Inicia sesión o recupera tu acceso.';
    case 'INVALID_CREDENTIALS':
      return 'Correo o contraseña incorrectos.';
    case 'ACCOUNT_BLOCKED':
      return 'La cuenta está bloqueada preventivamente. Contacta al equipo de soporte de ALIADO.';
    case 'ACCOUNT_DELETED':
      return 'Esta cuenta fue eliminada y no puede recuperarse.';
    case 'ADMIN_PORTAL_REQUIRED':
      return 'Usa el panel web de ALIADO para cuentas administrativas.';
    case 'SESSION_EXPIRED':
      return 'Tu sesión expiró. Inicia sesión de nuevo.';
    case 'RECOVERY_TOKEN_INVALID':
      return 'El código no es válido, ya fue usado o expiró. Solicita uno nuevo.';
    case 'VALIDATION':
      return 'Revisa los datos ingresados e intenta de nuevo.';
    case 'UNKNOWN':
      return fallback;
    default:
      return fallback;
  }
}
