import { appEnv } from '../../../shared/config/env';
import { HttpProfessionalProfileGateway } from './http-professional-profile-gateway';
import type { ProfessionalProfileGateway } from './professional-profile-gateway';

export const professionalProfileGateway: ProfessionalProfileGateway =
  new HttpProfessionalProfileGateway(appEnv.apiBaseUrl);
