import type { ThemeColors } from '../../../shared/ui/theme';
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

type UrgencyTone = { background: string; text: string; accent: string };

export function opportunityUrgencyTone(
  urgency: OpportunityUrgency,
  colors: ThemeColors
): UrgencyTone {
  switch (urgency) {
    case 'BAJA':
      return {
        background: colors.neutralSurface,
        text: colors.neutral,
        accent: colors.neutral,
      };
    case 'MEDIA':
      return {
        background: colors.infoSurface,
        text: colors.info,
        accent: colors.info,
      };
    case 'ALTA':
      return {
        background: colors.warningSurface,
        text: colors.warning,
        accent: colors.warning,
      };
    case 'URGENTE':
      return {
        background: colors.dangerSurface,
        text: colors.danger,
        accent: colors.danger,
      };
  }
}

export function urgencyLabel(urgency: OpportunityUrgency | null): string {
  return urgency ? URGENCY_LABELS[urgency] : 'Sin indicar';
}

export function urgencyTone(
  urgency: OpportunityUrgency | null,
  colors: ThemeColors
): UrgencyTone {
  return urgency
    ? opportunityUrgencyTone(urgency, colors)
    : {
        background: colors.neutralSurface,
        text: colors.neutral,
        accent: colors.border,
      };
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

export function formatOpportunityReference(solicitudId: string): string {
  const value = solicitudId.trim();
  if (!value) {
    return 'Referencia no disponible';
  }
  if (value.length <= 12) {
    return `Referencia ${value}`;
  }
  return `Referencia ${value.slice(0, 8)}…${value.slice(-4)}`;
}
