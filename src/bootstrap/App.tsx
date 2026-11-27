import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthSessionProvider, createAuthGateway } from '../features/auth';
import { OnboardingGate } from '../features/onboarding';
import { RootNavigator } from '../navigation/RootNavigator';

const authGateway = createAuthGateway();

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthSessionProvider gateway={authGateway}>
        <OnboardingGate>
          {(initialAuthRoute, rootKey) => (
            <RootNavigator key={rootKey} initialAuthRoute={initialAuthRoute} />
          )}
        </OnboardingGate>
      </AuthSessionProvider>
    </SafeAreaProvider>
  );
}
