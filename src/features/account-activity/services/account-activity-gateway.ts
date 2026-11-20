import type {
  HistoryExport,
  NotificationPreference,
  ProviderIndicators,
  RecentActivityItem,
  UpdateNotificationPreferenceInput,
  WorkHistoryItem,
} from '../types/account-activity';

export interface AccountActivityGateway {
  getPreferences(token: string): Promise<NotificationPreference[]>;
  updatePreference(
    token: string,
    input: UpdateNotificationPreferenceInput
  ): Promise<NotificationPreference>;
  getHistory(token: string, page: number, size: number): Promise<WorkHistoryItem[]>;
  createHistoryExport(token: string): Promise<HistoryExport>;
  downloadHistoryExport(token: string, exportId: string): Promise<string>;
  getProviderIndicators(token: string): Promise<ProviderIndicators>;
  getRecentActivity(token: string): Promise<RecentActivityItem[]>;
}
