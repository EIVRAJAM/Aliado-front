import { appEnv } from '../../../shared/config/env';
import { HttpReportGateway } from './http-report-gateway';

export const reportGateway = new HttpReportGateway(appEnv.apiBaseUrl);
