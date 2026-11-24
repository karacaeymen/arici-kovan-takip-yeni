import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ErrorBoundary as ErrorScreen } from '@/components/ui/ErrorBoundary/ErrorBoundary';
import { DatabaseGate } from '@/data/db/DatabaseGate';
import { reportScreenError } from '@/lib/observability/report';
import { initObservability, wrapRoot } from '@/lib/observability/sentry';
import { FontGate } from '@/theme/FontGate';

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
      <FontGate>
        <DatabaseGate>
          <Stack screenOptions={{ headerShown: false }} />
        </DatabaseGate>
      </FontGate>
    </>
  );
}

export default wrapRoot(RootLayout);
