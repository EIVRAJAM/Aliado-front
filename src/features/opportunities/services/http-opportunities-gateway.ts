import { ApiError, requestJson } from '../../../shared/api/http-client';
import {
  OpportunityError,
  isOpportunityId,
  isOpportunityUrgency,
  type Opportunity,
  type OpportunityCategory,
  type OpportunityFilters,
} from '../types/opportunity';
import type { OpportunitiesGateway } from './opportunities-gateway';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requiredString(value: unknown): string {
  if (typeof value !== 'string' || !value) {
    throw new OpportunityError(
      'UNKNOWN',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
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
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return value;
}

function parsePhotoReferences(value: unknown): Array<{ id: string; orden: number }> {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new OpportunityError(
      'UNKNOWN',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }
  return value.map((item) => {
    if (!isRecord(item) || typeof item.id !== 'string' || !isOpportunityId(item.id)
      || typeof item.orden !== 'number' || !Number.isInteger(item.orden) || item.orden < 1) {
      throw new OpportunityError('UNKNOWN', 'La respuesta del servidor no tiene el formato esperado.');
    }
    return { id: item.id, orden: item.orden };
  });
}

function parseCategory(value: unknown): OpportunityCategory {
  if (!isRecord(value)) {
    throw new OpportunityError(
      'UNKNOWN',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
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
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }

  const urgencia = value.urgencia;
  if (urgencia !== null && urgencia !== undefined && !isOpportunityUrgency(urgencia)) {
    throw new OpportunityError(
      'UNKNOWN',
      'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
    );
  }

  return {
    solicitudId: requiredString(value.solicitudId),
    categoria: requiredString(value.categoria),
    zonaAproximada: requiredString(value.zonaAproximada),
    urgencia: urgencia === null || urgencia === undefined ? null : urgencia,
    descripcion: nullableString(value.descripcion),
    fechaCreacion: requiredString(value.fechaCreacion),
    fotosDetalle: parsePhotoReferences(value.fotosDetalle),
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
        'No podemos cargar las oportunidades en este momento. Intenta de nuevo más tarde.'
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
          'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
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
          'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.'
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

  photoUrl(solicitudId: string, fotoId: string): string {
    return `${this.requireBaseUrl().replace(/\/+$/, '')}/api/v1/solicitudes/${encodeURIComponent(solicitudId)}/fotos/${encodeURIComponent(fotoId)}`;
  }

}
