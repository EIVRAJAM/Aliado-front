import type { NavigatorScreenParams } from '@react-navigation/native';

import type { ProposalOpportunityContext } from '../features/proposals/types/proposal';

export type MainTabParamList = {
  Home: undefined;
  Discovery: undefined;
  Requests: undefined;
  Opportunities: undefined;
  ProfessionalProfile: undefined;
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
  ProfessionalProfileCreate: undefined;
  Formalization: undefined;
  OpportunityDetail: { solicitudId: string };
  ProposalFlow: { solicitudId: string; opportunity?: ProposalOpportunityContext };
  ReceivedProposals: { solicitudId: string };
  MyRatings: undefined;
  ServiceDetail: { servicioId: string };
  Notifications: undefined;
  RequestForm: { requestId?: string } | undefined;
  RequestDetail: { requestId: string };
};
