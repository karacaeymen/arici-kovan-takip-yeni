import { render, type RenderOptions } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Testlerde ekranlar uygulamadaki sağlayıcılarla (provider) sarılı render edilir.
// Tema ve i18n sağlayıcıları T0.8'de buraya eklenecek.
const TEST_SAFE_AREA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function TestProviders({ children }: { children: ReactNode }) {
  return <SafeAreaProvider initialMetrics={TEST_SAFE_AREA}>{children}</SafeAreaProvider>;
}

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: TestProviders, ...options });
}

export * from '@testing-library/react-native';
