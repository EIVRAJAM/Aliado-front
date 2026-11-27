export type NotificationType =
  | 'NUEVA_OPORTUNIDAD'
  | 'PROPUESTA_RECIBIDA'
  | 'ACEPTACION_PROPUESTA'
  | 'CAMBIO_ESTADO_SERVICIO'
  | 'AVISO_SEGURIDAD_CUENTA';

export interface AppNotification {
  id: string;
  tipo: NotificationType;
  servicioId: string | null;
  solicitudId: string | null;
  detalle: string;
  estadoEntrega: string;
  fechaGeneracion: string;
  leidaEn: string | null;
}

export type NotificationReadFilter = 'NO_LEIDA' | 'LEIDA' | 'TODAS';

export interface NotificationPage {
  items: AppNotification[];
  cursorSiguiente: string | null;
}

export type NotificationErrorCode =
  | 'CONFIGURATION'
  | 'NETWORK'
  | 'FORBIDDEN'
  | 'SESSION_EXPIRED'
  | 'INVALID_RESPONSE'
  | 'UNKNOWN';

export class NotificationError extends Error {
  readonly code: NotificationErrorCode;
  readonly status?: number;
  readonly serverCode?: string;

  constructor(
    code: NotificationErrorCode,
    message: string,
    status?: number,
    serverCode?: string
  ) {
    super(message);
    this.name = 'NotificationError';
    this.code = code;
    this.status = status;
    this.serverCode = serverCode;
  }
}

export function isNotificationType(value: unknown): value is NotificationType {
  return (
    value === 'NUEVA_OPORTUNIDAD' ||
    value === 'PROPUESTA_RECIBIDA' ||
    value === 'ACEPTACION_PROPUESTA' ||
    value === 'CAMBIO_ESTADO_SERVICIO' ||
    value === 'AVISO_SEGURIDAD_CUENTA'
  );
}
