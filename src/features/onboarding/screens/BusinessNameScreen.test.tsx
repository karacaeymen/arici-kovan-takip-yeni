import { createOnboardingView } from '@/test-utils/onboarding-mock';
import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { useOnboardingStep } from '../hooks/useOnboardingStep';

import { BusinessNameScreen } from './BusinessNameScreen';

jest.mock('../hooks/useOnboardingStep', () => ({ useOnboardingStep: jest.fn() }));
jest.mock('expo-router', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Redirect: ({ href }: { href: string }) => createElement(Text, null, `yönlendir:${href}`),
  };
});
const mockUseOnboardingStep = jest.mocked(useOnboardingStep);

describe('BusinessNameScreen', () => {
  it('1. adımı gösterir; ad yazılmadan devam edilemez', async () => {
    mockUseOnboardingStep.mockReturnValue(createOnboardingView());
    await renderWithProviders(<BusinessNameScreen />);

    expect(screen.getByRole('progressbar', { name: 'Adım 1 / 3' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'İşletmenin adı' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Devam' })).toBeDisabled();
  });

  it('yazılan adı kaydeder', async () => {
    const view = createOnboardingView();
    mockUseOnboardingStep.mockReturnValue(view);
    await renderWithProviders(<BusinessNameScreen />);

    await fireEvent.changeText(screen.getByLabelText('İşletme adı'), 'Karaca Arıcılık');
    await fireEvent.press(screen.getByRole('button', { name: 'Devam' }));

    expect(view.clearError).toHaveBeenCalled();
    expect(view.saveBusinessName).toHaveBeenCalledWith('Karaca Arıcılık');
  });

  it('hatayı Türkçe gösterir', async () => {
    mockUseOnboardingStep.mockReturnValue(createOnboardingView({ error: 'name_too_long' }));
    await renderWithProviders(<BusinessNameScreen />);
    expect(screen.getByRole('alert')).toHaveTextContent('Ad en fazla 100 karakter olabilir.');
  });

  it('bu adım geçildiyse doğru adıma yönlendirir', async () => {
    mockUseOnboardingStep.mockReturnValue(createOnboardingView({ step: 'first-apiary' }));
    await renderWithProviders(<BusinessNameScreen />);
    expect(screen.getByText('yönlendir:/onboarding/first-apiary')).toBeOnTheScreen();
  });
});
