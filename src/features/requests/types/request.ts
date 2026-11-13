export type RequestStatus = 'BORRADOR' | 'PUBLICADA' | 'CANCELADA' | 'CONTRATADA';

export type RequestUrgency = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export type RequestState = 'BORRADOR' | 'PUBLICADA';

export interface CatalogCategory {
  id: string;
  nombre: string;
}

export interface CatalogZone {
  id: string;
  nombre: string;
  coberturaGeografica: string | null;
}

export interface RequestCatalogs {
  categories: CatalogCategory[];
  zones: CatalogZone[];
}

export interface ServiceRequest {
  id: string;
  clienteId: string;
  categoriaId: string | null;
  zonaId: string | null;
  descripcion: string | null;
  urgencia: RequestUrgency | null;
  estado: RequestStatus;
  fechaCreacion: string;
  fechaActualizacion: string;
  fotos: string[];
}

export interface CreateServiceRequestInput {
  categoriaId: string | null;
  descripcion: string | null;
  zonaId: string | null;
  urgencia: RequestUrgency | null;
  estadoDeseado: RequestState;
}

export interface UpdateServiceRequestInput {
  categoriaId: string | null;
  descripcion: string | null;
  zonaId: string | null;
  urgencia: RequestUrgency | null;
}

export interface LocalPhoto {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export interface UploadedPhoto {
  id: string;
  archivoKey: string;
  orden: number;
}

export type RequestErrorCode =
  | 'CONFIGURATION'
  | 'NETWORK'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'SESSION_EXPIRED'
  | 'UNKNOWN';

export class RequestError extends Error {
  readonly code: RequestErrorCode;
  readonly status?: number;
  readonly serverCode?: string;

  constructor(code: RequestErrorCode, message: string, status?: number, serverCode?: string) {
    super(message);
    this.name = 'RequestError';
    this.code = code;
    this.status = status;
    this.serverCode = serverCode;
  }
}

export const urgencyOptions: Array<{ value: RequestUrgency; label: string }> = [
  { value: 'BAJA', label: 'Baja' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
];

export const MAX_REQUEST_PHOTOS = 10;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function isRequestStatus(value: unknown): value is RequestStatus {
  return (
    value === 'BORRADOR' ||
    value === 'PUBLICADA' ||
    value === 'CANCELADA' ||
    value === 'CONTRATADA'
  );
}

export function isRequestUrgency(value: unknown): value is RequestUrgency {
  return value === 'BAJA' || value === 'MEDIA' || value === 'ALTA' || value === 'URGENTE';
}

export function isRequestOpen(request: ServiceRequest): boolean {
  return request.estado === 'BORRADOR' || request.estado === 'PUBLICADA';
}
