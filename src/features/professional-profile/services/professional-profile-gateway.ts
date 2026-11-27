import type {
  AgendaCommitment,
  AvailabilityBlockInput,
  CommitmentInput,
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
  updateAvailability(token: string, bloques: AvailabilityBlockInput[]): Promise<OwnProfessionalProfile>;
  createCommitment(token: string, input: CommitmentInput): Promise<AgendaCommitment>;
  updateCommitment(token: string, commitmentId: string, input: CommitmentInput): Promise<AgendaCommitment>;
}
