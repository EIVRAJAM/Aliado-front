import type { ThemeColors } from '../../../shared/ui/theme';
import type { RequestStatus, RequestUrgency } from '../types/request';

export function requestStatusTone(
  status: RequestStatus,
  colors: ThemeColors
): { background: string; text: string; accent: string } {
  switch (status) {
    case 'BORRADOR':
      return {
        background: colors.neutralSurface,
        text: colors.neutral,
        accent: colors.neutral,
      };
    case 'PUBLICADA':
      return {
        background: colors.infoSurface,
        text: colors.info,
        accent: colors.info,
      };
    case 'CANCELADA':
      return {
        background: colors.dangerSurface,
        text: colors.danger,
        accent: colors.danger,
      };
    case 'CONTRATADA':
      return {
        background: colors.tealSurface,
        text: colors.teal,
        accent: colors.teal,
      };
  }
}

export function urgencyTone(
  urgency: RequestUrgency,
  colors: ThemeColors
): { background: string; text: string } {
  switch (urgency) {
    case 'BAJA':
      return { background: colors.neutralSurface, text: colors.neutral };
    case 'MEDIA':
      return { background: colors.infoSurface, text: colors.info };
    case 'ALTA':
      return { background: colors.warningSurface, text: colors.warning };
    case 'URGENTE':
      return { background: colors.dangerSurface, text: colors.danger };
  }
}
