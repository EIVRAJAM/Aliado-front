import { appEnv } from '../../../shared/config/env';
import type { AuthGateway } from './auth-gateway';
import { HttpAuthGateway } from './http-auth-gateway';

export function createAuthGateway(): AuthGateway {
  return new HttpAuthGateway(appEnv.apiBaseUrl);
}
