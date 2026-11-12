export type VisibilityPreference = 'PUBLICO' | 'SOLO_ZONA' | 'PRIVADO';

export interface UserProfile {
  usuarioId: string;
  nombre: string | null;
  telefono: string | null;
  preferenciaVisibilidad: VisibilityPreference;
  zonaAproximada: string | null;
  direccionExacta: string | null;
  version: number;
}

export interface PublicProfile {
  usuarioId: string;
  zonaAproximada: string | null;
}

export type DeletionState = 'PENDIENTE' | 'CONFIRMADA' | 'EXPIRADA' | 'RECHAZADA';

export interface DeletionRequest {
  estado: DeletionState;
  expiraEn: string;
}

export interface UpdateProfileInput {
  nombre?: string;
  telefono?: string;
  version: number;
}

export interface UpdateLocationInput {
  zonaAproximada: string;
  direccionExacta?: string;
}

export type ProfileErrorCode =
  | 'CONFIGURATION'
  | 'NETWORK'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'EXPIRED'
  | 'SESSION_EXPIRED'
  | 'UNKNOWN';

export class ProfileError extends Error {
  readonly code: ProfileErrorCode;
  readonly status?: number;
  readonly serverCode?: string;

  constructor(code: ProfileErrorCode, message: string, status?: number, serverCode?: string) {
    super(message);
    this.name = 'ProfileError';
    this.code = code;
    this.status = status;
    this.serverCode = serverCode;
  }
}

export const visibilityOptions: Array<{
  value: VisibilityPreference;
  label: string;
  description: string;
}> = [
  {
    value: 'PUBLICO',
    label: 'Público',
    description: 'Tu perfil puede aparecer en búsquedas y tu zona aproximada es visible.',
  },
  {
    value: 'SOLO_ZONA',
    label: 'Solo zona',
    description: 'Se muestra únicamente tu zona aproximada. Es la opción por defecto.',
  },
  {
    value: 'PRIVADO',
    label: 'Privado',
    description: 'Tu perfil no aparece en búsquedas ni en la vista pública.',
  },
];

export function isVisibilityPreference(value: unknown): value is VisibilityPreference {
  return value === 'PUBLICO' || value === 'SOLO_ZONA' || value === 'PRIVADO';
}

export function isDeletionState(value: unknown): value is DeletionState {
  return (
    value === 'PENDIENTE' ||
    value === 'CONFIRMADA' ||
    value === 'EXPIRADA' ||
    value === 'RECHAZADA'
  );
}
