import type { NotificationType } from '../types/notification';

const TYPE_LABELS: Record<NotificationType, string> = {
  NUEVA_OPORTUNIDAD: 'Nueva oportunidad',
  PROPUESTA_RECIBIDA: 'Propuesta recibida',
  ACEPTACION_PROPUESTA: 'Propuesta aceptada',
  CAMBIO_ESTADO_SERVICIO: 'Cambio de estado',
  AVISO_SEGURIDAD_CUENTA: 'Aviso de seguridad',
};

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function notificationTypeLabel(type: NotificationType): string {
  return TYPE_LABELS[type];
}

export function formatNotificationDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${String(date.getDate()).padStart(2, '0')} ${
    MONTHS[date.getMonth()]
  } ${date.getFullYear()} · ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
}
