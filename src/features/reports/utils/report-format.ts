import type { ReportStatus } from '../types/report';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function reportStatusLabel(status: ReportStatus): string {
  switch (status) {
    case 'PENDIENTE':
      return 'Pendiente de revisión';
    case 'EN_REVISION':
      return 'En revisión';
    case 'RESUELTO':
      return 'Resuelto';
    case 'DESCARTADO':
      return 'Descartado';
    default:
      return 'Estado no disponible';
  }
}

export function formatReportDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${String(date.getDate()).padStart(2, '0')} ${
    MONTHS[date.getMonth()]
  } ${date.getFullYear()} · ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
}

export function formatEvidenceSize(size?: number): string | null {
  if (size === undefined || !Number.isFinite(size) || size < 0) {
    return null;
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
