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
import { OpportunityDetailScreen } from '../features/opportunities';
import { NotificationsScreen } from '../features/notifications';
import { MyRatingsScreen } from '../features/trust';
import { ProposalFlowScreen, ReceivedProposalsScreen } from '../features/proposals';
import { ServiceDetailScreen } from '../features/services';
import {
  NotificationPreferencesScreen,
  WorkHistoryScreen,
} from '../features/account-activity';
import { FormalizationScreen } from '../features/formalization';
import { ProfessionalAvailabilityScreen, ProfessionalProfileCreateScreen, ProfessionalProfileScreen } from '../features/professional-profile';
import { RequestDetailScreen, RequestFormScreen } from '../features/requests';
import { colors } from '../shared/ui/theme';
import { DeepLinkHandler } from './DeepLinkHandler';
import { MainTabs } from './MainTabs';
import { linking, navigationRef } from './deep-links';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export interface RootNavigatorProps {
  initialAuthRoute?: 'Login' | 'Register';
}

export function RootNavigator({ initialAuthRoute = 'Login' }: RootNavigatorProps) {
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
        initialRouteName={session ? 'MainTabs' : initialAuthRoute}
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
            <Stack.Screen name="ProfessionalProfile" component={ProfessionalProfileScreen} />
            <Stack.Screen
              name="ProfessionalProfileCreate"
              component={ProfessionalProfileCreateScreen}
            />
            {session.role === 'PRESTADOR' ? <Stack.Screen name="ProfessionalAvailability" component={ProfessionalAvailabilityScreen} /> : null}
            {session.role === 'CLIENTE' ? (
              <>
                <Stack.Screen name="ReceivedProposals" component={ReceivedProposalsScreen} />
                <Stack.Screen name="MyRatings" component={MyRatingsScreen} />
              </>
            ) : null}
            <Stack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen
              name="NotificationPreferences"
              component={NotificationPreferencesScreen}
            />
            <Stack.Screen name="WorkHistory" component={WorkHistoryScreen} />
            {session.role === 'PRESTADOR' ? (
              <>
                <Stack.Screen
                  name="OpportunityDetail"
                  component={OpportunityDetailScreen}
                />
                <Stack.Screen name="ProposalFlow" component={ProposalFlowScreen} />
                <Stack.Screen name="Formalization" component={FormalizationScreen} />
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
