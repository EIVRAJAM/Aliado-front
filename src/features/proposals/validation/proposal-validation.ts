import { combineAvailability } from '../utils/proposal-format';

export interface ProposalFormValues {
  date: Date | null;
  time: Date | null;
  mensaje: string;
}

export type ProposalFieldErrors = Partial<
  Record<'disponibilidad' | 'mensaje', string>
>;

export function validateProposal(
  values: ProposalFormValues,
  now: Date = new Date()
): ProposalFieldErrors {
  const errors: ProposalFieldErrors = {};

  if (!values.date) {
    errors.disponibilidad = 'Selecciona una fecha.';
  } else {
    const selectedDay = new Date(
      values.date.getFullYear(),
      values.date.getMonth(),
      values.date.getDate()
    );
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (selectedDay.getTime() < today.getTime()) {
      errors.disponibilidad = 'Selecciona una fecha de hoy en adelante.';
    }
  }

  if (!values.time) {
    errors.disponibilidad = errors.disponibilidad ?? 'Selecciona una hora.';
  } else if (values.date) {
    const selectedMoment = combineAvailability(values.date, values.time);
    if (selectedMoment.getTime() <= now.getTime()) {
      errors.disponibilidad = 'Selecciona una fecha y hora futuras.';
    }
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
