import { ApiError, requestJson } from '../../../shared/api/http-client';
import {
  NotificationError,
  isNotificationType,
  type AppNotification,
  type NotificationPage,
  type NotificationReadFilter,
} from '../types/notification';
import type { NotificationGateway } from './notification-gateway';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requiredString(value: unknown): string {
  if (typeof value !== 'string' || !value) {
    throw new NotificationError(
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
    throw new NotificationError(
      'INVALID_RESPONSE',
      'La respuesta del servidor no tiene el formato esperado.'
    );
  }
  return value;
}

function getServerCode(body: unknown): string | undefined {
  return isRecord(body) && typeof body.code === 'string' ? body.code : undefined;
}

function parseNotifications(value: unknown): AppNotification[] {
  if (!Array.isArray(value)) {
    throw new NotificationError(
      'INVALID_RESPONSE',
      'La respuesta del servidor no tiene el formato esperado.'
    );
  }

  return value.flatMap<AppNotification>((item) => {
    if (!isRecord(item) || !isNotificationType(item.tipo)) return [];
    return [{
      id: requiredString(item.id),
      tipo: item.tipo,
      servicioId: nullableString(item.servicioId),
      solicitudId: nullableString(item.solicitudId),
      detalle: requiredString(item.detalle),
      estadoEntrega: requiredString(item.estadoEntrega),
      fechaGeneracion: requiredString(item.fechaGeneracion),
      leidaEn: item.leidaEn === null ? null : requiredString(item.leidaEn),
    }];
  });
}

function mapApiError(error: unknown, fallback: string): NotificationError {
  if (error instanceof NotificationError) {
    return error;
  }
  if (error instanceof ApiError) {
    const code = getServerCode(error.body);
    if (error.status === 401) {
      return new NotificationError(
        'SESSION_EXPIRED',
        'Tu sesión expiró. Inicia sesión de nuevo.',
        401,
        code
      );
    }
    if (error.status === 403) {
      return new NotificationError(
        'FORBIDDEN',
        'No tienes permiso para consultar estas notificaciones.',
        403,
        code
      );
    }
    return new NotificationError('UNKNOWN', fallback, error.status, code);
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return new NotificationError(
      'NETWORK',
      'La solicitud tardó demasiado. Intenta de nuevo.'
    );
  }
  return new NotificationError(
    'NETWORK',
    'No se pudo conectar con ALIADO. Revisa tu conexión e intenta de nuevo.'
  );
}

export class HttpNotificationGateway implements NotificationGateway {
  private readonly baseUrl?: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl;
  }

  async listPage(token: string, filter: NotificationReadFilter, cursor?: string): Promise<NotificationPage> {
    const query = 'estadoLectura=' + encodeURIComponent(filter)
      + (cursor ? '&cursor=' + encodeURIComponent(cursor) : '');
    const response = await this.request(token, '/bandeja?' + query, 'GET');
    if (!isRecord(response)) {
      throw new NotificationError('INVALID_RESPONSE', 'La respuesta de la bandeja no es válida.');
    }
    return {
      items: parseNotifications(response.items),
      cursorSiguiente: response.cursorSiguiente === null ? null : requiredString(response.cursorSiguiente),
    };
  }

  async hasUnread(token: string): Promise<boolean> {
    const response = await this.request(token, '/resumen', 'GET');
    if (!isRecord(response) || typeof response.hayNoLeidas !== 'boolean') {
      throw new NotificationError('INVALID_RESPONSE', 'La respuesta de la campana no es válida.');
    }
    return response.hayNoLeidas;
  }

  async markAsRead(token: string, id: string): Promise<void> {
    await this.request(token, '/' + encodeURIComponent(id) + '/lectura', 'PUT');
  }

  async markAllAsRead(token: string): Promise<void> {
    await this.request(token, '/lectura', 'PUT');
  }

  private async request(token: string, path: string, method: 'GET' | 'PUT'): Promise<unknown> {
    if (!this.baseUrl) {
      throw new NotificationError('CONFIGURATION', 'La URL de la API no está configurada en este entorno.');
    }
    try {
      return await requestJson<unknown>(this.baseUrl, '/api/v1/notificaciones' + path, { method, token });
    } catch (error) {
      throw mapApiError(error, method === 'GET'
        ? 'No fue posible cargar las notificaciones.'
        : 'No fue posible guardar la lectura.');
    }
  }
}
