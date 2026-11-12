const PHONE_PATTERN = /^[+0-9 ()-]{7,30}$/;

export interface ProfileEditFormValues {
  nombre: string;
  telefono: string;
}

export interface LocationFormValues {
  zonaAproximada: string;
  direccionExacta: string;
}

export type ProfileEditFieldErrors = Partial<Record<'nombre' | 'telefono', string>>;
export type LocationFieldErrors = Partial<Record<'zonaAproximada' | 'direccionExacta', string>>;

export function validateProfileEdit(values: ProfileEditFormValues): ProfileEditFieldErrors {
  const errors: ProfileEditFieldErrors = {};
  const nombre = values.nombre.trim();
  const telefono = values.telefono.trim();

  if (nombre.length > 120) {
    errors.nombre = 'El nombre admite máximo 120 caracteres.';
  }

  if (telefono && !PHONE_PATTERN.test(telefono)) {
    errors.telefono = 'Usa entre 7 y 30 caracteres: números, espacios, +, paréntesis o guiones.';
  }

  return errors;
}

export function validateLocation(values: LocationFormValues): LocationFieldErrors {
  const errors: LocationFieldErrors = {};
  const zona = values.zonaAproximada.trim();
  const direccion = values.direccionExacta.trim();

  if (!zona) {
    errors.zonaAproximada = 'Ingresa tu zona aproximada.';
  } else if (zona.length > 100) {
    errors.zonaAproximada = 'La zona admite máximo 100 caracteres.';
  }

  if (direccion.length > 500) {
    errors.direccionExacta = 'La dirección exacta admite máximo 500 caracteres.';
  }

  return errors;
}

export function hasFieldErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
