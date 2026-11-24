export const PUBLIC_PROFILE_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'descripcion', label: 'Descripción profesional' },
];

export function formatPublicValue(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  return null;
}
