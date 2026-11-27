import { ProfileError, isDeletionState, type DeletionRequest } from '../types/profile';

export const DELETION_POLICY = 'DEFINITIVA_MVP_V1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseDeletionResponse(value: unknown): DeletionRequest {
  if (
    !isRecord(value) ||
    !isDeletionState(value.estado) ||
    typeof value.expiraEn !== 'string' ||
    value.politicaEliminacion !== DELETION_POLICY ||
    typeof value.archivosPendientes !== 'number' ||
    !Number.isInteger(value.archivosPendientes) ||
    value.archivosPendientes < 0
  ) {
    throw new ProfileError(
      'UNSUPPORTED',
      'El servidor no soporta la eliminación definitiva de esta versión. No se confirmó el borrado de la cuenta ni de sus archivos.'
    );
  }
  return {
    estado: value.estado,
    expiraEn: value.expiraEn,
    archivosPendientes: value.archivosPendientes,
  };
}
