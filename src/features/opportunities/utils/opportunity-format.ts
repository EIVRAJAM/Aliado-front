import { colors } from '../../../shared/ui/theme';
import type { Opportunity, OpportunityUrgency } from '../types/opportunity';

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

const URGENCY_LABELS: Record<OpportunityUrgency, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

export const opportunityUrgencyTone: Record<
  OpportunityUrgency,
  { background: string; text: string; accent: string }
> = {
  BAJA: {
    background: colors.neutralSurface,
    text: colors.neutral,
    accent: colors.neutral,
  },
  MEDIA: {
    background: colors.infoSurface,
    text: colors.primary,
    accent: colors.primary,
  },
  ALTA: {
    background: colors.warningSurface,
    text: colors.warning,
    accent: colors.warning,
  },
  URGENTE: {
    background: colors.dangerSurface,
    text: colors.danger,
    accent: colors.danger,
  },
};

const neutralTone = {
  background: colors.neutralSurface,
  text: colors.neutral,
  accent: colors.border,
};

export function urgencyLabel(urgency: OpportunityUrgency | null): string {
  return urgency ? URGENCY_LABELS[urgency] : 'Sin indicar';
}

export function urgencyTone(urgency: OpportunityUrgency | null) {
  return urgency ? opportunityUrgencyTone[urgency] : neutralTone;
}

export function formatOpportunityDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${String(date.getDate()).padStart(2, '0')} ${
    MONTHS[date.getMonth()]
  } ${date.getFullYear()}`;
}

export function opportunitySummary(opportunity: Opportunity): string {
  const description = opportunity.descripcion?.trim();
  return description || 'Solicitud sin descripción';
}

export function photoCountLabel(count: number): string {
  if (count === 0) {
    return 'Sin fotos';
  }
  return `${count} ${count === 1 ? 'foto adjunta' : 'fotos adjuntas'}`;
}
