import { ApiError, requestJson, requestText } from '../../../shared/api/http-client';
import {
  AccountActivityError,
  isHistoryExportState,
  isNotificationChannel,
  isNotificationPreferenceType,
  isWorkHistoryItem,
  type HistoryExport,
  type NotificationPreference,
  type ProviderIndicators,
  type RecentActivityItem,
  type UpdateNotificationPreferenceInput,
  type WorkHistoryItem,
} from '../types/account-activity';
import type { AccountActivityGateway } from './account-activity-gateway';

const INVALID_RESPONSE = 'La respuesta del servidor no tiene el formato esperado.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requiredString(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AccountActivityError('INVALID_RESPONSE', INVALID_RESPONSE);
  }
  return value;
}

function requiredNumber(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new AccountActivityError('INVALID_RESPONSE', INVALID_RESPONSE);
  }
  return value;
}

function requiredInteger(value: unknown): number {
  const number = requiredNumber(value);
  if (!Number.isInteger(number) || number < 0) {
    throw new AccountActivityError('INVALID_RESPONSE', INVALID_RESPONSE);
  }
  return number;
}

function parsePreference(value: unknown): NotificationPreference {
  if (!isRecord(value)) {
    throw new AccountActivityError('INVALID_RESPONSE', INVALID_RESPONSE);
  }
  if (
    !isNotificationPreferenceType(value.tipoAviso) ||
    !isNotificationChannel(value.canal) ||
    typeof value.habilitada !== 'boolean' ||
    typeof value.configurable !== 'boolean'
  ) {
    throw new AccountActivityError('INVALID_RESPONSE', INVALID_RESPONSE);
  }
  return {
    tipoAviso: value.tipoAviso,
    canal: value.canal,
    habilitada: value.habilitada,
    configurable: value.configurable,
  };
}

function parsePreferences(value: unknown): NotificationPreference[] {
  if (!Array.isArray(value)) {
    throw new AccountActivityError('INVALID_RESPONSE', INVALID_RESPONSE);
  }
  return value.map(parsePreference);
}

function parseHistory(value: unknown): WorkHistoryItem[] {
  if (!Array.isArray(value) || !value.every(isWorkHistoryItem)) {
    throw new AccountActivityError('INVALID_RESPONSE', INVALID_RESPONSE);
  }
  return value
    .map((item) => ({
      id: item.id,
      estado: item.estado,
      fechaContratacion: item.fechaContratacion,
    }))
    .sort((left, right) => {
      const leftTime = Date.parse(left.fechaContratacion);
      const rightTime = Date.parse(right.fechaContratacion);
      const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
      const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
      return safeRight - safeLeft;
    });
}

function parseHistoryExport(value: unknown): HistoryExport {
  if (
    !isRecord(value) ||
    !isHistoryExportState(value.estado)
  ) {
    throw new AccountActivityError('INVALID_RESPONSE', INVALID_RESPONSE);
  }
  return {
    id: requiredString(value.id),
    archivoKey: requiredString(value.archivoKey),
    estado: value.estado,
  };
}

function parseIndicators(value: unknown): ProviderIndicators {
  if (!isRecord(value)) {
    throw new AccountActivityError('INVALID_RESPONSE', INVALID_RESPONSE);
  }
  return {
    totalServicios: requiredInteger(value.totalServicios),
    enCurso: requiredInteger(value.enCurso),
    finalizados: requiredInteger(value.finalizados),
    reputacion: requiredNumber(value.reputacion),
    cantidadCalificaciones: requiredInteger(value.cantidadCalificaciones),
  };
}

function parseRecentActivity(value: unknown): RecentActivityItem[] {
  if (!Array.isArray(value)) {
    throw new AccountActivityError('INVALID_RESPONSE', INVALID_RESPONSE);
  }
  return value
    .map((item) => {
      if (
        !isRecord(item) ||
        typeof item.tipo !== 'string' ||
        typeof item.resumen !== 'string' ||
        typeof item.fecha !== 'string'
      ) {
        throw new AccountActivityError('INVALID_RESPONSE', INVALID_RESPONSE);
      }
      return { tipo: item.tipo, resumen: item.resumen, fecha: item.fecha };
    })
    .sort((left, right) => {
      const leftTime = Date.parse(left.fecha);
      const rightTime = Date.parse(right.fecha);
      const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
      const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
      return safeRight - safeLeft;
    });
}

function getServerCode(body: unknown): string | undefined {
  return isRecord(body) && typeof body.code === 'string' ? body.code : undefined;
}

function getServerMessage(body: unknown): string | undefined {
  return isRecord(body) && typeof body.message === 'string' && body.message.trim()
    ? body.message
    : undefined;
}

