export interface DiscoveryCategory {
  id: string;
  nombre: string;
}

export interface DiscoveryZone {
  id: string;
  nombre: string;
  coberturaGeografica: string | null;
}

export interface DiscoveryCatalogs {
  categories: DiscoveryCategory[];
  zones: DiscoveryZone[];
}

export interface ProviderAvailabilityBlock {
  diaSemana: number | null;
  horaInicio: string;
  horaFin: string;
}

export interface ProviderReview {
  id: string;
  valor: number;
  texto: string;
  fechaCreacion: string;
}

export interface PublicProvider {
  id: string;
  categorias: string[];
  zonas: string[];
  reputacionAgregada: number;
  cantidadCalificaciones: number;
  nivelVerificacion: string;
  disponibilidad: ProviderAvailabilityBlock[];
  datosGenerales: Record<string, unknown>;
  resenas: ProviderReview[];
}

export interface ProviderSearchResult {
  prestadores: PublicProvider[];
  sugerencias: string[];
}

export type DiscoveryErrorCode =
  | 'CONFIGURATION'
  | 'NETWORK'
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'SESSION_EXPIRED'
  | 'UNKNOWN';

export class DiscoveryError extends Error {
  readonly code: DiscoveryErrorCode;
  readonly status?: number;
  readonly serverCode?: string;

  constructor(code: DiscoveryErrorCode, message: string, status?: number, serverCode?: string) {
    super(message);
    this.name = 'DiscoveryError';
    this.code = code;
    this.status = status;
    this.serverCode = serverCode;
  }
}

export function isProviderNotFound(error: unknown): boolean {
  return error instanceof DiscoveryError && error.code === 'NOT_FOUND';
}
