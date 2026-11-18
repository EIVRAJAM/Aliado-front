import { colors } from '../../../shared/ui/theme';
import type { ProposalState } from '../types/proposal';

export type ProposalVisualState = ProposalState | 'UNKNOWN';

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

const STATE_LABELS: Record<ProposalVisualState, string> = {
  ACTIVA: 'Activa',
  RETIRADA: 'Retirada',
  ACEPTADA: 'Aceptada',
  CERRADA: 'Cerrada',
  UNKNOWN: 'Estado no disponible',
};

export const proposalStateTone: Record<
  ProposalVisualState,
  { background: string; text: string }
> = {
  ACTIVA: { background: colors.successSurface, text: colors.success },
  RETIRADA: { background: colors.neutralSurface, text: colors.neutral },
  ACEPTADA: { background: colors.tealSurface, text: colors.teal },
  CERRADA: { background: colors.warningSurface, text: colors.warning },
  UNKNOWN: { background: colors.warningSurface, text: colors.warning },
};

export function proposalStateLabel(state: ProposalVisualState): string {
  return STATE_LABELS[state];
}

export function formatProposalReference(value: string): string {
  const reference = value.trim();
  if (!reference) {
    return 'Ref. no disponible';
  }
  if (reference.length <= 12) {
    return `Ref. ${reference}`;
  }
  return `Ref. ${reference.slice(0, 8)}…${reference.slice(-4)}`;
}

export function formatAvailabilityDate(date: Date): string {
  return `${String(date.getDate()).padStart(2, '0')} ${
    MONTHS[date.getMonth()]
  } ${date.getFullYear()}`;
}

export function formatAvailabilityTime(time: Date): string {
  return `${String(time.getHours()).padStart(2, '0')}:${String(
    time.getMinutes()
  ).padStart(2, '0')}`;
}

export function combineAvailability(date: Date, time: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.getHours(),
    time.getMinutes(),
    0,
    0
  );
}

export function formatProposalAvailability(date: Date, time: Date): string {
  return `${formatAvailabilityDate(date)}, ${formatAvailabilityTime(time)}`;
}

export function parseProposalAvailability(value: string): Date | null {
  const match = /^(\d{1,2})\s+([a-z]{3})\s+(\d{4}),?\s+(\d{1,2}):(\d{2})$/i.exec(
    value.trim()
  );
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = MONTHS.indexOf((match[2] ?? '').toLowerCase());
  const year = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  if (month < 0 || hour > 23 || minute > 59) {
    return null;
  }

  const parsed = new Date(year, month, day, hour, minute, 0, 0);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month ||
    parsed.getDate() !== day ||
    parsed.getHours() !== hour ||
    parsed.getMinutes() !== minute
  ) {
    return null;
  }
  return parsed;
}
