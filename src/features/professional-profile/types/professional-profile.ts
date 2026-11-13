export interface ProfessionalCategory {
  id: string;
  nombre: string;
}

export interface ProfessionalZone {
  id: string;
  nombre: string;
  coberturaGeografica: string | null;
}

export interface ProfessionalCatalogs {
  categories: ProfessionalCategory[];
  zones: ProfessionalZone[];
}

export interface CreateProfessionalProfileInput {
  categoriaIds: string[];
  zonaIds: string[];
}

export interface CreatedProfessionalProfile {
  id: string;
  prestadorId: string;
}

export interface AvailabilityBlock {
  id: string | null;
  diaSemana: number | null;
  horaInicio: string;
  horaFin: string;
}

export interface PublicReview {
  id: string;
  valor: number;
  texto: string;
  fechaCreacion: string;
}

export interface ProfessionalPreview {
  prestadorId: string;
  categorias: string[];
  zonas: string[];
  reputacion: number;
  cantidadCalificaciones: number;
  nivelVerificacion: string;
  disponibilidad: AvailabilityBlock[];
  datosGenerales: Record<string, unknown>;
  resenas: PublicReview[];
}

export interface AgendaCommitment {
  id: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  origen: string;
}

export type ProfessionalProfileErrorCode =
  | 'CONFIGURATION'
  | 'NETWORK'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'PROFILE_ALREADY_EXISTS'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'SESSION_EXPIRED'
  | 'UNKNOWN';

export class ProfessionalProfileError extends Error {
  readonly code: ProfessionalProfileErrorCode;
  readonly status?: number;
  readonly serverCode?: string;

  constructor(
    code: ProfessionalProfileErrorCode,
    message: string,
    status?: number,
    serverCode?: string
  ) {
    super(message);
    this.name = 'ProfessionalProfileError';
    this.code = code;
    this.status = status;
    this.serverCode = serverCode;
  }
}

export function isProfileMissing(error: unknown): boolean {
  return error instanceof ProfessionalProfileError && error.code === 'NOT_FOUND';
}

export function isProfileAlreadyExists(error: unknown): boolean {
  return error instanceof ProfessionalProfileError && error.code === 'PROFILE_ALREADY_EXISTS';
}

export function isUncertainProfessionalProfileError(error: unknown): boolean {
  return (
    error instanceof ProfessionalProfileError &&
    (error.code === 'NETWORK' ||
      error.code === 'UNKNOWN' ||
      (error.status !== undefined && error.status >= 500))
  );
}
