import type { VisibilityPreference } from '../types/profile';

const visibilityLabels: Record<VisibilityPreference, string> = {
  PUBLICO: 'Público',
  SOLO_ZONA: 'Solo zona',
  PRIVADO: 'Privado',
};

export function visibilityLabel(value: VisibilityPreference): string {
  return visibilityLabels[value];
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('es-CO');
}
