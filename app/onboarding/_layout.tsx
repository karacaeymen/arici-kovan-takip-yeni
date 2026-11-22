import { Stack, type ErrorBoundaryProps } from 'expo-router';

import { ErrorBoundary as ErrorScreen } from '@/components/ui/ErrorBoundary/ErrorBoundary';
import { SessionGate } from '@/features/auth/screens/SessionGate';
import { reportScreenError } from '@/lib/observability/report';

const onError = reportScreenError('onboarding');
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorScreen {...props} onError={onError} />;
}

// İlk açılış adımları oturum ister (T1.7). Her ekran kendisi doğru adıma yönlendirir (T1.8).
export default function OnboardingLayout() {
  return (
    <SessionGate require="signedIn">
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false }} />
    </SessionGate>
  );
}
