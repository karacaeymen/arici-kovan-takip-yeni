import { Stack, type ErrorBoundaryProps } from 'expo-router';

import { ErrorBoundary as ErrorScreen } from '@/components/ui/ErrorBoundary/ErrorBoundary';
import { SessionGate } from '@/features/auth/screens/SessionGate';
import { reportScreenError } from '@/lib/observability/report';

const onError = reportScreenError('auth');
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorScreen {...props} onError={onError} />;
}

// Oturum açıksa giriş ekranları gösterilmez, ana sayfaya gidilir (T1.7).
export default function AuthLayout() {
  return (
    <SessionGate require="signedOut">
      <Stack screenOptions={{ headerShown: false }} />
    </SessionGate>
  );
}
