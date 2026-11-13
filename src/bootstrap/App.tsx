import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthSessionProvider, createAuthGateway } from '../features/auth';
import { RootNavigator } from '../navigation/RootNavigator';

const authGateway = createAuthGateway();

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthSessionProvider gateway={authGateway}>
        <RootNavigator />
      </AuthSessionProvider>
    </SafeAreaProvider>
  );
}
