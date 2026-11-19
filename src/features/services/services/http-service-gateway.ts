import { ApiError, requestJson } from '../../../shared/api/http-client';
import {
  ServiceError,
  isServiceState,
  type ContractedService,
  type ServiceCatalogs,
  type ServiceHistoryEntry,
  type ServiceMessage,
  type ServiceTransitionAction,
  type ServiceTransitionResponse,
} from '../types/service';
import type { ServiceGateway } from './service-gateway';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requiredString(value: unknown): string {
  if (typeof value !== 'string' || !value) {
    throw new ServiceError('INVALID_RESPONSE', 'La respuesta del servidor no tiene el formato esperado.');
  }
  return value;
}

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new ServiceError('INVALID_RESPONSE', 'La respuesta del servidor no tiene el formato esperado.');
  }
  return value;
}

function parseDetail(value: unknown): ContractedService {
  if (!isRecord(value) || !isServiceState(value.estado)) {
    throw new ServiceError('INVALID_RESPONSE', 'La respuesta del servidor no tiene el formato esperado.');
  }
  const solicitud = value.solicitud;
  const propuesta = value.propuesta;
  if (!isRecord(solicitud) || !isRecord(propuesta)) {
    throw new ServiceError('INVALID_RESPONSE', 'La respuesta del servidor no tiene el formato esperado.');
  }
  if (propuesta.estado !== 'ACEPTADA') {
    throw new ServiceError('INVALID_RESPONSE', 'La respuesta del servidor no tiene el formato esperado.');
  }
  return {
    id: requiredString(value.id),
    solicitudId: requiredString(value.solicitudId),
    propuestaId: requiredString(value.propuestaId),
    clienteId: requiredString(value.clienteId),
    prestadorId: requiredString(value.prestadorId),
    estado: value.estado,
    comunicacionHabilitada: value.comunicacionHabilitada === true,
    fechaContratacion: requiredString(value.fechaContratacion),
    solicitud: {
      id: requiredString(solicitud.id),
      descripcion: nullableString(solicitud.descripcion),
      categoriaId: nullableString(solicitud.categoriaId),
      zonaId: nullableString(solicitud.zonaId),
      urgencia: nullableString(solicitud.urgencia),
      estado: requiredString(solicitud.estado),
    },
    propuesta: {
      id: requiredString(propuesta.id),
      prestadorId: requiredString(propuesta.prestadorId),
      disponibilidad: requiredString(propuesta.disponibilidad),
      mensaje: nullableString(propuesta.mensaje),
      estado: propuesta.estado,
      fechaCreacion: requiredString(propuesta.fechaCreacion),
    },
  };
}

function parseHistory(value: unknown): ServiceHistoryEntry[] {
  if (!Array.isArray(value)) {
    throw new ServiceError('INVALID_RESPONSE', 'La respuesta del servidor no tiene el formato esperado.');
  }
  return value.map((item) => {
    if (!isRecord(item) || !isServiceState(item.estadoNuevo)) {
      throw new ServiceError('INVALID_RESPONSE', 'La respuesta del servidor no tiene el formato esperado.');
    }
    return {
      estadoAnterior:
        item.estadoAnterior === null
          ? null
          : isServiceState(item.estadoAnterior)
            ? item.estadoAnterior
            : null,
      estadoNuevo: item.estadoNuevo,
      actorId: requiredString(item.actorId),
      fecha: requiredString(item.fecha),
    };
  });
}

function parseMessage(value: unknown): ServiceMessage {
  if (!isRecord(value)) {
    throw new ServiceError('INVALID_RESPONSE', 'La respuesta del servidor no tiene el formato esperado.');
  }
  return {
    id: requiredString(value.id),
    remitenteId: requiredString(value.remitenteId),
    contenido: requiredString(value.contenido),
    fechaEnvio: requiredString(value.fechaEnvio),
  };
}

function parseMessages(value: unknown): ServiceMessage[] {
  if (!Array.isArray(value)) {
    throw new ServiceError('INVALID_RESPONSE', 'La respuesta del servidor no tiene el formato esperado.');
  }
  return value.map(parseMessage);
}

function parseTransition(value: unknown, expectedId: string): ServiceTransitionResponse {
  if (!isRecord(value) || !isServiceState(value.estado) || requiredString(value.id) !== expectedId) {
    throw new ServiceError('INVALID_RESPONSE', 'La respuesta no corresponde al servicio solicitado.');
  }
  return { id: expectedId, estado: value.estado };
}

function parseCatalogs(categories: unknown, zones: unknown): ServiceCatalogs {
  if (!Array.isArray(categories) || !Array.isArray(zones)) {
    throw new ServiceError('INVALID_RESPONSE', 'La respuesta del servidor no tiene el formato esperado.');
  }
  return {
    categories: categories.map((item) => {
      if (!isRecord(item)) {
        throw new ServiceError('INVALID_RESPONSE', 'La respuesta del servidor no tiene el formato esperado.');
      }
      return { id: requiredString(item.id), nombre: requiredString(item.nombre) };
    }),
    zones: zones.map((item) => {
      if (!isRecord(item)) {
        throw new ServiceError('INVALID_RESPONSE', 'La respuesta del servidor no tiene el formato esperado.');
      }
      return { id: requiredString(item.id), nombre: requiredString(item.nombre) };
    }),
  };
}

