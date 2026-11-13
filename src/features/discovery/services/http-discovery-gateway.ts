import { ApiError, requestJson } from '../../../shared/api/http-client';
import {
  DiscoveryError,
  type DiscoveryCatalogs,
  type ProviderAvailabilityBlock,
  type ProviderReview,
  type ProviderSearchResult,
  type PublicProvider,
} from '../types/discovery';
import type { DiscoveryGateway } from './discovery-gateway';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requiredString(value: unknown): string {
  if (typeof value !== 'string' || !value) {
    throw new DiscoveryError('UNKNOWN', 'La respuesta del servidor no tiene el formato esperado.');
  }
  return value;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new DiscoveryError('UNKNOWN', 'La respuesta del servidor no tiene el formato esperado.');
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function parseCategory(value: unknown) {
  if (!isRecord(value)) {
    throw new DiscoveryError('UNKNOWN', 'La respuesta del servidor no tiene el formato esperado.');
  }
  return {
    id: requiredString(value.id),
    nombre: requiredString(value.nombre),
  };
}

function parseZone(value: unknown) {
  if (!isRecord(value)) {
    throw new DiscoveryError('UNKNOWN', 'La respuesta del servidor no tiene el formato esperado.');
  }
  return {
    id: requiredString(value.id),
    nombre: requiredString(value.nombre),
    coberturaGeografica:
      typeof value.coberturaGeografica === 'string' ? value.coberturaGeografica : null,
  };
}

function parseCatalogs(categories: unknown, zones: unknown): DiscoveryCatalogs {
  if (!Array.isArray(categories) || !Array.isArray(zones)) {
    throw new DiscoveryError('UNKNOWN', 'La respuesta del servidor no tiene el formato esperado.');
  }
  return {
    categories: categories.map(parseCategory),
    zones: zones.map(parseZone),
  };
}

function parseAvailability(value: unknown): ProviderAvailabilityBlock[] {
  if (!Array.isArray(value)) {
    throw new DiscoveryError('UNKNOWN', 'La respuesta del servidor no tiene el formato esperado.');
  }
  return value.map((item) => {
    if (
      !isRecord(item) ||
      typeof item.horaInicio !== 'string' ||
      typeof item.horaFin !== 'string'
    ) {
      throw new DiscoveryError('UNKNOWN', 'La respuesta del servidor no tiene el formato esperado.');
    }
    return {
      diaSemana: typeof item.diaSemana === 'number' ? item.diaSemana : null,
      horaInicio: item.horaInicio,
      horaFin: item.horaFin,
    };
  });
}

function parseReviews(value: unknown): ProviderReview[] {
  if (!Array.isArray(value)) {
    throw new DiscoveryError('UNKNOWN', 'La respuesta del servidor no tiene el formato esperado.');
  }
  return value.map((item) => {
    if (
      !isRecord(item) ||
      typeof item.valor !== 'number' ||
      typeof item.texto !== 'string' ||
      typeof item.fechaCreacion !== 'string'
    ) {
      throw new DiscoveryError('UNKNOWN', 'La respuesta del servidor no tiene el formato esperado.');
    }
    return {
      id: requiredString(item.id),
      valor: item.valor,
      texto: item.texto,
      fechaCreacion: item.fechaCreacion,
    };
  });
}

function parseProvider(value: unknown): PublicProvider {
  if (
    !isRecord(value) ||
    typeof value.reputacionAgregada !== 'number' ||
    typeof value.cantidadCalificaciones !== 'number' ||
    typeof value.nivelVerificacion !== 'string'
  ) {
    throw new DiscoveryError('UNKNOWN', 'La respuesta del servidor no tiene el formato esperado.');
  }

  return {
    id: requiredString(value.id),
    categorias: stringArray(value.categorias),
    zonas: stringArray(value.zonas),
    reputacionAgregada: value.reputacionAgregada,
    cantidadCalificaciones: value.cantidadCalificaciones,
    nivelVerificacion: value.nivelVerificacion,
    disponibilidad: parseAvailability(value.disponibilidad),
    datosGenerales: isRecord(value.datosGenerales) ? value.datosGenerales : {},
    resenas: parseReviews(value.resenas),
  };
}

function parseSearchResult(value: unknown): ProviderSearchResult {
  if (!isRecord(value) || !Array.isArray(value.prestadores) || !Array.isArray(value.sugerencias)) {
    throw new DiscoveryError('UNKNOWN', 'La respuesta del servidor no tiene el formato esperado.');
  }
  return {
    prestadores: value.prestadores.map(parseProvider),
    sugerencias: value.sugerencias.filter((item): item is string => typeof item === 'string'),
  };
}

function getServerCode(body: unknown): string | undefined {
  if (isRecord(body) && typeof body.code === 'string') {
    return body.code;
  }
  return undefined;
}

function mapApiError(error: unknown, fallback: string): DiscoveryError {
  if (error instanceof DiscoveryError) {
    return error;
  }

  if (error instanceof ApiError) {
    const serverCode = getServerCode(error.body);
    if (error.status === 401) {
      return new DiscoveryError(
        'SESSION_EXPIRED',
        'Tu sesión expiró. Inicia sesión de nuevo.',
        401,
        serverCode
      );
    }
    if (error.status === 403) {
      return new DiscoveryError(
        'FORBIDDEN',
        'Esta sección está disponible para cuentas de cliente.',
        403,
        serverCode
      );
    }
    if (error.status === 404) {
      return new DiscoveryError(
        'NOT_FOUND',
        'El perfil no está disponible.',
        404,
        serverCode
      );
    }
    if (error.status === 400) {
      return new DiscoveryError(
        'VALIDATION',
        'Revisa los criterios de búsqueda e intenta de nuevo.',
        400,
        serverCode
      );
    }
    return new DiscoveryError('UNKNOWN', fallback, error.status, serverCode);
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return new DiscoveryError('NETWORK', 'La solicitud tardó demasiado. Intenta de nuevo.');
  }

  return new DiscoveryError(
    'NETWORK',
    'No se pudo conectar con ALIADO. Revisa tu conexión e intenta de nuevo.'
  );
}

export class HttpDiscoveryGateway implements DiscoveryGateway {
  private readonly baseUrl?: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl;
  }

  private requireBaseUrl(): string {
    if (!this.baseUrl) {
      throw new DiscoveryError(
        'CONFIGURATION',
        'La URL de la API no está configurada en este entorno.'
      );
    }
    return this.baseUrl;
  }

  async getCatalogs(token: string): Promise<DiscoveryCatalogs> {
    try {
      const [categories, zones] = await Promise.all([
        requestJson<unknown>(this.requireBaseUrl(), '/api/v1/catalogo/categorias', {
          method: 'GET',
          token,
        }),
        requestJson<unknown>(this.requireBaseUrl(), '/api/v1/catalogo/zonas', {
          method: 'GET',
          token,
        }),
      ]);
      return parseCatalogs(categories, zones);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar el catálogo de búsqueda.');
    }
  }

  async search(token: string, categoriaId: string, zonaId: string): Promise<ProviderSearchResult> {
    const query = `categoria=${encodeURIComponent(categoriaId)}&zona=${encodeURIComponent(zonaId)}`;
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        `/api/v1/descubrimiento/prestadores?${query}`,
        { method: 'GET', token }
      );
      return parseSearchResult(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible buscar prestadores.');
    }
  }

  async getProvider(token: string, providerId: string): Promise<PublicProvider> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        `/api/v1/descubrimiento/prestadores/${encodeURIComponent(providerId)}/perfil`,
        { method: 'GET', token }
      );
      return parseProvider(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar el perfil público.');
    }
  }
}
