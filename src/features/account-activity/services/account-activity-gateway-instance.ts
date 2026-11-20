import { appEnv } from '../../../shared/config/env';
import type { AccountActivityGateway } from './account-activity-gateway';
import { HttpAccountActivityGateway } from './http-account-activity-gateway';

export const accountActivityGateway: AccountActivityGateway = new HttpAccountActivityGateway(
  appEnv.apiBaseUrl
);
