import { ApiError, requestJson } from '../../../shared/api/http-client';
import {
  ProposalError,
  isProposalState,
  type AcceptProposalResponse,
  type CreateProposalInput,
  type Proposal,
  type RetireProposalResponse,
  type UpdateProposalInput,
} from '../types/proposal';
import type { ProposalGateway } from './proposal-gateway';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requiredString(value: unknown): string {
  if (typeof value !== 'string' || !value) {
    throw new ProposalError(
      'INVALID_RESPONSE',
      'La respuesta del servidor no tiene el formato esperado.'
    );
  }
  return value;
}

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new ProposalError(
      'INVALID_RESPONSE',
      'La respuesta del servidor no tiene el formato esperado.'
    );
  }
  return value;
}

function parseProposal(value: unknown): Proposal {
  if (!isRecord(value) || !isProposalState(value.estado)) {
    throw new ProposalError(
      'INVALID_RESPONSE',
      'La respuesta del servidor no tiene el formato esperado.'
    );
  }
  return {
    id: requiredString(value.id),
    solicitudId: requiredString(value.solicitudId),
    prestadorId: requiredString(value.prestadorId),
    disponibilidad: requiredString(value.disponibilidad),
    mensaje: nullableString(value.mensaje),
    estado: value.estado,
  };
}

function parseRetireResponse(value: unknown): RetireProposalResponse {
  if (!isRecord(value) || !isProposalState(value.estado)) {
    throw new ProposalError(
      'INVALID_RESPONSE',
      'La respuesta del servidor no tiene el formato esperado.'
    );
  }
  return {
    id: requiredString(value.id),
    estado: value.estado,
  };
}

function getServerCode(body: unknown): string | undefined {
  if (isRecord(body) && typeof body.code === 'string') {
    return body.code;
  }
  return undefined;
}

function getServerMessage(body: unknown): string | undefined {
  if (isRecord(body) && typeof body.message === 'string' && body.message.trim()) {
    return body.message;
  }
  return undefined;
}

function conflictMessage(serverCode: string | undefined): string {
  switch (serverCode) {
    case 'PROPUESTA_DUPLICADA':
      return 'Ya tienes una propuesta activa para esta solicitud.';
    case 'PROPUESTA_NO_ACTIVA':
      return 'La propuesta ya no está activa. No se puede editar ni retirar.';
    case 'SOLICITUD_NO_ABIERTA':
      return 'La solicitud ya no admite nuevas propuestas.';
    case 'SOLICITUD_NO_COMPATIBLE':
      return 'La oportunidad ya no es compatible con tu perfil.';
    case 'SERVICIO_YA_CONTRATADO':
      return 'La solicitud ya tiene un servicio contratado.';
    case 'CONFLICTO_CONCURRENCIA':
    case 'REGISTRO_DUPLICADO':
      return 'La propuesta cambió por otra operación. Vuelve a intentarlo.';
    default:
      return 'La propuesta cambió de estado. Vuelve a intentarlo.';
  }
}

function mapApiError(error: unknown, fallback: string): ProposalError {
  if (error instanceof ProposalError) {
    return error;
  }

  if (error instanceof ApiError) {
    const serverCode = getServerCode(error.body);
    const serverMessage = getServerMessage(error.body);

    if (error.status === 401) {
      return new ProposalError(
        'SESSION_EXPIRED',
        'Tu sesión expiró. Inicia sesión de nuevo.',
        401,
        serverCode
      );
    }
    if (error.status === 403) {
      return new ProposalError(
        'FORBIDDEN',
        'No tienes permiso para realizar esta operación.',
        403,
        serverCode
      );
    }
    if (error.status === 404) {
      return new ProposalError(
        'NOT_FOUND',
        'La solicitud o la propuesta ya no está disponible.',
        404,
        serverCode
      );
    }
    if (error.status === 409) {
      return new ProposalError('CONFLICT', conflictMessage(serverCode), 409, serverCode);
    }
    if (error.status === 400) {
      return new ProposalError(
        'VALIDATION',
        serverMessage ?? 'Revisa la disponibilidad y el mensaje e intenta de nuevo.',
        400,
        serverCode
      );
    }
    return new ProposalError('UNKNOWN', fallback, error.status, serverCode);
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return new ProposalError(
      'NETWORK',
      'La solicitud tardó demasiado. Intenta de nuevo.'
    );
  }

  return new ProposalError(
    'NETWORK',
    'No se pudo conectar con ALIADO. Revisa tu conexión e intenta de nuevo.'
  );
}

