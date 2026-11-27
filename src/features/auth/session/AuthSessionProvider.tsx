import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import type { AuthGateway } from '../services/auth-gateway';
import { AuthError, type AuthSession, type LoginInput } from '../types/auth';

interface AuthSessionContextValue {
  gateway: AuthGateway;
  session: AuthSession | null;
  isSigningOut: boolean;
  signIn: (input: LoginInput) => Promise<void>;
  signOut: () => Promise<void>;
  clearSession: () => void;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

interface AuthSessionProviderProps extends PropsWithChildren {
  gateway: AuthGateway;
  retireInstallation?: (session: AuthSession) => Promise<void>;
}

export function AuthSessionProvider({ gateway, retireInstallation, children }: AuthSessionProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signIn = useCallback(
    async (input: LoginInput) => {
      const nextSession = await gateway.login(input);
      setSession(nextSession);
    },
    [gateway]
  );

  const signOut = useCallback(async () => {
    if (!session) {
      return;
    }

    setIsSigningOut(true);
    try {
      await retireInstallation?.(session);
      await gateway.logout(session.token);
      setSession(null);
    } catch (error) {
      if (error instanceof AuthError && (error.code === 'SESSION_EXPIRED'
        || (retireInstallation && session.role === 'PRESTADOR' && error.code === 'NETWORK'))) {
        setSession(null);
        return;
      }
      throw error;
    } finally {
      setIsSigningOut(false);
    }
  }, [gateway, retireInstallation, session]);

  const clearSession = useCallback(() => {
    setSession(null);
    if (session && retireInstallation) void retireInstallation(session).catch(() => undefined);
  }, [retireInstallation, session]);

  const value = useMemo(
    () => ({
      gateway,
      session,
      isSigningOut,
      signIn,
      signOut,
      clearSession,
    }),
    [clearSession, gateway, isSigningOut, session, signIn, signOut]
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession(): AuthSessionContextValue {
  const value = useContext(AuthSessionContext);
  if (!value) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }
  return value;
}
