import { Stack, type ErrorBoundaryProps } from 'expo-router';

import { ErrorBoundary as ErrorScreen } from '@/components/ui/ErrorBoundary/ErrorBoundary';
import { SessionGate } from '@/features/auth/screens/SessionGate';
import { syncStatusTitle } from '@/features/settings/screens/SyncStatusScreen';
import { reportScreenError } from '@/lib/observability/report';

const onError = reportScreenError('settings');
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorScreen {...props} onError={onError} />;
}

// Ayarların alt sayfaları (sekmelerin dışında, geri düğmeli). Oturum ister (T1.7).
export default function SettingsLayout() {
  return (
    <SessionGate require="signedIn">
      <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
        <Stack.Screen name="sync-status" options={{ title: syncStatusTitle() }} />
      </Stack>
    </SessionGate>
  );
}
