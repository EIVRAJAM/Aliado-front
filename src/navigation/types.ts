import type { NavigatorScreenParams } from '@react-navigation/native';

import type { ProposalOpportunityContext } from '../features/proposals/types/proposal';

export type MainTabParamList = {
  Home: undefined;
  Discovery: undefined;
  Agenda: undefined;
  Activity: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Login: { notice?: string } | undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  ProviderProfile: { providerId: string };
  ProfileEdit: undefined;
  ProfileLocation: undefined;
  ProfilePrivacy: undefined;
  ProfilePublicPreview: { userId: string };
  ProfileDelete: undefined;
  ProfessionalProfile: undefined;
  ProfessionalProfileCreate: undefined;
  ProfessionalAvailability: undefined;
  Formalization: undefined;
  NotificationPreferences: undefined;
  WorkHistory: undefined;
  OpportunityDetail: { solicitudId: string };
  ProposalFlow: { solicitudId: string; opportunity?: ProposalOpportunityContext };
  ReceivedProposals: { solicitudId: string };
  MyRatings: undefined;
  ServiceDetail: { servicioId: string };
  Notifications: undefined;
  RequestForm: { requestId?: string } | undefined;
  RequestDetail: { requestId: string };
};
