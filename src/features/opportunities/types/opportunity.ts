export type OpportunityUrgency = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface Opportunity {
  solicitudId: string;
  categoria: string;
  zonaAproximada: string;
  urgencia: OpportunityUrgency | null;
  descripcion: string | null;
  fechaCreacion: string;
  fotosDetalle: OpportunityPhotoReference[];
}

export interface OpportunityPhotoReference {
  id: string;
  orden: number;
}

export interface OpportunityCategory {
  id: string;
  nombre: string;
}

export interface OpportunityFilters {
  categoriaId: string | null;
  urgencia: OpportunityUrgency | null;
}

export type OpportunityErrorCode =
  | 'CONFIGURATION'
  | 'NETWORK'
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'SESSION_EXPIRED'
  | 'UNKNOWN';

export class OpportunityError extends Error {
  readonly code: OpportunityErrorCode;
  readonly status?: number;
  readonly serverCode?: string;

  constructor(code: OpportunityErrorCode, message: string, status?: number, serverCode?: string) {
    super(message);
    this.name = 'OpportunityError';
    this.code = code;
    this.status = status;
    this.serverCode = serverCode;
  }
}

export const opportunityUrgencyOptions: Array<{
  value: OpportunityUrgency;
  label: string;
}> = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isOpportunityId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function isOpportunityUrgency(value: unknown): value is OpportunityUrgency {
  return value === 'BAJA' || value === 'MEDIA' || value === 'ALTA' || value === 'URGENTE';
}

export function isOpportunityNotFound(error: unknown): boolean {
  return error instanceof OpportunityError && error.code === 'NOT_FOUND';
}

export function emptyOpportunityFilters(): OpportunityFilters {
  return { categoriaId: null, urgencia: null };
}
