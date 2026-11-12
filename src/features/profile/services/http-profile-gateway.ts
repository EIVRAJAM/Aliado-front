import { ApiError, requestJson } from '../../../shared/api/http-client';
import {
  ProfileError,
  isDeletionState,
  isVisibilityPreference,
  type DeletionRequest,
  type PublicProfile,
  type UpdateLocationInput,
  type UpdateProfileInput,
  type UserProfile,
  type VisibilityPreference,
} from '../types/profile';
import type { ProfileGateway } from './profile-gateway';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new ProfileError('UNKNOWN', 'La respuesta del servidor no tiene el formato esperado.');
  }
  return value;
}

function parseProfile(value: unknown): UserProfile {
  if (
    !isRecord(value) ||
    typeof value.usuarioId !== 'string' ||
    !isVisibilityPreference(value.preferenciaVisibilidad) ||
    typeof value.version !== 'number'
  ) {
    throw new ProfileError('UNKNOWN', 'La respuesta del servidor no tiene el formato esperado.');
  }

  return {
    usuarioId: value.usuarioId,
    nombre: nullableString(value.nombre),
    telefono: nullableString(value.telefono),
    preferenciaVisibilidad: value.preferenciaVisibilidad,
    zonaAproximada: nullableString(value.zonaAproximada),
    direccionExacta: nullableString(value.direccionExacta),
    version: value.version,
  };
}

function parsePublicProfile(value: unknown): PublicProfile {
  if (!isRecord(value) || typeof value.usuarioId !== 'string') {
    throw new ProfileError('UNKNOWN', 'La respuesta del servidor no tiene el formato esperado.');
  }
  return {
    usuarioId: value.usuarioId,
    zonaAproximada: nullableString(value.zonaAproximada),
  };
}

function parseDeletion(value: unknown): DeletionRequest {
  if (!isRecord(value) || !isDeletionState(value.estado) || typeof value.expiraEn !== 'string') {
    throw new ProfileError('UNKNOWN', 'La respuesta del servidor no tiene el formato esperado.');
  }
  return {
    estado: value.estado,
    expiraEn: value.expiraEn,
  };
}

function getServerCode(body: unknown): string | undefined {
  if (isRecord(body) && typeof body.code === 'string') {
    return body.code;
  }
  return undefined;
}

function mapApiError(error: unknown, fallbackMessage: string): ProfileError {
  if (error instanceof ProfileError) {
    return error;
  }

  if (error instanceof ApiError) {
    const serverCode = getServerCode(error.body);

    if (error.status === 401) {
      return new ProfileError('SESSION_EXPIRED', 'Tu sesión expiró. Inicia sesión de nuevo.', 401, serverCode);
    }

    if (error.status === 409) {
      const message =
        serverCode === 'CONFLICTO_VERSION'
          ? 'El perfil cambió desde tu última lectura. Vuelve a cargarlo.'
          : serverCode === 'SERVICIO_EN_EJECUCION'
            ? 'Tienes un servicio en ejecución; la eliminación está bloqueada hasta que finalice.'
            : serverCode === 'ELIMINACION_PENDIENTE'
              ? 'Ya tienes una solicitud de eliminación pendiente.'
              : 'No se pudo completar la operación por un conflicto con el estado actual.';
      return new ProfileError('CONFLICT', message, 409, serverCode);
    }

    if (error.status === 404) {
      const message =
        serverCode === 'PERFIL_NO_DISPONIBLE'
          ? 'Tu perfil no está visible públicamente con la privacidad configurada.'
          : serverCode === 'SIN_SOLICITUD_PENDIENTE'
            ? 'No tienes una solicitud de eliminación pendiente.'
            : 'No se encontró la información solicitada.';
      return new ProfileError('NOT_FOUND', message, 404, serverCode);
    }

    if (error.status === 410) {
      return new ProfileError(
        'EXPIRED',
        'La solicitud de eliminación expiró. Genera una nueva solicitud.',
        410,
        serverCode
      );
    }

    if (error.status === 400) {
      return new ProfileError('VALIDATION', 'Revisa los datos ingresados e intenta de nuevo.', 400, serverCode);
    }

    return new ProfileError('UNKNOWN', fallbackMessage, error.status, serverCode);
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return new ProfileError('NETWORK', 'La solicitud tardó demasiado. Intenta de nuevo.');
  }

  return new ProfileError(
    'NETWORK',
    'No se pudo conectar con ALIADO. Revisa tu conexión e intenta de nuevo.'
  );
}

export class HttpProfileGateway implements ProfileGateway {
  private readonly baseUrl?: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl;
  }

  private requireBaseUrl(): string {
    if (!this.baseUrl) {
      throw new ProfileError(
        'CONFIGURATION',
        'La URL de la API no está configurada en este entorno. La integración con ALIADO sigue pendiente.'
      );
    }
    return this.baseUrl;
  }

  async getMyProfile(token: string): Promise<UserProfile> {
    try {
      const response = await requestJson<unknown>(this.requireBaseUrl(), '/api/v1/perfil/me', {
        method: 'GET',
        token,
      });
      return parseProfile(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar tu perfil. Intenta de nuevo.');
    }
  }

  async updateMyProfile(token: string, input: UpdateProfileInput): Promise<UserProfile> {
    const body: Record<string, unknown> = { version: input.version };
    if (input.nombre !== undefined) {
      body.nombre = input.nombre;
    }
    if (input.telefono !== undefined) {
      body.telefono = input.telefono;
    }

    try {
      const response = await requestJson<unknown>(this.requireBaseUrl(), '/api/v1/perfil/me', {
        method: 'PATCH',
        token,
        body,
      });
      return parseProfile(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible actualizar tus datos. Intenta de nuevo.');
    }
  }

  async updateLocation(token: string, input: UpdateLocationInput): Promise<UserProfile> {
    const body: Record<string, unknown> = {
      zonaAproximada: input.zonaAproximada,
    };
    if (input.direccionExacta !== undefined) {
      body.direccionExacta = input.direccionExacta;
    }

    try {
      const response = await requestJson<unknown>(this.requireBaseUrl(), '/api/v1/perfil/me/ubicacion', {
        method: 'PUT',
        token,
        body,
      });
      return parseProfile(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible actualizar tu ubicación. Intenta de nuevo.');
    }
  }

  async updateVisibility(token: string, preference: VisibilityPreference): Promise<UserProfile> {
    try {
      const response = await requestJson<unknown>(this.requireBaseUrl(), '/api/v1/perfil/me/visibilidad', {
        method: 'PATCH',
        token,
        body: {
          preferenciaVisibilidad: preference,
        },
      });
      return parseProfile(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible actualizar tu privacidad. Intenta de nuevo.');
    }
  }

  async getPublicProfile(userId: string): Promise<PublicProfile> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        `/api/v1/perfil/${encodeURIComponent(userId)}/publico`,
        {
          method: 'GET',
        }
      );
      return parsePublicProfile(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar la vista pública del perfil.');
    }
  }

  async requestDeletion(token: string): Promise<DeletionRequest> {
    try {
      const response = await requestJson<unknown>(this.requireBaseUrl(), '/api/v1/perfil/me/eliminacion', {
        method: 'POST',
        token,
      });
      return parseDeletion(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible solicitar la eliminación de la cuenta.');
    }
  }

  async confirmDeletion(token: string): Promise<DeletionRequest> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        '/api/v1/perfil/me/eliminacion/confirmar',
        {
          method: 'POST',
          token,
        }
      );
      return parseDeletion(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible confirmar la eliminación de la cuenta.');
    }
  }
}
