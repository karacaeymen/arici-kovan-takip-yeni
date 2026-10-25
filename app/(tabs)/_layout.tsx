import { Tabs, type ErrorBoundaryProps } from 'expo-router';

import { ErrorBoundary as ErrorScreen } from '@/components/ui/ErrorBoundary/ErrorBoundary';
import { reportScreenError } from '@/lib/observability/report';

const onError = reportScreenError('tabs');
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorScreen {...props} onError={onError} />;
}

// Sekme başlıkları T0.8'de i18n'e (tr.json) taşınacak.
export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Ana Sayfa' }} />
    </Tabs>
  );
}
