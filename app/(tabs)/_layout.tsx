import { Tabs, type ErrorBoundaryProps } from 'expo-router';

import { ErrorBoundary as ErrorScreen } from '@/components/ui/ErrorBoundary/ErrorBoundary';
import { SessionGate } from '@/features/auth/screens/SessionGate';
import { OnboardingGate } from '@/features/onboarding/screens/OnboardingGate';
import { tabOptions, tabsScreenOptions } from '@/features/settings/screens/TabsHeader';
import { reportScreenError } from '@/lib/observability/report';

const onError = reportScreenError('tabs');
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return <ErrorScreen {...props} onError={onError} />;
}

// Sekmeler oturum (T1.7) ve tamamlanmış ilk açılış (T1.8) ister. Başlıkta senkron şeridi var (T1.9).
export default function TabsLayout() {
  return (
    <SessionGate require="signedIn">
      <OnboardingGate>
        <Tabs screenOptions={tabsScreenOptions}>
          <Tabs.Screen name="index" options={tabOptions('index')} />
          <Tabs.Screen name="settings" options={tabOptions('settings')} />
        </Tabs>
      </OnboardingGate>
    </SessionGate>
  );
}
