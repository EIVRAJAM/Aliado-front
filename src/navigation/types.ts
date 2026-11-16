import type { NavigatorScreenParams } from '@react-navigation/native';

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
  OpportunityDetail: { solicitudId: string };
  OpportunityNotifications: undefined;
  RequestForm: { requestId?: string } | undefined;
  RequestDetail: { requestId: string };
};
