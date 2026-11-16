import { ApiError, requestJson } from '../../../shared/api/http-client';
import {
  OpportunityError,
  isOpportunityDeliveryState,
  isOpportunityUrgency,
  type Opportunity,
  type OpportunityCategory,
  type OpportunityFilters,
  type OpportunityNotification,
} from '../types/opportunity';
import type { OpportunitiesGateway } from './opportunities-gateway';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requiredString(value: unknown): string {
  if (typeof value !== 'string' || !value) {
    throw new OpportunityError(
      'UNKNOWN',
      'La respuesta del servidor no tiene el formato esperado.'
    );
  }
  return value;
}

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new OpportunityError(
      'UNKNOWN',
      'La respuesta del servidor no tiene el formato esperado.'
    );
  }
  return value;
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new OpportunityError(
      'UNKNOWN',
      'La respuesta del servidor no tiene el formato esperado.'
    );
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function parseCategory(value: unknown): OpportunityCategory {
  if (!isRecord(value)) {
    throw new OpportunityError(
      'UNKNOWN',
      'La respuesta del servidor no tiene el formato esperado.'
    );
  }
  return {
    id: requiredString(value.id),
    nombre: requiredString(value.nombre),
  };
}

function parseOpportunity(value: unknown): Opportunity {
  if (!isRecord(value)) {
    throw new OpportunityError(
      'UNKNOWN',
      'La respuesta del servidor no tiene el formato esperado.'
    );
  }

  const urgencia = value.urgencia;
  if (urgencia !== null && urgencia !== undefined && !isOpportunityUrgency(urgencia)) {
    throw new OpportunityError(
      'UNKNOWN',
      'La respuesta del servidor no tiene el formato esperado.'
    );
  }

  return {
    solicitudId: requiredString(value.solicitudId),
    categoria: requiredString(value.categoria),
    zonaAproximada: requiredString(value.zonaAproximada),
    urgencia: urgencia === null || urgencia === undefined ? null : urgencia,
    descripcion: nullableString(value.descripcion),
    fechaCreacion: requiredString(value.fechaCreacion),
    fotos: parseStringArray(value.fotos),
  };
}

function parseNotification(value: unknown): OpportunityNotification | null {
  if (!isRecord(value)) {
    throw new OpportunityError(
      'UNKNOWN',
      'La respuesta del servidor no tiene el formato esperado.'
    );
  }

  const tipo = requiredString(value.tipo);
  if (tipo !== 'NUEVA_OPORTUNIDAD') {
    return null;
  }

  if (!isOpportunityDeliveryState(value.estadoEntrega)) {
    throw new OpportunityError(
      'UNKNOWN',
      'La respuesta del servidor no tiene el formato esperado.'
    );
  }

  return {
    id: requiredString(value.id),
    tipo,
    solicitudId: nullableString(value.solicitudId),
    detalle: requiredString(value.detalle),
    estadoEntrega: value.estadoEntrega,
    fechaGeneracion: requiredString(value.fechaGeneracion),
  };
}

function getServerCode(body: unknown): string | undefined {
  if (isRecord(body) && typeof body.code === 'string') {
    return body.code;
  }
  return undefined;
}

function mapApiError(error: unknown, fallback: string): OpportunityError {
  if (error instanceof OpportunityError) {
    return error;
  }

  if (error instanceof ApiError) {
    const serverCode = getServerCode(error.body);
    if (error.status === 401) {
      return new OpportunityError(
        'SESSION_EXPIRED',
        'Tu sesión expiró. Inicia sesión de nuevo.',
        401,
        serverCode
      );
    }
    if (error.status === 403) {
      return new OpportunityError(
        'FORBIDDEN',
        'Esta sección está disponible para cuentas de prestador.',
        403,
        serverCode
      );
    }
    if (error.status === 404) {
      return new OpportunityError(
        'NOT_FOUND',
        'La oportunidad no está disponible para tu perfil.',
        404,
        serverCode
      );
    }
    if (error.status === 400) {
      return new OpportunityError(
        'VALIDATION',
        'Revisa los filtros o la oportunidad solicitada e intenta de nuevo.',
        400,
        serverCode
      );
    }
    return new OpportunityError('UNKNOWN', fallback, error.status, serverCode);
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return new OpportunityError(
      'NETWORK',
      'La solicitud tardó demasiado. Intenta de nuevo.'
    );
  }

  return new OpportunityError(
    'NETWORK',
    'No se pudo conectar con ALIADO. Revisa tu conexión e intenta de nuevo.'
  );
}

function queryString(filters: OpportunityFilters): string {
  const query: string[] = [];
  if (filters.categoriaId) {
    query.push(`categoria=${encodeURIComponent(filters.categoriaId)}`);
  }
  if (filters.urgencia) {
    query.push(`urgencia=${encodeURIComponent(filters.urgencia)}`);
  }
  return query.length > 0 ? `?${query.join('&')}` : '';
}

export class HttpOpportunitiesGateway implements OpportunitiesGateway {
  private readonly baseUrl?: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl;
  }

  private requireBaseUrl(): string {
    if (!this.baseUrl) {
      throw new OpportunityError(
        'CONFIGURATION',
        'La URL de la API no está configurada en este entorno.'
      );
    }
    return this.baseUrl;
  }

  async getCategories(token: string): Promise<OpportunityCategory[]> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        '/api/v1/catalogo/categorias',
        { method: 'GET', token }
      );
      if (!Array.isArray(response)) {
        throw new OpportunityError(
          'UNKNOWN',
          'La respuesta del servidor no tiene el formato esperado.'
        );
      }
      return response.map(parseCategory);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar las categorías.');
    }
  }

  async list(token: string, filters: OpportunityFilters): Promise<Opportunity[]> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        `/api/v1/oportunidades${queryString(filters)}`,
        { method: 'GET', token }
      );
      if (!Array.isArray(response)) {
        throw new OpportunityError(
          'UNKNOWN',
          'La respuesta del servidor no tiene el formato esperado.'
        );
      }
      return response.map(parseOpportunity);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar las oportunidades.');
    }
  }

  async get(token: string, solicitudId: string): Promise<Opportunity> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        `/api/v1/oportunidades/${encodeURIComponent(solicitudId)}`,
        { method: 'GET', token }
      );
      return parseOpportunity(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar la oportunidad.');
    }
  }

  async listNotifications(token: string): Promise<OpportunityNotification[]> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        '/api/v1/notificaciones/oportunidades',
        { method: 'GET', token }
      );
      if (!Array.isArray(response)) {
        throw new OpportunityError(
          'UNKNOWN',
          'La respuesta del servidor no tiene el formato esperado.'
        );
      }
      return response.flatMap((item) => {
        const notification = parseNotification(item);
        return notification ? [notification] : [];
      });
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar los avisos de oportunidades.');
    }
  }
}
