import type { VerificationStatus } from '../types/trust';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function formatHistoryDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${String(date.getDate()).padStart(2, '0')} ${
    MONTHS[date.getMonth()]
  } ${date.getFullYear()}`;
}

export function verificationStatusLabel(status: VerificationStatus): string {
  switch (status) {
    case 'PENDIENTE':
      return 'En revisión';
    case 'APROBADA':
      return 'Verificación básica aprobada';
    case 'RECHAZADA':
      return 'Solicitud rechazada';
  }
}

export function formatFileSize(size?: number): string | null {
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
