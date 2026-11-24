import type {
  AgendaCommitment,
  CreateProfessionalProfileInput,
  CreatedProfessionalProfile,
  OwnProfessionalProfile,
  ProfessionalCatalogs,
  ProfessionalPreview,
} from '../types/professional-profile';

export interface ProfessionalProfileGateway {
  getCatalogs(token: string): Promise<ProfessionalCatalogs>;
  getOwnProfile(token: string): Promise<OwnProfessionalProfile>;
  getPreview(token: string): Promise<ProfessionalPreview>;
  getAgenda(token: string): Promise<AgendaCommitment[]>;
  createProfile(
    token: string,
    input: CreateProfessionalProfileInput
  ): Promise<CreatedProfessionalProfile>;
  updateDescription(token: string, descripcion: string | null): Promise<OwnProfessionalProfile>;
}
