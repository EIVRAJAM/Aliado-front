import type { AvailabilityBlock, AgendaCommitment } from '../types/professional-profile';

const MONTHS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const WEEKDAY_OPTIONS = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
];

export const ANY_DAY_OPTION = { value: 0, label: 'Todos los días' };

export function formatAgendaDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${WEEKDAYS[date.getDay()]} ${String(date.getDate()).padStart(2, '0')} ${
    MONTHS[date.getMonth()]
  } ${date.getFullYear()}`;
}

export function formatAgendaTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(
    2,
    '0'
  )}`;
}

export function formatCommitmentTime(commitment: AgendaCommitment): string {
  const startDate = formatAgendaDate(commitment.fechaHoraInicio);
  const endDate = formatAgendaDate(commitment.fechaHoraFin);
  const start = formatAgendaTime(commitment.fechaHoraInicio);
  const end = formatAgendaTime(commitment.fechaHoraFin);
  return startDate === endDate ? `${startDate} · ${start} – ${end}` : `${startDate} ${start} – ${endDate} ${end}`;
}

export function formatAvailability(block: AvailabilityBlock): string {
  const day =
    block.diaSemana === null
      ? 'Todos los días'
      : DAY_NAMES[block.diaSemana] ?? 'Día no disponible';
  return `${day} · ${block.horaInicio.slice(0, 5)} – ${block.horaFin.slice(0, 5)}`;
}

export function formatClockTime(value: Date): string {
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

export function parseClockTime(value: string): Date {
  const [hour = '0', minute = '0'] = value.slice(0, 5).split(':');
  const date = new Date();
  date.setHours(Number(hour), Number(minute), 0, 0);
  return date;
}

export function toOffsetDateTime(value: Date): string {
  const pad = (part: number) => String(part).padStart(2, '0');
  const offsetMinutes = -value.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  const offset = `${sign}${pad(Math.floor(absoluteOffset / 60))}:${pad(absoluteOffset % 60)}`;
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:00${offset}`;
}

export function formatReviewDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function verificationLabel(value: string): string {
  if (value === 'SIN_VERIFICAR') {
    return 'Sin verificar';
  }
  if (value === 'BASICO') {
    return 'Verificación básica';
  }
  return 'Verificación no disponible';
}

export function originLabel(value: string): string {
  if (value === 'MANUAL') {
    return 'Manual';
  }
  if (value === 'SISTEMA') {
    return 'Sistema';
  }
  return 'Origen no disponible';
}

export function ratingLabel(value: number, count: number): string {
  if (count === 0) {
    return 'Sin calificaciones';
  }
  return `${value.toFixed(1)} · ${count} ${count === 1 ? 'calificación' : 'calificaciones'}`;
}
