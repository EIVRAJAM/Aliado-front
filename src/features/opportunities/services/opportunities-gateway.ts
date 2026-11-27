import type {
  Opportunity,
  OpportunityCategory,
  OpportunityFilters,
} from '../types/opportunity';

export interface OpportunitiesGateway {
  getCategories(token: string): Promise<OpportunityCategory[]>;
  list(token: string, filters: OpportunityFilters): Promise<Opportunity[]>;
  get(token: string, solicitudId: string): Promise<Opportunity>;
  photoUrl(solicitudId: string, fotoId: string): string;
}
