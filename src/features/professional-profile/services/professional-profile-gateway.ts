import type {
  AgendaCommitment,
  CreateProfessionalProfileInput,
  CreatedProfessionalProfile,
  ProfessionalCatalogs,
  ProfessionalPreview,
} from '../types/professional-profile';

export interface ProfessionalProfileGateway {
  getCatalogs(token: string): Promise<ProfessionalCatalogs>;
  getPreview(token: string): Promise<ProfessionalPreview>;
  getAgenda(token: string): Promise<AgendaCommitment[]>;
  createProfile(
    token: string,
    input: CreateProfessionalProfileInput
  ): Promise<CreatedProfessionalProfile>;
}
