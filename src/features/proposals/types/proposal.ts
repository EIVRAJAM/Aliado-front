export type ProposalState = 'ACTIVA' | 'RETIRADA' | 'ACEPTADA' | 'CERRADA';

export interface Proposal {
  id: string;
  solicitudId: string;
  prestadorId: string;
  disponibilidad: string;
  mensaje: string | null;
  estado: ProposalState;
}

export interface CreateProposalInput {
  solicitudId: string;
  disponibilidad: string;
  mensaje: string | null;
}

export interface UpdateProposalInput {
  disponibilidad: string;
  mensaje: string;
}

export interface RetireProposalResponse {
  id: string;
  estado: ProposalState;
}

export type ProposalErrorCode =
  | 'CONFIGURATION'
  | 'NETWORK'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'SESSION_EXPIRED'
  | 'UNKNOWN';

export class ProposalError extends Error {
  readonly code: ProposalErrorCode;
  readonly status?: number;
  readonly serverCode?: string;

  constructor(code: ProposalErrorCode, message: string, status?: number, serverCode?: string) {
    super(message);
    this.name = 'ProposalError';
    this.code = code;
    this.status = status;
    this.serverCode = serverCode;
  }
}

export function isProposalState(value: unknown): value is ProposalState {
  return (
    value === 'ACTIVA' ||
    value === 'RETIRADA' ||
    value === 'ACEPTADA' ||
    value === 'CERRADA'
  );
}

export function isProposalStateUnavailable(error: unknown): boolean {
  return (
    error instanceof ProposalError &&
    (error.code === 'CONFLICT' || error.code === 'NOT_FOUND')
  );
}
