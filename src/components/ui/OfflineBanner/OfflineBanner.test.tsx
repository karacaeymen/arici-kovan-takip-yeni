import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';
import { colors } from '@/theme';

import { OfflineBanner } from './OfflineBanner';

describe('OfflineBanner', () => {
  it('basılabilirken mesajı ve ayrıntıyı tek düğme olarak okur', async () => {
    const onPress = jest.fn();
    await renderWithProviders(
      <OfflineBanner
        tone="warning"
        icon="wifi-off"
        message="İnternet yok"
        detail="3 kayıt bekliyor"
        onPress={onPress}
        hint="Ayrıntıları aç"
      />,
    );

    const banner = screen.getByRole('button', { name: 'İnternet yok. 3 kayıt bekliyor' });
    await fireEvent.press(banner);

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(banner).toHaveStyle({ minHeight: 56, backgroundColor: colors.warningBackground });
  });

  it('basılamıyorsa uyarı olarak bildirilir; tona göre renklenir', async () => {
    await renderWithProviders(
      <OfflineBanner tone="danger" icon="cellphone-arrow-down" message="Güncelleme gerekli" />,
    );

    expect(screen.getByRole('alert', { name: 'Güncelleme gerekli' })).toHaveStyle({
      backgroundColor: colors.dangerBackground,
    });
    expect(screen.getByText('Güncelleme gerekli')).toHaveStyle({ color: colors.text });
    expect(screen.getByTestId('icon-cellphone-arrow-down')).toBeOnTheScreen();
  });
});
