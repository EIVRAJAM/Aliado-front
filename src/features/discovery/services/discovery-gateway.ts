import type {
  DiscoveryCatalogs,
  ProviderSearchResult,
  PublicProvider,
} from '../types/discovery';

export interface DiscoveryGateway {
  getCatalogs(token: string): Promise<DiscoveryCatalogs>;
  search(token: string, categoriaId: string, zonaId: string): Promise<ProviderSearchResult>;
  getProvider(token: string, providerId: string): Promise<PublicProvider>;
}
