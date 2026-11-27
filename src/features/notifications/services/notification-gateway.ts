import type { NotificationPage, NotificationReadFilter } from '../types/notification';

export interface NotificationGateway {
  listPage(token: string, filter: NotificationReadFilter, cursor?: string): Promise<NotificationPage>;
  hasUnread(token: string): Promise<boolean>;
  markAsRead(token: string, id: string): Promise<void>;
  markAllAsRead(token: string): Promise<void>;
}
