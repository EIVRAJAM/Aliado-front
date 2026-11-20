import { isServiceState, type ServiceState } from '../../services/types/service';

export type NotificationPreferenceType =
  | 'NUEVA_OPORTUNIDAD'
  | 'PROPUESTA_RECIBIDA'
  | 'ACEPTACION_PROPUESTA'
  | 'CAMBIO_ESTADO_SERVICIO'
  | 'AVISO_SEGURIDAD_CUENTA';

export type NotificationChannel = 'PUSH' | 'EMAIL';

export interface NotificationPreference {
  tipoAviso: NotificationPreferenceType;
  canal: NotificationChannel;
  habilitada: boolean;
  configurable: boolean;
}

export interface UpdateNotificationPreferenceInput {
  tipoAviso: NotificationPreferenceType;
  canal: NotificationChannel;
  habilitada: boolean;
}

export interface WorkHistoryItem {
  id: string;
  estado: ServiceState;
  fechaContratacion: string;
}

export type HistoryExportState = 'GENERANDO' | 'LISTA' | 'FALLIDA';

export interface HistoryExport {
  id: string;
  archivoKey: string;
  estado: HistoryExportState;
}

export interface ProviderIndicators {
  totalServicios: number;
  enCurso: number;
  finalizados: number;
  reputacion: number;
  cantidadCalificaciones: number;
}

export interface RecentActivityItem {
  tipo: string;
  resumen: string;
  fecha: string;
}

export type AccountActivityErrorCode =
  | 'CONFIGURATION'
  | 'NETWORK'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'SESSION_EXPIRED'
  | 'INVALID_RESPONSE'
  | 'UNKNOWN';

export class AccountActivityError extends Error {
  readonly code: AccountActivityErrorCode;
  readonly status?: number;
  readonly serverCode?: string;
  readonly serverMessage?: string;

  constructor(
    code: AccountActivityErrorCode,
    message: string,
    status?: number,
    serverCode?: string,
    serverMessage?: string
  ) {
    super(message);
    this.name = 'AccountActivityError';
    this.code = code;
    this.status = status;
    this.serverCode = serverCode;
    this.serverMessage = serverMessage;
  }
}

export function isNotificationPreferenceType(
  value: unknown
): value is NotificationPreferenceType {
  return (
    value === 'NUEVA_OPORTUNIDAD' ||
    value === 'PROPUESTA_RECIBIDA' ||
    value === 'ACEPTACION_PROPUESTA' ||
    value === 'CAMBIO_ESTADO_SERVICIO' ||
    value === 'AVISO_SEGURIDAD_CUENTA'
  );
}

export function isNotificationChannel(value: unknown): value is NotificationChannel {
  return value === 'PUSH' || value === 'EMAIL';
}

export function isHistoryExportState(value: unknown): value is HistoryExportState {
  return value === 'GENERANDO' || value === 'LISTA' || value === 'FALLIDA';
}

export function isWorkHistoryItem(value: unknown): value is WorkHistoryItem {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    isServiceState(item.estado) &&
    typeof item.fechaContratacion === 'string'
  );
}

export function isMandatoryPreferenceError(error: unknown): boolean {
  return (
    error instanceof AccountActivityError &&
    error.code === 'CONFLICT' &&
    error.serverCode === 'AVISO_NO_CONFIGURABLE'
  );
}

export function isExportNotReadyError(error: unknown): boolean {
  return (
    error instanceof AccountActivityError &&
    error.code === 'CONFLICT' &&
    error.serverCode === 'DESCARGA_NO_LISTA'
  );
}

export function isExportNotFoundError(error: unknown): boolean {
  return (
    error instanceof AccountActivityError &&
    error.code === 'NOT_FOUND' &&
    error.serverCode === 'DESCARGA_NO_ENCONTRADA'
  );
}
