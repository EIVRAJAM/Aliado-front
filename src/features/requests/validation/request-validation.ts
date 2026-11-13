import type { RequestUrgency } from '../types/request';

export interface RequestFormValues {
  categoriaId: string | null;
  descripcion: string;
  zonaId: string | null;
  urgencia: RequestUrgency | null;
}

export type RequestFieldErrors = Partial<
  Record<'categoriaId' | 'descripcion' | 'zonaId' | 'urgencia', string>
>;

export function validateRequest(
  values: RequestFormValues,
  mode: 'draft' | 'publish'
): RequestFieldErrors {
  const errors: RequestFieldErrors = {};

  if (!values.categoriaId) {
    if (mode === 'publish') {
      errors.categoriaId = 'Selecciona una categoría.';
    }
  }

  if (!values.descripcion.trim() && mode === 'publish') {
    errors.descripcion = 'Describe el servicio que necesitas.';
  }

  if (!values.zonaId && mode === 'publish') {
    errors.zonaId = 'Selecciona una zona.';
  }

  if (!values.urgencia && mode === 'publish') {
    errors.urgencia = 'Selecciona el nivel de urgencia.';
  }

  return errors;
}

export function hasFieldErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
