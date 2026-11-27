import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '../shared/ui/ThemeProvider';
import { AuthSessionProvider, createAuthGateway } from '../features/auth';
import type { AuthSession } from '../features/auth/types/auth';
import { isPushEnabled } from '../features/notifications/services/push-gateway';
import { OnboardingGate } from '../features/onboarding';
import { RootNavigator } from '../navigation/RootNavigator';

const authGateway = createAuthGateway();

const retireInstallation = Platform.OS === 'android' && isPushEnabled()
  ? async (session: AuthSession) => {
      if (session.role !== 'PRESTADOR') return;
      const { retireAndroidPush } = await import('../features/notifications/services/android-push-device');
      await retireAndroidPush(session);
    }
  : undefined;

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthSessionProvider gateway={authGateway} retireInstallation={retireInstallation}>
          <OnboardingGate>
            {(initialAuthRoute, rootKey) => (
              <RootNavigator key={rootKey} initialAuthRoute={initialAuthRoute} />
            )}
          </OnboardingGate>
        </AuthSessionProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
