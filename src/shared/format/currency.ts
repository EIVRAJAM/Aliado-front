export const MAX_COP_AMOUNT = 2147483647;

export function formatCop(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'Sin tarifa';
  }
  const groups = Math.trunc(Math.abs(value))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return value < 0 ? `-$${groups}` : `$${groups}`;
}
