import { colors } from '../../../shared/ui/theme';
import type { ProposalState } from '../types/proposal';

export type ProposalVisualState = ProposalState | 'UNKNOWN';

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
