import { appEnv } from '../../../shared/config/env';
import { HttpServiceGateway } from './http-service-gateway';
import type { ServiceGateway } from './service-gateway';

export const serviceGateway: ServiceGateway = new HttpServiceGateway(appEnv.apiBaseUrl);
