export type ReportTargetType = 'USUARIO' | 'SERVICIO';
export type ReportType = ReportTargetType | 'RESENA';
export type ReportStatus = 'PENDIENTE' | 'EN_REVISION' | 'RESUELTO' | 'DESCARTADO' | string;

export interface ReportEvidence {
  id: string;
  archivoKey: string;
  tipoContenido: string;
}

export interface ReportDetail {
  id: string;
  tipo: ReportType;
  objetivoId: string;
  motivo: string;
  estado: ReportStatus;
  fechaCreacion: string;
  evidencias: ReportEvidence[];
}

export interface CreatedReport {
  reporteId: string;
}

export interface EvidenceDocument {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export interface UploadedEvidence {
  id: string;
  archivoKey: string;
  tipoContenido: string;
}

export type ReportErrorCode =
  | 'CONFIGURATION'
  | 'NETWORK'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'SESSION_EXPIRED'
  | 'UNSUPPORTED'
  | 'TOO_LARGE'
  | 'INVALID_RESPONSE'
  | 'UNKNOWN';

export class ReportError extends Error {
  readonly code: ReportErrorCode;
  readonly status?: number;
  readonly serverCode?: string;
  readonly serverMessage?: string;

  constructor(
    code: ReportErrorCode,
    message: string,
    status?: number,
    serverCode?: string,
    serverMessage?: string
  ) {
    super(message);
    this.name = 'ReportError';
    this.code = code;
    this.status = status;
    this.serverCode = serverCode;
    this.serverMessage = serverMessage;
  }
}

export function isUncertainReportError(error: unknown): boolean {
  return (
    error instanceof ReportError &&
    (error.code === 'NETWORK' ||
      error.code === 'INVALID_RESPONSE' ||
      (error.code === 'UNKNOWN' && (error.status === undefined || error.status >= 500)))
  );
}
