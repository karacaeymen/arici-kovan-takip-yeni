import { Tabs, type ErrorBoundaryProps } from 'expo-router';

import { ErrorBoundary as ErrorScreen } from '@/components/ui/ErrorBoundary/ErrorBoundary';
import { SessionGate } from '@/features/auth/screens/SessionGate';
import { reportScreenError } from '@/lib/observability/report';

const onError = reportScreenError('tabs');
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorScreen {...props} onError={onError} />;
}

// Sekmeler oturum ister; oturum yoksa giriş ekranına gidilir (T1.7).
// Sekme başlıkları T0.8'de i18n'e (tr.json) taşınacak.
export default function TabsLayout() {
  return (
    <SessionGate require="signedIn">
      <Tabs>
        <Tabs.Screen name="index" options={{ title: 'Ana Sayfa' }} />
      </Tabs>
    </SessionGate>
  );
}
