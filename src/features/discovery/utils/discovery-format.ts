import type { ProviderAvailabilityBlock, PublicProvider } from '../types/discovery';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
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

export function providerDisplayName(provider: PublicProvider): string {
  const category = provider.categorias[0]?.trim();
  if (!category) {
    return 'Prestador';
  }
  return provider.categorias.length > 1
    ? `Prestador de ${category} y más`
    : `Prestador de ${category}`;
}

export function formatAvailability(block: ProviderAvailabilityBlock): string {
  const day =
    block.diaSemana === null
      ? 'Todos los días'
      : DAY_NAMES[block.diaSemana] ?? 'Día no disponible';
  return `${day} · ${block.horaInicio.slice(0, 5)} – ${block.horaFin.slice(0, 5)}`;
}

export function formatReviewDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function ratingLabel(value: number, count: number): string {
  if (count === 0) {
    return 'Sin calificaciones';
  }
  return `${value.toFixed(1)} · ${count} ${count === 1 ? 'calificación' : 'calificaciones'}`;
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
