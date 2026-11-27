import { useEffect, useState, type ReactNode } from 'react';

import { useAuthSession } from '../auth';
import { OnboardingScreen } from './OnboardingScreen';
import { OnboardingWelcomeScreen } from './OnboardingWelcomeScreen';

type EntryRoute = 'Login' | 'Register';
type EntryStep = 'ONBOARDING' | 'WELCOME' | EntryRoute;

interface OnboardingGateProps {
  children: (initialAuthRoute: EntryRoute, rootKey: string) => ReactNode;
}

export function OnboardingGate({ children }: OnboardingGateProps) {
  const { session } = useAuthSession();
  const [step, setStep] = useState<EntryStep>('ONBOARDING');

  useEffect(() => {
    if (session) {
      setStep('Login');
    }
  }, [session]);

  if (session) {
    return <>{children('Login', 'authenticated')}</>;
  }

  if (step === 'ONBOARDING') {
    return (
      <OnboardingScreen
        onSkip={() => setStep('WELCOME')}
        onLogin={() => setStep('Login')}
        onRegister={() => setStep('Register')}
      />
    );
  }

  if (step === 'WELCOME') {
    return (
      <OnboardingWelcomeScreen
        onLogin={() => setStep('Login')}
        onRegister={() => setStep('Register')}
      />
    );
  }

  return <>{children(step, `auth-${step}`)}</>;
}
