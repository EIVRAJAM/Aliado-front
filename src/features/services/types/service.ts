export type ServiceState =
  | 'CONTRATADO'
  | 'EN_EJECUCION'
  | 'TERMINADO'
  | 'FINALIZADO'
  | 'CANCELADO';

export type ServiceProposalState = 'ACEPTADA';

export interface ServiceCategory {
  id: string;
  nombre: string;
}

export interface ServiceZone {
  id: string;
  nombre: string;
}

export interface ServiceCatalogs {
  categories: ServiceCategory[];
  zones: ServiceZone[];
}

export interface ServiceSolicitudSummary {
  id: string;
  descripcion: string | null;
  categoriaId: string | null;
  zonaId: string | null;
  urgencia: string | null;
  estado: string;
}

export interface ServiceProposalSummary {
  id: string;
  prestadorId: string;
  disponibilidad: string;
  mensaje: string | null;
  estado: ServiceProposalState;
  fechaCreacion: string;
}

export interface ContractedService {
  id: string;
  solicitudId: string;
  propuestaId: string;
  clienteId: string;
  prestadorId: string;
  estado: ServiceState;
  comunicacionHabilitada: boolean;
  fechaContratacion: string;
  clienteEliminado: boolean;
  prestadorEliminado: boolean;
  solicitud: ServiceSolicitudSummary;
  propuesta: ServiceProposalSummary;
}

export interface ServiceHistoryEntry {
  estadoAnterior: ServiceState | null;
  estadoNuevo: ServiceState;
  actorId: string;
  actorEliminado: boolean;
  fecha: string;
}

export interface ServiceMessage {
  id: string;
  remitenteId: string;
  contenido: string;
  remitenteEliminado: boolean;
  fechaEnvio: string;
}

export interface ServiceTransitionResponse {
  id: string;
  estado: ServiceState;
}

export type ServiceTransitionAction =
  | 'en-ejecucion'
  | 'terminado'
  | 'confirmar-finalizacion'
  | 'cancelar';

export type ServiceErrorCode =
  | 'CONFIGURATION'
  | 'NETWORK'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'SESSION_EXPIRED'
  | 'INVALID_RESPONSE'
  | 'UNKNOWN';

export class ServiceError extends Error {
  readonly code: ServiceErrorCode;
  readonly status?: number;
  readonly serverCode?: string;

  constructor(code: ServiceErrorCode, message: string, status?: number, serverCode?: string) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.status = status;
    this.serverCode = serverCode;
  }
}

export function isServiceState(value: unknown): value is ServiceState {
  return (
    value === 'CONTRATADO' ||
    value === 'EN_EJECUCION' ||
    value === 'TERMINADO' ||
    value === 'FINALIZADO' ||
    value === 'CANCELADO'
  );
}

export function isServiceConflict(error: unknown): boolean {
  return error instanceof ServiceError && error.code === 'CONFLICT';
}

export function isServiceNotFound(error: unknown): boolean {
  return error instanceof ServiceError && error.code === 'NOT_FOUND';
}

export function isUncertainServiceError(error: unknown): boolean {
  return (
    error instanceof ServiceError &&
    (error.code === 'NETWORK' ||
      error.code === 'INVALID_RESPONSE' ||
      (error.code === 'UNKNOWN' && (error.status === undefined || error.status >= 500)))
  );
}
