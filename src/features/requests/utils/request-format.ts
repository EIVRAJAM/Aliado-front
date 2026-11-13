import type {
  RequestCatalogs,
  RequestStatus,
  RequestUrgency,
  ServiceRequest,
} from '../types/request';

const STATUS_LABELS: Record<RequestStatus, string> = {
  BORRADOR: 'Borrador',
  PUBLICADA: 'Publicada',
  CANCELADA: 'Cancelada',
  CONTRATADA: 'Contratada',
};

const URGENCY_LABELS: Record<RequestUrgency, string> = {
  BAJA: 'Baja',
  MEDIA: 'Media',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

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

export function requestStatusLabel(status: RequestStatus): string {
  return STATUS_LABELS[status];
}

export function requestUrgencyLabel(urgency: RequestUrgency | null): string {
  return urgency ? URGENCY_LABELS[urgency] : 'Sin definir';
}

export function formatRequestDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function categoryName(catalogs: RequestCatalogs | null, id: string | null): string {
  if (!id) {
    return 'Sin categoría';
  }
  return catalogs?.categories.find((category) => category.id === id)?.nombre ?? 'Categoría';
}

export function zoneName(catalogs: RequestCatalogs | null, id: string | null): string {
  if (!id) {
    return 'Sin zona';
  }
  return catalogs?.zones.find((zone) => zone.id === id)?.nombre ?? 'Zona';
}

export function requestSummary(request: ServiceRequest): string {
  const description = request.descripcion?.trim();
  return description || 'Sin descripción';
}
