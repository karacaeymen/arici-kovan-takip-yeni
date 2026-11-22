import { createOnboardingView } from '@/test-utils/onboarding-mock';
import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { useOnboardingStep } from '../hooks/useOnboardingStep';

import { NotificationPermissionScreen } from './NotificationPermissionScreen';

jest.mock('../hooks/useOnboardingStep', () => ({ useOnboardingStep: jest.fn() }));
jest.mock('expo-router', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Redirect: ({ href }: { href: string }) => createElement(Text, null, `yönlendir:${href}`),
  };
});
const mockUseOnboardingStep = jest.mocked(useOnboardingStep);

describe('NotificationPermissionScreen', () => {
  it('3. adımda izin ister ya da geçer', async () => {
    const view = createOnboardingView({ step: 'notifications' });
    mockUseOnboardingStep.mockReturnValue(view);
    await renderWithProviders(<NotificationPermissionScreen />);

    expect(screen.getByRole('progressbar', { name: 'Adım 3 / 3' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'İzin ver' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Şimdi değil' }));

    expect(view.allowNotifications).toHaveBeenCalledTimes(1);
    expect(view.skipNotifications).toHaveBeenCalledTimes(1);
  });

  it('hata olursa gösterir', async () => {
    mockUseOnboardingStep.mockReturnValue(
      createOnboardingView({ step: 'notifications', error: 'unknown' }),
    );
    await renderWithProviders(<NotificationPermissionScreen />);
    expect(screen.getByRole('alert')).toHaveTextContent('Kaydedilemedi. Tekrar dene.');
  });

  it('akış bitince ana sayfaya gider', async () => {
    mockUseOnboardingStep.mockReturnValue(createOnboardingView({ step: 'done' }));
    await renderWithProviders(<NotificationPermissionScreen />);
    expect(screen.getByText('yönlendir:/')).toBeOnTheScreen();
  });
});
