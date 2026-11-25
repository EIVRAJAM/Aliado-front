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

const activityEventLabels: Record<string, string> = {
  NUEVA_OPORTUNIDAD: 'Nueva oportunidad',
  PROPUESTA_RECIBIDA: 'Propuesta recibida',
  ACEPTACION_PROPUESTA: 'Propuesta aceptada',
  CAMBIO_ESTADO_SERVICIO: 'Cambio de estado del servicio',
  AVISO_SEGURIDAD_CUENTA: 'Aviso de seguridad de la cuenta',
};

const serviceStateLabels: Record<string, string> = {
  CONTRATADO: 'contratado',
  EN_EJECUCION: 'en ejecución',
  TERMINADO: 'terminado',
  FINALIZADO: 'finalizado',
  CANCELADO: 'cancelado',
};

const EVENT_CODE_PREFIX = /^([A-Z][A-Z0-9_]*):\s*(.*)$/;
const EVENT_CODE_ONLY = /^[A-Z][A-Z0-9_]*$/;
const TECHNICAL_CODE = /\b[A-Z][A-Z0-9]*_[A-Z0-9_]+\b/g;

const NEUTRAL_ACTIVITY_SUMMARY = 'Evento de actividad';

function neutralizeTechnicalText(value: string): string {
  return value
    .replace(/\b(EN_EJECUCION|CONTRATADO|TERMINADO|FINALIZADO|CANCELADO)\b/g, (code) => serviceStateLabels[code] ?? code)
    .replace(/\ben_ejecucion\b/g, 'en ejecución')
    .replace(TECHNICAL_CODE, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function activitySummaryText(summary: string): string {
  const trimmed = summary.trim();
  if (!trimmed) {
    return NEUTRAL_ACTIVITY_SUMMARY;
  }

  if (EVENT_CODE_ONLY.test(trimmed)) {
    return activityEventLabels[trimmed] ?? NEUTRAL_ACTIVITY_SUMMARY;
  }

  const prefix = trimmed.match(EVENT_CODE_PREFIX);
  const eventCode = prefix?.[1];
  const body = (prefix?.[2] ?? trimmed).trim();
  const neutralFallback = eventCode ? activityEventLabels[eventCode] : undefined;

  if (!body) {
    return neutralFallback ?? NEUTRAL_ACTIVITY_SUMMARY;
  }

  const cleanBody = neutralizeTechnicalText(body);
  if (!cleanBody) {
    return neutralFallback ?? NEUTRAL_ACTIVITY_SUMMARY;
  }

  if (EVENT_CODE_ONLY.test(cleanBody)) {
    return activityEventLabels[cleanBody] ?? NEUTRAL_ACTIVITY_SUMMARY;
  }

  return cleanBody;
}
