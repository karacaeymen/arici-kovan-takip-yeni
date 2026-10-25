import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ErrorBoundary as ErrorScreen } from '@/components/ui/ErrorBoundary/ErrorBoundary';
import { reportScreenError } from '@/lib/observability/report';
import { initObservability, wrapRoot } from '@/lib/observability/sentry';

// Açılışta ayarlar doğrulanır (eksikse anlaşılır hata) ve hata izleme başlar (TODO.md T0.7).
initObservability();

const onError = reportScreenError('root');
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorScreen {...props} onError={onError} />;
}

function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default wrapRoot(RootLayout);
