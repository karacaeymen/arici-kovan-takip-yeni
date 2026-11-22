import { createOnboardingView } from '@/test-utils/onboarding-mock';
import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { useOnboardingStep } from '../hooks/useOnboardingStep';

import { FirstApiaryScreen } from './FirstApiaryScreen';

jest.mock('../hooks/useOnboardingStep', () => ({ useOnboardingStep: jest.fn() }));
jest.mock('expo-router', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Redirect: ({ href }: { href: string }) => createElement(Text, null, `yönlendir:${href}`),
  };
});
const mockUseOnboardingStep = jest.mocked(useOnboardingStep);

describe('FirstApiaryScreen', () => {
  it('2. adımda arılık adını kaydeder', async () => {
    const view = createOnboardingView({ step: 'first-apiary' });
    mockUseOnboardingStep.mockReturnValue(view);
    await renderWithProviders(<FirstApiaryScreen />);

    expect(screen.getByRole('progressbar', { name: 'Adım 2 / 3' })).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText('Arılık adı'), 'Yayla Arılığı');
    await fireEvent(screen.getByLabelText('Arılık adı'), 'submitEditing');

    expect(view.saveFirstApiary).toHaveBeenCalledWith('Yayla Arılığı');
  });

  it('hatayı gösterir; kaydederken düğme meşguldür', async () => {
    mockUseOnboardingStep.mockReturnValue(
      createOnboardingView({ step: 'first-apiary', error: 'unknown', saving: true }),
    );
    await renderWithProviders(<FirstApiaryScreen />);

    expect(screen.getByRole('alert')).toHaveTextContent('Kaydedilemedi. Tekrar dene.');
    expect(screen.getByRole('button', { name: 'Devam' })).toBeBusy();
  });

  it('işletme henüz yoksa işletme adımına, veri beklenirken göstergeye döner', async () => {
    mockUseOnboardingStep.mockReturnValue(createOnboardingView({ step: 'business-name' }));
    await renderWithProviders(<FirstApiaryScreen />);
    expect(screen.getByText('yönlendir:/onboarding/business-name')).toBeOnTheScreen();

    mockUseOnboardingStep.mockReturnValue(createOnboardingView({ step: 'loading' }));
    await renderWithProviders(<FirstApiaryScreen />);
    expect(screen.getByLabelText('Yükleniyor…')).toBeOnTheScreen();
  });
});
