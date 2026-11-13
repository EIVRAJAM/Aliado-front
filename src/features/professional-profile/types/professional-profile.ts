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


export const PUBLIC_PROFILE_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'descripcion', label: 'descripcion' },
  { key: 'resumen', label: 'resumen' },
  { key: 'experiencia', label: 'experiencia' },
  { key: 'anosExperiencia', label: 'anosExperiencia' },
  { key: 'aniosExperiencia', label: 'aniosExperiencia' },
  { key: 'especialidades', label: 'especialidades' },
  { key: 'servicios', label: 'servicios' },
  { key: 'habilidades', label: 'habilidades' },
  { key: 'formacion', label: 'formacion' },
  { key: 'educacion', label: 'educacion' },
  { key: 'certificaciones', label: 'certificaciones' },
  { key: 'idiomas', label: 'idiomas' },
  { key: 'sitioWeb', label: 'sitioWeb' },
];

export function formatPublicValue(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    const items = value.map((item) => item.trim()).filter(Boolean);
    return items.length > 0 ? items.join(', ') : null;
  }
  return null;
}