export class HttpProposalGateway implements ProposalGateway {
  private readonly baseUrl?: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl;
  }

  private requireBaseUrl(): string {
    if (!this.baseUrl) {
      throw new ProposalError(
        'CONFIGURATION',
        'La URL de la API no está configurada en este entorno.'
      );
    }
    return this.baseUrl;
  }

  async create(token: string, input: CreateProposalInput): Promise<Proposal> {
    try {
      const response = await requestJson<unknown>(this.requireBaseUrl(), '/api/v1/propuestas', {
        method: 'POST',
        token,
        body: {
          solicitudId: input.solicitudId,
          disponibilidad: input.disponibilidad,
          ...(input.mensaje ? { mensaje: input.mensaje } : {}),
        },
      });
      return parseProposal(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible enviar la propuesta. Intenta de nuevo.');
    }
  }

  async update(
    token: string,
    proposalId: string,
    input: UpdateProposalInput
  ): Promise<Proposal> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        `/api/v1/propuestas/${encodeURIComponent(proposalId)}`,
        {
          method: 'PUT',
          token,
          body: {
            disponibilidad: input.disponibilidad,
            mensaje: input.mensaje,
          },
        }
      );
      const proposal = parseProposal(response);
      if (proposal.id !== proposalId) {
        throw new ProposalError(
          'INVALID_RESPONSE',
          'La respuesta no corresponde a la propuesta solicitada.'
        );
      }
      return proposal;
    } catch (error) {
      throw mapApiError(error, 'No fue posible actualizar la propuesta. Intenta de nuevo.');
    }
  }

  async listReceived(token: string, solicitudId: string): Promise<Proposal[]> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        `/api/v1/solicitudes/${encodeURIComponent(solicitudId)}/propuestas`,
        { method: 'GET', token }
      );
      if (!Array.isArray(response)) {
        throw new ProposalError(
          'INVALID_RESPONSE',
          'La respuesta del servidor no tiene el formato esperado.'
        );
      }
      return response.map(parseProposal);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar las propuestas recibidas.');
    }
  }

  async accept(token: string, proposalId: string): Promise<AcceptProposalResponse> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        `/api/v1/propuestas/${encodeURIComponent(proposalId)}/aceptar`,
        { method: 'POST', token }
      );
      if (!isRecord(response)) {
        throw new ProposalError(
          'INVALID_RESPONSE',
          'La respuesta del servidor no tiene el formato esperado.'
        );
      }
      return {
        servicioId: requiredString(response.servicioId),
        estado: requiredString(response.estado),
      };
    } catch (error) {
      throw mapApiError(error, 'No fue posible aceptar la propuesta. Intenta de nuevo.');
    }
  }

  async retire(token: string, proposalId: string): Promise<RetireProposalResponse> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        `/api/v1/propuestas/${encodeURIComponent(proposalId)}/retirar`,
        { method: 'POST', token }
      );
      const retired = parseRetireResponse(response);
      if (retired.id !== proposalId || retired.estado !== 'RETIRADA') {
        throw new ProposalError(
          'INVALID_RESPONSE',
          'La respuesta de retiro no corresponde a la propuesta solicitada.'
        );
      }
      return retired;
    } catch (error) {
      throw mapApiError(error, 'No fue posible retirar la propuesta. Intenta de nuevo.');
    }
  }
}
