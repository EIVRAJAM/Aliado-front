import type { AuthRole } from '../types/auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UNICODE_LETTER = /\p{L}/u;
const UNICODE_DECIMAL_DIGIT = /\p{Nd}/u;

export const PASSWORD_POLICY_HINT =
  'Mínimo 8 caracteres, con al menos una letra y un dígito.';

export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  email: string;
  password: string;
  role: AuthRole | null;
  acceptsTerms: boolean;
  termsVersion?: string;
}

export interface PasswordRecoveryFormValues {
  email: string;
}

export interface PasswordResetFormValues {
  token: string;
  newPassword: string;
}

export type LoginFieldErrors = Partial<Record<keyof LoginFormValues, string>>;
export type RegisterFieldErrors = Partial<
  Record<'email' | 'password' | 'role' | 'acceptsTerms' | 'termsVersion', string>
>;
export type PasswordRecoveryFieldErrors = Partial<Record<keyof PasswordRecoveryFormValues, string>>;
export type PasswordResetFieldErrors = Partial<Record<keyof PasswordResetFormValues, string>>;

export function validateEmail(value: string, errors: { email?: string }): void {
  const email = value.trim();
  if (!email) {
    errors.email = 'Ingresa tu correo electrónico.';
    return;
  }
  if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }
}

export function validatePassword(value: string, errors: { password?: string }): void {
  if (!value) {
    errors.password = 'Ingresa tu contraseña.';
  }
}

function getNewPasswordError(value: string): string | undefined {
  if (!value) {
    return 'Ingresa una contraseña.';
  }
  if (value.length < 8 || !UNICODE_LETTER.test(value) || !UNICODE_DECIMAL_DIGIT.test(value)) {
    return PASSWORD_POLICY_HINT;
  }
  return undefined;
}

export function validateLogin(values: LoginFormValues): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  validateEmail(values.email, errors);
  validatePassword(values.password, errors);
  return errors;
}

export function validateRegistration(values: RegisterFormValues): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};
  validateEmail(values.email, errors);
  const passwordError = getNewPasswordError(values.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  if (!values.role) {
    errors.role = 'Selecciona cómo usarás ALIADO.';
  }

  if (!values.acceptsTerms) {
    errors.acceptsTerms = 'Debes aceptar los términos y el tratamiento de datos.';
  }

  if (!values.termsVersion) {
    errors.termsVersion =
      'La versión de términos no está configurada. El registro no puede completarse en este entorno.';
  }

  return errors;
}

export function validatePasswordRecovery(values: PasswordRecoveryFormValues): PasswordRecoveryFieldErrors {
  const errors: PasswordRecoveryFieldErrors = {};
  validateEmail(values.email, errors);
  return errors;
}

export function validatePasswordReset(values: PasswordResetFormValues): PasswordResetFieldErrors {
  const errors: PasswordResetFieldErrors = {};

  if (!values.token.trim()) {
    errors.token = 'Ingresa el código de recuperación.';
  }

  const passwordError = getNewPasswordError(values.newPassword);
  if (passwordError) {
    errors.newPassword = passwordError;
  }

  return errors;
}

export function hasFieldErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
