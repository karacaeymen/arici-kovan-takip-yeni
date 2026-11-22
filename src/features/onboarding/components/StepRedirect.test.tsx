import { renderWithProviders, screen } from '@/test-utils/render';

import { StepRedirect, stepHref } from './StepRedirect';

jest.mock('expo-router', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { Text: RNText } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Redirect: ({ href }: { href: string }) => createElement(RNText, null, `yönlendir:${href}`),
  };
});

describe('StepRedirect', () => {
  it('adımın adresini verir; bitince ana sayfa', () => {
    expect(stepHref('business-name')).toBe('/onboarding/business-name');
    expect(stepHref('notifications')).toBe('/onboarding/notifications');
    expect(stepHref('done')).toBe('/');
  });

  it('beklerken gösterge, değilse yönlendirme gösterir', async () => {
    await renderWithProviders(<StepRedirect step="loading" />);
    expect(screen.getByLabelText('Yükleniyor…')).toBeOnTheScreen();

    await renderWithProviders(<StepRedirect step="first-apiary" />);
    expect(screen.getByText('yönlendir:/onboarding/first-apiary')).toBeOnTheScreen();
  });
});
