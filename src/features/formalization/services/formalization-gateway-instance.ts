import { appEnv } from '../../../shared/config/env';
import { HttpFormalizationGateway } from './http-formalization-gateway';
import type { FormalizationGateway } from './formalization-gateway';

export const formalizationGateway: FormalizationGateway = new HttpFormalizationGateway(
  appEnv.apiBaseUrl
);
