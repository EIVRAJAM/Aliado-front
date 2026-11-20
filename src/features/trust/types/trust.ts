export type VerificationStatus = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface RatingResult {
  id: string;
  reputacionActualizada: number;
}

export interface ReviewResult {
  id: string;
}

export interface VerificationRequest {
  id: string;
  estado: VerificationStatus;
}

export interface VerificationDocument {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

export interface ReportReviewResult {
  reporteId: string;
}

export interface RatingHistoryReview {
  id: string;
  texto: string;
  fechaCreacion: string;
}

export interface RatingHistoryService {
  descripcion: string | null;
  categoria: string | null;
  zonaAproximada: string | null;
}

export interface RatingHistoryProvider {
  id: string | null;
  nombrePublico: string | null;
}

export interface ClientRating {
  calificacionId: string;
  servicioId: string;
  valor: number;
  fechaCalificacion: string;
  resena: RatingHistoryReview | null;
  servicio: RatingHistoryService | null;
  prestador: RatingHistoryProvider | null;
}

export interface ClientRatingHistoryPage {
  items: ClientRating[];
  pagina: number;
  tamano: number;
  totalElementos: number;
  totalPaginas: number;
}

export type TrustErrorCode =
  | 'CONFIGURATION'
  | 'NETWORK'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'NOT_AVAILABLE'
  | 'FORBIDDEN'
  | 'SESSION_EXPIRED'
  | 'UNSUPPORTED'
  | 'TOO_LARGE'
  | 'INVALID_RESPONSE'
  | 'UNKNOWN';

export class TrustError extends Error {
  readonly code: TrustErrorCode;
  readonly status?: number;
  readonly serverCode?: string;
  readonly serverMessage?: string;

  constructor(
    code: TrustErrorCode,
    message: string,
    status?: number,
    serverCode?: string,
    serverMessage?: string
  ) {
    super(message);
    this.name = 'TrustError';
    this.code = code;
    this.status = status;
    this.serverCode = serverCode;
    this.serverMessage = serverMessage;
  }
}

export function isHistoryUnavailable(error: unknown): boolean {
  return error instanceof TrustError && error.code === 'NOT_AVAILABLE';
}

export function isVerificationMissing(error: unknown): boolean {
  return (
    error instanceof TrustError &&
    error.code === 'NOT_FOUND' &&
    error.serverCode === 'SIN_VERIFICACION'
  );
}

export function isTrustConflict(error: unknown): boolean {
  return error instanceof TrustError && error.code === 'CONFLICT';
}

export function isUncertainTrustError(error: unknown): boolean {
  return (
    error instanceof TrustError &&
    (error.code === 'NETWORK' ||
      error.code === 'INVALID_RESPONSE' ||
      (error.code === 'UNKNOWN' && (error.status === undefined || error.status >= 500)))
  );
}
