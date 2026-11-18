import { useState } from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  ForgotPasswordScreen,
  LoginScreen,
  RegisterScreen,
  ResetPasswordScreen,
  useAuthSession,
} from '../features/auth';
import {
  ProfileDeleteScreen,
  ProfileEditScreen,
  ProfileLocationScreen,
  ProfilePrivacyScreen,
  ProfilePublicPreviewScreen,
} from '../features/profile';
import { ProviderProfileScreen } from '../features/discovery';
import {
  OpportunityDetailScreen,
  OpportunityNotificationsScreen,
} from '../features/opportunities';
import { ProposalFlowScreen, ReceivedProposalsScreen } from '../features/proposals';
import { ServiceDetailScreen, ServiceNotificationsScreen } from '../features/services';
import { ProfessionalProfileCreateScreen } from '../features/professional-profile';
import { RequestDetailScreen, RequestFormScreen } from '../features/requests';
import { colors } from '../shared/ui/theme';
import { DeepLinkHandler } from './DeepLinkHandler';
import { MainTabs } from './MainTabs';
import { linking, navigationRef } from './deep-links';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { session } = useAuthSession();
  const [navigationReady, setNavigationReady] = useState(false);

  return (
    <>
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        onReady={() => setNavigationReady(true)}
      >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {session ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="ProviderProfile" component={ProviderProfileScreen} />
            <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
            <Stack.Screen name="ProfileLocation" component={ProfileLocationScreen} />
            <Stack.Screen name="ProfilePrivacy" component={ProfilePrivacyScreen} />
            <Stack.Screen
              name="ProfilePublicPreview"
              component={ProfilePublicPreviewScreen}
            />
            <Stack.Screen name="ProfileDelete" component={ProfileDeleteScreen} />
            <Stack.Screen
              name="ProfessionalProfileCreate"
              component={ProfessionalProfileCreateScreen}
            />
            {session.role === 'CLIENTE' ? (
              <Stack.Screen name="ReceivedProposals" component={ReceivedProposalsScreen} />
            ) : null}
            <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
            <Stack.Screen name="ServiceNotifications" component={ServiceNotificationsScreen} />
            {session.role === 'PRESTADOR' ? (
              <>
                <Stack.Screen
                  name="OpportunityDetail"
                  component={OpportunityDetailScreen}
                />
                <Stack.Screen
                  name="OpportunityNotifications"
                  component={OpportunityNotificationsScreen}
                />
                <Stack.Screen name="ProposalFlow" component={ProposalFlowScreen} />
              </>
            ) : null}
            <Stack.Screen name="RequestForm" component={RequestFormScreen} />
            <Stack.Screen name="RequestDetail" component={RequestDetailScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
      </NavigationContainer>
      <DeepLinkHandler navigationReady={navigationReady} />
    </>
  );
}
