import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  ForgotPasswordScreen,
  LoginScreen,
  RegisterScreen,
  ResetPasswordScreen,
  SessionScreen,
  useAuthSession,
} from '../features/auth';
import {
  ProfileDeleteScreen,
  ProfileEditScreen,
  ProfileLocationScreen,
  ProfileOverviewScreen,
  ProfilePrivacyScreen,
  ProfilePublicPreviewScreen,
} from '../features/profile';
import {
  ProfessionalProfileCreateScreen,
  ProfessionalProfileScreen,
} from '../features/professional-profile';
import {
  RequestDetailScreen,
  RequestFormScreen,
  RequestListScreen,
} from '../features/requests';
import { colors } from '../shared/ui/theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { session } = useAuthSession();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {session ? (
          <>
            <Stack.Screen name="Session" component={SessionScreen} />
            <Stack.Screen name="Profile" component={ProfileOverviewScreen} />
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
            <Stack.Screen name="Requests" component={RequestListScreen} />
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
  );
}
