export type AuthRole = 'CLIENTE' | 'PRESTADOR';

export interface AuthSession {
  token: string;
  role: AuthRole;
  email: string;
}

export interface RegisterAuthInput {
  email: string;
  password: string;
  role: AuthRole;
  acceptsTerms: boolean;
  termsVersion: string;
}

export interface RegistrationResult {
  id: string;
  email: string;
  role: AuthRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface PasswordRecoveryInput {
  email: string;
}

export interface PasswordRecoveryConfirmationInput {
  token: string;
  newPassword: string;
}

export type AuthErrorCode =
  | 'CONFIGURATION'
  | 'NETWORK'
  | 'VALIDATION'
  | 'EMAIL_TAKEN'
  | 'INVALID_CREDENTIALS'
  | 'SESSION_EXPIRED'
  | 'RECOVERY_TOKEN_INVALID'
  | 'UNKNOWN';

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly status?: number;

  constructor(code: AuthErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
  }
}

export function isAuthRole(value: unknown): value is AuthRole {
  return value === 'CLIENTE' || value === 'PRESTADOR';
}
