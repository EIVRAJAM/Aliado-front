import type { AppNotification } from '../types/notification';

export interface NotificationGateway {
  listMine(token: string): Promise<AppNotification[]>;
}
