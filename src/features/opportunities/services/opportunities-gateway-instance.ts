import { appEnv } from '../../../shared/config/env';
import { HttpOpportunitiesGateway } from './http-opportunities-gateway';
import type { OpportunitiesGateway } from './opportunities-gateway';

export const opportunitiesGateway: OpportunitiesGateway = new HttpOpportunitiesGateway(
  appEnv.apiBaseUrl
);
