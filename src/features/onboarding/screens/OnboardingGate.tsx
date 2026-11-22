import type { ReactNode } from 'react';

import { StepRedirect } from '../components/StepRedirect';
import { useOnboardingStep } from '../hooks/useOnboardingStep';

// İlk açılış kapısı (TODO.md T1.8): `(tabs)` düzeni bununla sarılır. İlk açılış bitmediyse
// kullanıcı kaldığı adıma gönderilir; bittiyse sekmeler görünür.

export function OnboardingGate({ children }: { children: ReactNode }) {
  const { step } = useOnboardingStep();
  if (step !== 'done') return <StepRedirect step={step} />;
  return <>{children}</>;
}
