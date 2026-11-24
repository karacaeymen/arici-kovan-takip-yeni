import { renderWithProviders, screen } from '@/test-utils/render';
import { colors } from '@/theme';

import { AppText } from './AppText';

describe('AppText', () => {
  it('metni gövde yazısıyla, ana renkte gösterir', async () => {
    await renderWithProviders(<AppText>Kovan 7</AppText>);
    expect(screen.getByText('Kovan 7')).toHaveStyle({ fontSize: 18, color: colors.text });
  });

  it('başlık olarak işaretlenebilir; tür, renk ve hizalama değişir', async () => {
    await renderWithProviders(
      <AppText variant="title" tone="danger" header align="center">
        Uyarı
      </AppText>,
    );
    expect(screen.getByRole('header', { name: 'Uyarı' })).toHaveStyle({
      fontSize: 28,
      color: colors.danger,
      textAlign: 'center',
    });
  });

  it('başlık değilse başlık rolü yoktur', async () => {
    await renderWithProviders(<AppText tone="muted">Açıklama</AppText>);
    expect(screen.queryByRole('header')).toBeNull();
    expect(screen.getByText('Açıklama')).toHaveStyle({ color: colors.textMuted });
  });
});
