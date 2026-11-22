import type { OnboardingView } from '../features/onboarding/hooks/useOnboardingStep';

// İlk açılış ekranı testleri (T1.8) için `useOnboardingStep` sonucunun sahtesi.

export function createOnboardingView(overrides: Partial<OnboardingView> = {}): OnboardingView {
  return {
    step: 'business-name',
    saving: false,
    error: null,
    clearError: jest.fn(),
    saveBusinessName: jest.fn(async () => true),
    saveFirstApiary: jest.fn(async () => true),
    allowNotifications: jest.fn(async () => true),
    skipNotifications: jest.fn(async () => true),
    ...overrides,
  };
}
