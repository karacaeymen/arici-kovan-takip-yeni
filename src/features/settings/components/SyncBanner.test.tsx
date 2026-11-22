import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';

import { SyncBanner } from './SyncBanner';

describe('SyncBanner', () => {
  it('her şey yolundayken görünmez', async () => {
    await renderWithProviders(<SyncBanner status="idle" pendingCount={3} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it.each([
    ['syncing', 'Kayıtlar gönderiliyor…'],
    ['offline', 'İnternet yok. Kayıtların telefonda; bağlantı gelince gönderilecek.'],
    ['error', 'Kayıtlar gönderilemedi, birazdan tekrar denenecek.'],
    ['signedOut', 'Kayıtları göndermek için tekrar giriş yap.'],
    ['updateRequired', 'Kayıtları göndermek için uygulamayı güncellemen gerekiyor.'],
  ] as const)('%s durumunda mesajı gösterir', async (status, message) => {
    await renderWithProviders(<SyncBanner status={status} pendingCount={0} onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: message })).toBeOnTheScreen();
  });

  it('kuyrukta tekrar denenecek kayıt kaldıysa ayrı mesaj gösterir', async () => {
    await renderWithProviders(
      <SyncBanner status="error" issue="pending_retry" pendingCount={1} onPress={jest.fn()} />,
    );
    expect(
      screen.getByText('Bazı kayıtlar gönderilemedi, birazdan tekrar denenecek.'),
    ).toBeTruthy();
  });

  it('bekleyen kayıt sayısını gösterir (gönderilirken göstermez)', async () => {
    await renderWithProviders(<SyncBanner status="offline" pendingCount={4} />);
    expect(screen.getByText('4 kayıt bekliyor')).toBeOnTheScreen();

    await renderWithProviders(<SyncBanner status="syncing" pendingCount={4} />);
    expect(screen.queryByText('4 kayıt bekliyor')).toBeNull();
  });

  it('basılınca ayrıntılara gider', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<SyncBanner status="offline" pendingCount={0} onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
