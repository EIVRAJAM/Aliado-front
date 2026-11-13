import { colors } from '../../../shared/ui/theme';
import type { RequestStatus, RequestUrgency } from '../types/request';

export const requestStatusTone: Record<
  RequestStatus,
  { background: string; text: string; accent: string }
> = {
  BORRADOR: {
    background: colors.neutralSurface,
    text: colors.neutral,
    accent: colors.neutral,
  },
  PUBLICADA: {
    background: colors.infoSurface,
    text: colors.primary,
    accent: colors.primary,
  },
  CANCELADA: {
    background: colors.dangerSurface,
    text: colors.danger,
    accent: colors.danger,
  },
  CONTRATADA: {
    background: colors.tealSurface,
    text: colors.teal,
    accent: colors.teal,
  },
};

export const urgencyTone: Record<RequestUrgency, { background: string; text: string }> = {
  BAJA: { background: colors.neutralSurface, text: colors.neutral },
  MEDIA: { background: colors.infoSurface, text: colors.primary },
  ALTA: { background: colors.warningSurface, text: colors.warning },
  URGENTE: { background: colors.dangerSurface, text: colors.danger },
};
