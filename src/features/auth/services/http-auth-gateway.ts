import { ApiError, requestJson } from '../../../shared/api/http-client';
import {
  AuthError,
  isAuthRole,
  type AuthSession,
  type LoginInput,
  type PasswordRecoveryConfirmationInput,
  type PasswordRecoveryInput,
  type RegisterAuthInput,
  type RegistrationResult,
} from '../types/auth';
import type { AuthGateway } from './auth-gateway';

interface RegisterResponse {
  id?: unknown;
  email?: unknown;
  rol?: unknown;
}

interface LoginResponse {
  sessionToken?: unknown;
  rol?: unknown;
}

interface MessageResponse {
  mensaje?: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function mapApiError(error: unknown, fallbackCode: AuthError['code'], fallbackMessage: string): AuthError {
  if (error instanceof AuthError) {
    return error;
  }

  if (error instanceof ApiError) {
    return new AuthError(fallbackCode, fallbackMessage, error.status);
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return new AuthError('NETWORK', 'La solicitud tardó demasiado. Intenta de nuevo.');
  }

  return new AuthError('NETWORK', 'No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.');
}

export class HttpAuthGateway implements AuthGateway {
  private readonly baseUrl?: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl;
  }

  private requireBaseUrl(): string {
    if (!this.baseUrl) {
      throw new AuthError(
        'CONFIGURATION',
        'La URL de la API no está configurada en este entorno. La integración con ALIADO sigue pendiente.'
      );
    }
    return this.baseUrl;
  }

  async register(input: RegisterAuthInput): Promise<RegistrationResult> {
    const baseUrl = this.requireBaseUrl();

    try {
      const response = await requestJson<RegisterResponse>(baseUrl, '/auth/registro', {
        method: 'POST',
        body: {
          email: input.email,
          password: input.password,
          rol: input.role,
          aceptaTerminos: input.acceptsTerms,
          versionTerminos: input.termsVersion,
        },
      });

      if (!isNonEmptyString(response.id) || !isNonEmptyString(response.email) || !isAuthRole(response.rol)) {
        throw new AuthError('UNKNOWN', 'La respuesta del servidor no tiene el formato esperado.');
      }

      return {
        id: response.id,
        email: response.email,
        role: response.rol,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          throw new AuthError(
            'EMAIL_TAKEN',
            'Este correo ya está registrado. Inicia sesión o recupera tu acceso.',
            409
          );
        }
        if (error.status === 400) {
          throw new AuthError('VALIDATION', 'Revisa los datos del formulario e intenta de nuevo.', 400);
        }
      }
      throw mapApiError(error, 'UNKNOWN', 'No fue posible completar el registro. Intenta de nuevo.');
    }
  }

  async login(input: LoginInput): Promise<AuthSession> {
    const baseUrl = this.requireBaseUrl();

    try {
      const response = await requestJson<LoginResponse>(baseUrl, '/auth/login', {
        method: 'POST',
        body: {
          email: input.email,
          password: input.password,
        },
      });

      if (!isNonEmptyString(response.sessionToken) || !isAuthRole(response.rol)) {
        throw new AuthError('UNKNOWN', 'La respuesta del servidor no tiene el formato esperado.');
      }

      return {
        token: response.sessionToken,
        role: response.rol,
        email: input.email,
      };
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw new AuthError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.', 401);
      }
      if (error instanceof ApiError && error.status === 400) {
        throw new AuthError('VALIDATION', 'Revisa los datos del formulario e intenta de nuevo.', 400);
      }
      throw mapApiError(error, 'UNKNOWN', 'No fue posible iniciar sesión. Intenta de nuevo.');
    }
  }

  async logout(token: string): Promise<void> {
    const baseUrl = this.requireBaseUrl();

    try {
      await requestJson<MessageResponse>(baseUrl, '/auth/logout', {
        method: 'POST',
        token,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw new AuthError('SESSION_EXPIRED', 'La sesión ya no es válida.', 401);
      }
      throw mapApiError(error, 'UNKNOWN', 'No fue posible cerrar sesión. Intenta de nuevo.');
    }
  }

  async requestPasswordRecovery(input: PasswordRecoveryInput): Promise<void> {
    const baseUrl = this.requireBaseUrl();

    try {
      await requestJson<MessageResponse>(baseUrl, '/auth/recuperacion', {
        method: 'POST',
        body: {
          email: input.email,
        },
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        throw new AuthError('VALIDATION', 'Revisa el correo ingresado e intenta de nuevo.', 400);
      }
      throw mapApiError(error, 'UNKNOWN', 'No fue posible solicitar la recuperación. Intenta de nuevo.');
    }
  }

  async confirmPasswordRecovery(input: PasswordRecoveryConfirmationInput): Promise<void> {
    const baseUrl = this.requireBaseUrl();

    try {
      await requestJson<MessageResponse>(baseUrl, '/auth/recuperacion/confirmar', {
        method: 'POST',
        body: {
          token: input.token,
          nuevaPassword: input.newPassword,
        },
      });
    } catch (error) {
      if (error instanceof ApiError && (error.status === 400 || error.status === 410)) {
        throw new AuthError(
          'RECOVERY_TOKEN_INVALID',
          'El código no es válido, ya fue usado o expiró. Solicita uno nuevo.',
          error.status
        );
      }
      throw mapApiError(error, 'UNKNOWN', 'No fue posible actualizar la contraseña. Intenta de nuevo.');
    }
  }
}
