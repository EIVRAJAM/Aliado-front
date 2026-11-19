import { appEnv } from '../../../shared/config/env';
import { HttpNotificationGateway } from './http-notification-gateway';

export const notificationGateway = new HttpNotificationGateway(appEnv.apiBaseUrl);
