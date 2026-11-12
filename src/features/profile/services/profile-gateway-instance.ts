import { appEnv } from '../../../shared/config/env';
import { HttpProfileGateway } from './http-profile-gateway';
import type { ProfileGateway } from './profile-gateway';

export const profileGateway: ProfileGateway = new HttpProfileGateway(appEnv.apiBaseUrl);
