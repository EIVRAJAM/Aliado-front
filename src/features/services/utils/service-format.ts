import { colors } from '../../../shared/ui/theme';
import type {
  ContractedService,
  ServiceState,
  ServiceTransitionAction,
} from '../types/service';

const STATE_LABELS: Record<ServiceState, string> = {
  CONTRATADO: 'Contratado',
  EN_EJECUCION: 'En ejecución',
  TERMINADO: 'Terminado',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

export const serviceStateTone: Record<
  ServiceState,
  { background: string; text: string; accent: string }
> = {
  CONTRATADO: { background: colors.infoSurface, text: colors.primary, accent: colors.primary },
  EN_EJECUCION: { background: colors.warningSurface, text: colors.warning, accent: colors.warning },
  TERMINADO: { background: colors.tealSurface, text: colors.teal, accent: colors.teal },
  FINALIZADO: { background: colors.successSurface, text: colors.success, accent: colors.success },
  CANCELADO: { background: colors.dangerSurface, text: colors.danger, accent: colors.danger },
};

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function serviceStateLabel(state: ServiceState): string {
  return STATE_LABELS[state];
}

export function urgencyLabel(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const labels: Record<string, string> = {
    BAJA: 'Baja',
    MEDIA: 'Media',
    ALTA: 'Alta',
    URGENTE: 'Urgente',
  };
  return labels[value] ?? value;
}

export function formatServiceDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatServiceDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${formatServiceDate(value)} · ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
}

export function actorRole(
  service: ContractedService,
  actorId: string
): 'Cliente' | 'Prestador' {
  return actorId === service.clienteId ? 'Cliente' : 'Prestador';
}

export function categoryName(
  categories: Array<{ id: string; nombre: string }>,
  id: string | null
): string {
  if (!id) {
    return 'Sin categoría';
  }
  return categories.find((category) => category.id === id)?.nombre ?? 'Categoría';
}

export function zoneName(
  zones: Array<{ id: string; nombre: string }>,
  id: string | null
): string {
  if (!id) {
    return 'Sin zona';
  }
  return zones.find((zone) => zone.id === id)?.nombre ?? 'Zona';
}

export function expectedStateForAction(
  action: ServiceTransitionAction
): ServiceState {
  switch (action) {
    case 'en-ejecucion':
      return 'EN_EJECUCION';
    case 'terminado':
      return 'TERMINADO';
    case 'confirmar-finalizacion':
      return 'FINALIZADO';
    case 'cancelar':
      return 'CANCELADO';
  }
}
