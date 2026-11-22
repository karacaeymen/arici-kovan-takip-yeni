import { Text } from 'react-native';

import { renderWithProviders, screen } from '@/test-utils/render';

import { OnboardingStepLayout } from './OnboardingStepLayout';

describe('OnboardingStepLayout', () => {
  it('ilerlemeyi, başlığı, içeriği ve eylemleri gösterir', async () => {
    await renderWithProviders(
      <OnboardingStepLayout
        step={1}
        total={3}
        title="Başlık"
        subtitle="Açıklama"
        actions={<Text>Eylem</Text>}
      >
        <Text>İçerik</Text>
      </OnboardingStepLayout>,
    );

    expect(screen.getByRole('progressbar', { name: 'Adım 1 / 3' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Başlık' })).toBeOnTheScreen();
    expect(screen.getByText('Açıklama')).toBeOnTheScreen();
    expect(screen.getByText('İçerik')).toBeOnTheScreen();
    expect(screen.getByText('Eylem')).toBeOnTheScreen();
  });
});
