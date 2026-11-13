import { appEnv } from '../../../shared/config/env';
import { HttpDiscoveryGateway } from './http-discovery-gateway';
import type { DiscoveryGateway } from './discovery-gateway';

export const discoveryGateway: DiscoveryGateway = new HttpDiscoveryGateway(appEnv.apiBaseUrl);
