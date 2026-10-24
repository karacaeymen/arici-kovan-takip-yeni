import { renderWithProviders, screen } from '@/test-utils/render';

import { HomeScreen } from './HomeScreen';

describe('HomeScreen', () => {
  it('uygulama adını gösterir', async () => {
    await renderWithProviders(<HomeScreen />);
    expect(screen.getByText('Arıcı Kovan Takip')).toBeOnTheScreen();
  });
});
