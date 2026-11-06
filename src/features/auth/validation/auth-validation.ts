import type { AuthRole } from '../types/auth';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export function validateLogin(values: LoginFormValues): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  validateEmail(values.email, errors);
  validatePassword(values.password, errors);
  return errors;
}

export function validateRegistration(values: RegisterFormValues): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};
  validateEmail(values.email, errors);
  validatePassword(values.password, errors);

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

  if (!values.newPassword) {
    errors.newPassword = 'Ingresa la nueva contraseña.';
  }

  return errors;
}

export function hasFieldErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
