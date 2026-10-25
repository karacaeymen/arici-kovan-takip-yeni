import { Stack, type ErrorBoundaryProps } from 'expo-router';

import { ErrorBoundary as ErrorScreen } from '@/components/ui/ErrorBoundary/ErrorBoundary';
import { reportScreenError } from '@/lib/observability/report';

const onError = reportScreenError('auth');
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorScreen {...props} onError={onError} />;
}

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