function getServerCode(body: unknown): string | undefined {
  return isRecord(body) && typeof body.code === 'string' ? body.code : undefined;
}

function getServerMessage(body: unknown): string | undefined {
  return isRecord(body) && typeof body.message === 'string' && body.message.trim()
    ? body.message
    : undefined;
}

function conflictMessage(code: string | undefined): string {
  switch (code) {
    case 'TRANSICION_INVALIDA':
      return 'El servicio cambió de estado. Actualiza la pantalla antes de intentar de nuevo.';
    case 'SERVICIO_YA_CONTRATADO':
      return 'La solicitud ya tiene un servicio contratado.';
    case 'COMUNICACION_NO_HABILITADA':
      return 'El canal de comunicación no está habilitado para este servicio.';
    case 'CONFLICTO_CONCURRENCIA':
      return 'El servicio cambió por otra operación. Actualiza antes de intentar de nuevo.';
    default:
      return 'La operación no se pudo completar porque el servicio cambió de estado.';
  }
}

function mapApiError(error: unknown, fallback: string): ServiceError {
  if (error instanceof ServiceError) {
    return error;
  }
  if (error instanceof ApiError) {
    const code = getServerCode(error.body);
    const message = getServerMessage(error.body);
    if (error.status === 401) {
      return new ServiceError('SESSION_EXPIRED', 'Tu sesión expiró. Inicia sesión de nuevo.', 401, code);
    }
    if (error.status === 403) {
      return new ServiceError('FORBIDDEN', 'No tienes permiso para realizar esta operación.', 403, code);
    }
    if (error.status === 404) {
      return new ServiceError('NOT_FOUND', 'El servicio no está disponible.', 404, code);
    }
    if (error.status === 409) {
      return new ServiceError('CONFLICT', conflictMessage(code), 409, code);
    }
    if (error.status === 400) {
      return new ServiceError(
        'VALIDATION',
        message ?? 'Revisa el mensaje e intenta de nuevo.',
        400,
        code
      );
    }
    return new ServiceError('UNKNOWN', fallback, error.status, code);
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return new ServiceError('NETWORK', 'La solicitud tardó demasiado. Intenta de nuevo.');
  }
  return new ServiceError(
    'NETWORK',
    'No se pudo conectar con ALIADO. Revisa tu conexión e intenta de nuevo.'
  );
}

export class HttpServiceGateway implements ServiceGateway {
  private readonly baseUrl?: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl;
  }

  private requireBaseUrl(): string {
    if (!this.baseUrl) {
      throw new ServiceError('CONFIGURATION', 'La URL de la API no está configurada en este entorno.');
    }
    return this.baseUrl;
  }

  async getDetail(token: string, serviceId: string): Promise<ContractedService> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        `/api/v1/servicios/${encodeURIComponent(serviceId)}`,
        { method: 'GET', token }
      );
      return parseDetail(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar el servicio.');
    }
  }

  async getHistory(token: string, serviceId: string): Promise<ServiceHistoryEntry[]> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        `/api/v1/servicios/${encodeURIComponent(serviceId)}/historial`,
        { method: 'GET', token }
      );
      return parseHistory(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar el historial del servicio.');
    }
  }

  async getMessages(token: string, serviceId: string): Promise<ServiceMessage[]> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        `/api/v1/servicios/${encodeURIComponent(serviceId)}/mensajes`,
        { method: 'GET', token }
      );
      return parseMessages(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar los mensajes del servicio.');
    }
  }

  async sendMessage(
    token: string,
    serviceId: string,
    contenido: string
  ): Promise<ServiceMessage> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        `/api/v1/servicios/${encodeURIComponent(serviceId)}/mensajes`,
        { method: 'POST', token, body: { contenido } }
      );
      return parseMessage(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible enviar el mensaje.');
    }
  }

  async transition(
    token: string,
    serviceId: string,
    action: ServiceTransitionAction
  ): Promise<ServiceTransitionResponse> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        `/api/v1/servicios/${encodeURIComponent(serviceId)}/${action}`,
        { method: 'POST', token }
      );
      return parseTransition(response, serviceId);
    } catch (error) {
      throw mapApiError(error, 'No fue posible actualizar el estado del servicio.');
    }
  }

  async getCatalogs(token: string): Promise<ServiceCatalogs> {
    try {
      const [categories, zones] = await Promise.all([
        requestJson<unknown>(this.requireBaseUrl(), '/api/v1/catalogo/categorias', { method: 'GET', token }),
        requestJson<unknown>(this.requireBaseUrl(), '/api/v1/catalogo/zonas', { method: 'GET', token }),
      ]);
      return parseCatalogs(categories, zones);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar las categorías y zonas.');
    }
  }

}
