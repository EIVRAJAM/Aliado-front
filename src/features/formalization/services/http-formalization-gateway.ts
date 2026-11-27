import { ApiError, requestJson } from '../../../shared/api/http-client';
import {
  FormalizationError,
  type FormalizationLink,
  type FormalizationLinkState,
  type FormalizationProgress,
  type FormalizationRoute,
  type FormalizationStep,
} from '../types/formalization';
import type { FormalizationGateway } from './formalization-gateway';

const INVALID_RESPONSE = 'No pudimos interpretar la respuesta de ALIADO. Intenta de nuevo.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requiredString(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new FormalizationError('INVALID_RESPONSE', INVALID_RESPONSE);
  }
  return value;
}

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new FormalizationError('INVALID_RESPONSE', INVALID_RESPONSE);
  }
  return value;
}

function requiredInteger(value: unknown, min: number, max?: number): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < min ||
    (max !== undefined && value > max)
  ) {
    throw new FormalizationError('INVALID_RESPONSE', INVALID_RESPONSE);
  }
  return value;
}

function parseLinkState(value: unknown): FormalizationLinkState {
  if (value === 'DISPONIBLE' || value === 'NO_DISPONIBLE') {
    return value;
  }
  throw new FormalizationError('INVALID_RESPONSE', INVALID_RESPONSE);
}

function parseLink(value: unknown): FormalizationLink {
  if (!isRecord(value)) {
    throw new FormalizationError('INVALID_RESPONSE', INVALID_RESPONSE);
  }
  return {
    id: requiredString(value.id),
    nombre: requiredString(value.nombre),
    url: requiredString(value.url),
    estado: parseLinkState(value.estado),
  };
}

function parseStep(value: unknown): FormalizationStep {
  if (!isRecord(value) || !Array.isArray(value.enlaces)) {
    throw new FormalizationError('INVALID_RESPONSE', INVALID_RESPONSE);
  }
  return {
    id: requiredString(value.id),
    titulo: requiredString(value.titulo),
    descripcion: nullableString(value.descripcion),
    orden: requiredInteger(value.orden, 1),
    enlaces: value.enlaces.map(parseLink),
  };
}

function parseRoute(value: unknown): FormalizationRoute {
  if (!isRecord(value) || !Array.isArray(value.pasos)) {
    throw new FormalizationError('INVALID_RESPONSE', INVALID_RESPONSE);
  }
  const pasos = value.pasos.map(parseStep).sort((left, right) => left.orden - right.orden);
  return {
    id: requiredString(value.id),
    nombre: requiredString(value.nombre),
    descripcion: nullableString(value.descripcion),
    pasos,
    avisoLegal: requiredString(value.avisoLegal),
  };
}

function parseRouteList(value: unknown): FormalizationRoute[] {
  if (!Array.isArray(value)) {
    throw new FormalizationError('INVALID_RESPONSE', INVALID_RESPONSE);
  }
  return value.map(parseRoute);
}

function parseProgress(value: unknown): FormalizationProgress {
  if (!isRecord(value)) {
    throw new FormalizationError('INVALID_RESPONSE', INVALID_RESPONSE);
  }
  return {
    rutaId: requiredString(value.rutaId),
    valorOrientativo: requiredInteger(value.valorOrientativo, 0, 100),
    avisoLegal: requiredString(value.avisoLegal),
  };
}

function parseProgressList(value: unknown): FormalizationProgress[] {
  if (!Array.isArray(value)) {
    throw new FormalizationError('INVALID_RESPONSE', INVALID_RESPONSE);
  }
  return value.map(parseProgress);
}

function getServerCode(body: unknown): string | undefined {
  return isRecord(body) && typeof body.code === 'string' ? body.code : undefined;
}

function getServerMessage(body: unknown): string | undefined {
  return isRecord(body) && typeof body.message === 'string' && body.message.trim()
    ? body.message
    : undefined;
}

function notFoundMessage(serverCode?: string): string {
  switch (serverCode) {
    case 'SIN_PROGRESO':
      return 'Aún no tienes progreso registrado en formalización.';
    case 'ENLACE_NO_ENCONTRADO':
      return 'El enlace ya no está disponible.';
    case 'RUTA_NO_ENCONTRADA':
      return 'La ruta de formalización ya no está disponible.';
    default:
      return 'La información solicitada ya no está disponible.';
  }
}

function mapApiError(error: unknown, fallback: string): FormalizationError {
  if (error instanceof FormalizationError) {
    return error;
  }
  if (error instanceof ApiError) {
    const serverCode = getServerCode(error.body);
    const serverMessage = getServerMessage(error.body);

    if (error.status === 401) {
      return new FormalizationError(
        'SESSION_EXPIRED',
        'Tu sesión expiró. Inicia sesión de nuevo.',
        401,
        serverCode
      );
    }
    if (error.status === 403) {
      return new FormalizationError(
        'FORBIDDEN',
        'Esta sección está disponible para cuentas de prestador.',
        403,
        serverCode,
        serverMessage
      );
    }
    if (error.status === 404) {
      return new FormalizationError(
        'NOT_FOUND',
        notFoundMessage(serverCode),
        404,
        serverCode,
        serverMessage
      );
    }
    if (error.status === 400) {
      return new FormalizationError(
        'VALIDATION',
        serverMessage ?? 'Revisa los datos ingresados e intenta de nuevo.',
        400,
        serverCode,
        serverMessage
      );
    }
    return new FormalizationError('UNKNOWN', fallback, error.status, serverCode, serverMessage);
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return new FormalizationError('NETWORK', 'La solicitud tardó demasiado. Intenta de nuevo.');
  }
  return new FormalizationError(
    'NETWORK',
    'No se pudo conectar con ALIADO. Revisa tu conexión e intenta de nuevo.'
  );
}

export class HttpFormalizationGateway implements FormalizationGateway {
  private readonly baseUrl?: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl;
  }

  private requireBaseUrl(): string {
    if (!this.baseUrl) {
      throw new FormalizationError(
        'CONFIGURATION',
        'No podemos cargar tu ruta de formalización en este momento. Intenta de nuevo más tarde.'
      );
    }
    return this.baseUrl;
  }

  async getRoute(token: string): Promise<FormalizationRoute[]> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        '/api/v1/formalizacion/ruta',
        { method: 'GET', token }
      );
      return parseRouteList(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar la ruta de formalización.');
    }
  }

  async getProgress(token: string): Promise<FormalizationProgress[]> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        '/api/v1/formalizacion/progreso',
        { method: 'GET', token }
      );
      return parseProgressList(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible consultar tu progreso de formalización.');
    }
  }

  async getLink(token: string, linkId: string): Promise<FormalizationLink> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        `/api/v1/formalizacion/enlaces/${encodeURIComponent(linkId)}`,
        { method: 'GET', token }
      );
      return parseLink(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible verificar el enlace oficial.');
    }
  }
}
