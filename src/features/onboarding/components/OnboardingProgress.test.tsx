import { renderWithProviders, screen } from '@/test-utils/render';

import { OnboardingProgress } from './OnboardingProgress';

describe('OnboardingProgress', () => {
  it('kaçıncı adımda olunduğunu ilerleme çubuğu olarak bildirir', async () => {
    await renderWithProviders(<OnboardingProgress current={2} total={3} />);

    const progress = screen.getByRole('progressbar', { name: 'Adım 2 / 3' });
    expect(progress).toHaveAccessibilityValue({ min: 1, max: 3, now: 2 });
    expect(screen.getByText('Adım 2 / 3')).toBeOnTheScreen();
  });
});
