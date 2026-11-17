export interface ProposalFormValues {
  disponibilidad: string;
  mensaje: string;
}

export type ProposalFieldErrors = Partial<
  Record<'disponibilidad' | 'mensaje', string>
>;

export function validateProposal(values: ProposalFormValues): ProposalFieldErrors {
  const errors: ProposalFieldErrors = {};
  const disponibilidad = values.disponibilidad.trim();

  if (!disponibilidad) {
    errors.disponibilidad = 'Indica tu disponibilidad para esta solicitud.';
  } else if (disponibilidad.length > 255) {
    errors.disponibilidad = 'La disponibilidad admite máximo 255 caracteres.';
  }

  if (values.mensaje.length > 1000) {
    errors.mensaje = 'El mensaje admite máximo 1000 caracteres.';
  }

  return errors;
}

export function hasProposalFieldErrors(
  errors: Record<string, string | undefined>
): boolean {
  return Object.values(errors).some(Boolean);
}
