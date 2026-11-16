import type {
  Opportunity,
  OpportunityCategory,
  OpportunityFilters,
  OpportunityNotification,
} from '../types/opportunity';

export interface OpportunitiesGateway {
  getCategories(token: string): Promise<OpportunityCategory[]>;
  list(token: string, filters: OpportunityFilters): Promise<Opportunity[]>;
  get(token: string, solicitudId: string): Promise<Opportunity>;
  listNotifications(token: string): Promise<OpportunityNotification[]>;
}
