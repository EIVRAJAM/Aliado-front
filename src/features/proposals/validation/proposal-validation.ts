import { MAX_COP_AMOUNT } from '../../../shared/format/currency';
import { combineAvailability } from '../utils/proposal-format';

export interface ProposalFormValues {
  date: Date | null;
  time: Date | null;
  mensaje: string;
  tarifaCop: string;
}

export type ProposalFieldErrors = Partial<
  Record<'disponibilidad' | 'mensaje' | 'tarifaCop', string>
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

  const tarifa = values.tarifaCop.trim();
  if (!tarifa) {
    errors.tarifaCop = 'Ingresa la tarifa en pesos colombianos.';
  } else if (!/^\d+$/.test(tarifa)) {
    errors.tarifaCop = 'Usa un entero positivo, sin decimales ni separadores.';
  } else {
    const amount = Number(tarifa);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      errors.tarifaCop = 'La tarifa debe ser mayor que cero.';
    } else if (amount > MAX_COP_AMOUNT) {
      errors.tarifaCop = 'La tarifa supera el máximo permitido.';
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
