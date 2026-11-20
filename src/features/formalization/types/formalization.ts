export type FormalizationLinkState = 'DISPONIBLE' | 'NO_DISPONIBLE';

export interface FormalizationLink {
  id: string;
  nombre: string;
  url: string;
  estado: FormalizationLinkState;
}

export interface FormalizationStep {
  id: string;
  titulo: string;
  descripcion: string | null;
  orden: number;
  enlaces: FormalizationLink[];
}

export interface FormalizationRoute {
  id: string;
  nombre: string;
  descripcion: string | null;
  pasos: FormalizationStep[];
  avisoLegal: string;
}

export interface FormalizationProgress {
  rutaId: string;
  valorOrientativo: number;
  avisoLegal: string;
}

export type FormalizationProgressStatus = 'loaded' | 'missing' | 'error';

export type FormalizationErrorCode =
  | 'CONFIGURATION'
  | 'NETWORK'
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'SESSION_EXPIRED'
  | 'INVALID_RESPONSE'
  | 'UNKNOWN';

export class FormalizationError extends Error {
  readonly code: FormalizationErrorCode;
  readonly status?: number;
  readonly serverCode?: string;
  readonly serverMessage?: string;

  constructor(
    code: FormalizationErrorCode,
    message: string,
    status?: number,
    serverCode?: string,
    serverMessage?: string
  ) {
    super(message);
    this.name = 'FormalizationError';
    this.code = code;
    this.status = status;
    this.serverCode = serverCode;
    this.serverMessage = serverMessage;
  }
}

export function isProgressMissing(error: unknown): boolean {
  return (
    error instanceof FormalizationError &&
    error.code === 'NOT_FOUND' &&
    error.serverCode === 'SIN_PROGRESO'
  );
}

export function isLinkMissing(error: unknown): boolean {
  return (
    error instanceof FormalizationError &&
    error.code === 'NOT_FOUND' &&
    error.serverCode === 'ENLACE_NO_ENCONTRADO'
  );
}
