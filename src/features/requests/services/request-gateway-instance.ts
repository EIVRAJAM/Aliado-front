import { appEnv } from '../../../shared/config/env';
import { HttpRequestGateway } from './http-request-gateway';
import type { RequestGateway } from './request-gateway';

export const requestGateway: RequestGateway = new HttpRequestGateway(appEnv.apiBaseUrl);