function conflictMessage(serverCode?: string): string {
  if (serverCode === 'AVISO_NO_CONFIGURABLE') {
    return 'Los avisos de seguridad de la cuenta son obligatorios y no se pueden desactivar.';
  }
  if (serverCode === 'DESCARGA_NO_LISTA') {
    return 'La exportación aún no está lista para descargar.';
  }
  return 'La operación no se puede completar en el estado actual.';
}

function notFoundMessage(serverCode?: string): string {
  if (serverCode === 'DESCARGA_NO_ENCONTRADA') {
    return 'La exportación ya no está disponible.';
  }
  return 'El recurso solicitado ya no está disponible.';
}

function mapApiError(error: unknown, fallback: string): AccountActivityError {
  if (error instanceof AccountActivityError) {
    return error;
  }
  if (error instanceof ApiError) {
    const serverCode = getServerCode(error.body);
    const serverMessage = getServerMessage(error.body);

    if (error.status === 401) {
      return new AccountActivityError(
        'SESSION_EXPIRED',
        'Tu sesión expiró. Inicia sesión de nuevo.',
        401,
        serverCode
      );
    }
    if (error.status === 403) {
      return new AccountActivityError(
        'FORBIDDEN',
        serverMessage ?? 'No tienes permiso para consultar esta sección.',
        403,
        serverCode,
        serverMessage
      );
    }
    if (error.status === 404) {
      return new AccountActivityError(
        'NOT_FOUND',
        notFoundMessage(serverCode),
        404,
        serverCode,
        serverMessage
      );
    }
    if (error.status === 409) {
      return new AccountActivityError(
        'CONFLICT',
        conflictMessage(serverCode),
        409,
        serverCode,
        serverMessage
      );
    }
    if (error.status === 400) {
      return new AccountActivityError(
        'VALIDATION',
        serverMessage ?? 'Revisa los datos ingresados e intenta de nuevo.',
        400,
        serverCode,
        serverMessage
      );
    }
    return new AccountActivityError('UNKNOWN', fallback, error.status, serverCode, serverMessage);
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return new AccountActivityError('NETWORK', 'La solicitud tardó demasiado. Intenta de nuevo.');
  }
  return new AccountActivityError(
    'NETWORK',
    'No se pudo conectar con ALIADO. Revisa tu conexión e intenta de nuevo.'
  );
}

export class HttpAccountActivityGateway implements AccountActivityGateway {
  private readonly baseUrl?: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl;
  }

  private requireBaseUrl(): string {
    if (!this.baseUrl) {
      throw new AccountActivityError(
        'CONFIGURATION',
        'La URL de la API no está configurada en este entorno.'
      );
    }
    return this.baseUrl;
  }

  async getPreferences(token: string): Promise<NotificationPreference[]> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        '/api/v1/preferencias/notificaciones',
        { method: 'GET', token }
      );
      return parsePreferences(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar tus preferencias de notificación.');
    }
  }

  async updatePreference(
    token: string,
    input: UpdateNotificationPreferenceInput
  ): Promise<NotificationPreference> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        '/api/v1/preferencias/notificaciones',
        {
          method: 'PUT',
          token,
          body: {
            tipoAviso: input.tipoAviso,
            canal: input.canal,
            habilitada: input.habilitada,
          },
        }
      );
      return parsePreference(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible actualizar la preferencia.');
    }
  }

  async getHistory(
    token: string,
    page: number,
    size: number
  ): Promise<WorkHistoryItem[]> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        `/api/v1/historial?pagina=${page}&tamano=${size}`,
        { method: 'GET', token }
      );
      return parseHistory(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar el historial de trabajos.');
    }
  }

  async createHistoryExport(token: string): Promise<HistoryExport> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        '/api/v1/historial/exportaciones',
        { method: 'POST', token }
      );
      return parseHistoryExport(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible generar la exportación del historial.');
    }
  }

  async downloadHistoryExport(token: string, exportId: string): Promise<string> {
    try {
      return await requestText(
        this.requireBaseUrl(),
        `/api/v1/historial/exportaciones/${encodeURIComponent(exportId)}`,
        { method: 'GET', token }
      );
    } catch (error) {
      throw mapApiError(error, 'No fue posible descargar la exportación del historial.');
    }
  }

  async getProviderIndicators(token: string): Promise<ProviderIndicators> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        '/api/v1/prestadores/mis-indicadores',
        { method: 'GET', token }
      );
      return parseIndicators(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar tus indicadores.');
    }
  }

  async getRecentActivity(token: string): Promise<RecentActivityItem[]> {
    try {
      const response = await requestJson<unknown>(
        this.requireBaseUrl(),
        '/api/v1/actividad-reciente',
        { method: 'GET', token }
      );
      return parseRecentActivity(response);
    } catch (error) {
      throw mapApiError(error, 'No fue posible cargar tu actividad reciente.');
    }
  }
}
