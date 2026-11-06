import type {
  AuthSession,
  LoginInput,
  PasswordRecoveryConfirmationInput,
  PasswordRecoveryInput,
  RegisterAuthInput,
  RegistrationResult,
} from '../types/auth';

export interface AuthGateway {
  register(input: RegisterAuthInput): Promise<RegistrationResult>;
  login(input: LoginInput): Promise<AuthSession>;
  logout(token: string): Promise<void>;
  requestPasswordRecovery(input: PasswordRecoveryInput): Promise<void>;
  confirmPasswordRecovery(input: PasswordRecoveryConfirmationInput): Promise<void>;
}
