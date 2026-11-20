import type {
  NotificationChannel,
  NotificationPreferenceType,
} from '../types/account-activity';

export const PREFERENCE_TYPE_ORDER: NotificationPreferenceType[] = [
  'NUEVA_OPORTUNIDAD',
  'PROPUESTA_RECIBIDA',
  'ACEPTACION_PROPUESTA',
  'CAMBIO_ESTADO_SERVICIO',
  'AVISO_SEGURIDAD_CUENTA',
];

const preferenceLabels: Record<NotificationPreferenceType, string> = {
  NUEVA_OPORTUNIDAD: 'Nuevas oportunidades',
  PROPUESTA_RECIBIDA: 'Propuestas recibidas',
  ACEPTACION_PROPUESTA: 'Propuestas aceptadas',
  CAMBIO_ESTADO_SERVICIO: 'Cambios de estado del servicio',
  AVISO_SEGURIDAD_CUENTA: 'Seguridad de la cuenta',
};

const channelLabels: Record<NotificationChannel, string> = {
  PUSH: 'Notificación push',
  EMAIL: 'Correo electrónico',
};

export function preferenceTypeLabel(type: NotificationPreferenceType): string {
  return preferenceLabels[type];
}

export function channelLabel(channel: NotificationChannel): string {
  return channelLabels[channel];
}

export function activityTypeLabel(type: string): string {
  if (type === 'SERVICIO') {
    return 'Servicio';
  }
  if (type === 'NOTIFICACION') {
    return 'Notificación';
  }
  return type;
}
