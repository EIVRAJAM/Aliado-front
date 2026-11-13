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
      : DAY_NAMES[block.diaSemana] ?? `Día ${block.diaSemana}`;
  return `${day} · ${block.horaInicio.slice(0, 5)} – ${block.horaFin.slice(0, 5)}`;
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
  return value.replaceAll('_', ' ').toLowerCase();
}

export function originLabel(value: string): string {
  if (value === 'MANUAL') {
    return 'Manual';
  }
  if (value === 'SISTEMA') {
    return 'Sistema';
  }
  return value;
}

export function ratingLabel(value: number, count: number): string {
  if (count === 0) {
    return 'Sin calificaciones';
  }
  return `${value.toFixed(1)} · ${count} ${count === 1 ? 'calificación' : 'calificaciones'}`;
}
