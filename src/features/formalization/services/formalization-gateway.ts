import type {
  FormalizationLink,
  FormalizationProgress,
  FormalizationRoute,
} from '../types/formalization';

export interface FormalizationGateway {
  getRoute(token: string): Promise<FormalizationRoute[]>;
  getProgress(token: string): Promise<FormalizationProgress[]>;
  getLink(token: string, linkId: string): Promise<FormalizationLink>;
}
