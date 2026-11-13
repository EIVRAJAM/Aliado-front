export const PUBLIC_PROFILE_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'descripcion', label: 'descripcion' },
  { key: 'resumen', label: 'resumen' },
  { key: 'experiencia', label: 'experiencia' },
  { key: 'anosExperiencia', label: 'anosExperiencia' },
  { key: 'aniosExperiencia', label: 'aniosExperiencia' },
  { key: 'especialidades', label: 'especialidades' },
  { key: 'servicios', label: 'servicios' },
  { key: 'habilidades', label: 'habilidades' },
  { key: 'formacion', label: 'formacion' },
  { key: 'educacion', label: 'educacion' },
  { key: 'certificaciones', label: 'certificaciones' },
  { key: 'idiomas', label: 'idiomas' },
  { key: 'sitioWeb', label: 'sitioWeb' },
];

export function formatPublicValue(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    const items = value.map((item) => item.trim()).filter(Boolean);
    return items.length > 0 ? items.join(', ') : null;
  }
  return null;
}
