import { appEnv } from '../../../shared/config/env';
import { HttpTrustGateway } from './http-trust-gateway';

export const trustGateway = new HttpTrustGateway(appEnv.apiBaseUrl);
