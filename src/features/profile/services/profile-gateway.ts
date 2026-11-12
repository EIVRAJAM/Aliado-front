import type {
  DeletionRequest,
  PublicProfile,
  UpdateLocationInput,
  UpdateProfileInput,
  UserProfile,
  VisibilityPreference,
} from '../types/profile';

export interface ProfileGateway {
  getMyProfile(token: string): Promise<UserProfile>;
  updateMyProfile(token: string, input: UpdateProfileInput): Promise<UserProfile>;
  updateLocation(token: string, input: UpdateLocationInput): Promise<UserProfile>;
  updateVisibility(token: string, preference: VisibilityPreference): Promise<UserProfile>;
  getPublicProfile(userId: string): Promise<PublicProfile>;
  requestDeletion(token: string): Promise<DeletionRequest>;
  confirmDeletion(token: string): Promise<DeletionRequest>;
}
