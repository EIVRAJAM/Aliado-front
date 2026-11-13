export type RootStackParamList = {
  Login: { notice?: string } | undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string } | undefined;
  Session: undefined;
  Profile: undefined;
  ProfileEdit: undefined;
  ProfileLocation: undefined;
  ProfilePrivacy: undefined;
  ProfilePublicPreview: { userId: string };
  ProfileDelete: undefined;
  Requests: undefined;
  RequestForm: { requestId?: string } | undefined;
  RequestDetail: { requestId: string };
};
