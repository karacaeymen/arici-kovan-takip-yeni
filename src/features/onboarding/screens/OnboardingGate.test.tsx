import { Text } from 'react-native';

import { createOnboardingView } from '@/test-utils/onboarding-mock';
import { renderWithProviders, screen } from '@/test-utils/render';

import { useOnboardingStep } from '../hooks/useOnboardingStep';

import { OnboardingGate } from './OnboardingGate';

jest.mock('../hooks/useOnboardingStep', () => ({ useOnboardingStep: jest.fn() }));
jest.mock('expo-router', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { Text: RNText } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Redirect: ({ href }: { href: string }) => createElement(RNText, null, `yönlendir:${href}`),
  };
});
const mockUseOnboardingStep = jest.mocked(useOnboardingStep);

const renderGate = () =>
  renderWithProviders(
    <OnboardingGate>
      <Text>sekmeler</Text>
    </OnboardingGate>,
  );

describe('OnboardingGate', () => {
  it('ilk açılış bittiyse sekmeleri gösterir', async () => {
    mockUseOnboardingStep.mockReturnValue(createOnboardingView({ step: 'done' }));
    await renderGate();
    expect(screen.getByText('sekmeler')).toBeOnTheScreen();
  });

  it('bitmediyse kaldığı adıma gönderir', async () => {
    mockUseOnboardingStep.mockReturnValue(createOnboardingView({ step: 'notifications' }));
    await renderGate();
    expect(screen.getByText('yönlendir:/onboarding/notifications')).toBeOnTheScreen();
    expect(screen.queryByText('sekmeler')).toBeNull();
  });

  it('karar verilemiyorsa bekleme göstergesi gösterir', async () => {
    mockUseOnboardingStep.mockReturnValue(createOnboardingView({ step: 'loading' }));
    await renderGate();
    expect(screen.getByLabelText('Yükleniyor…')).toBeOnTheScreen();
  });
});
