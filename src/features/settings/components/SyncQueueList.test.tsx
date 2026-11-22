import { renderWithProviders, screen } from '@/test-utils/render';

import { SyncQueueList } from './SyncQueueList';

describe('SyncQueueList', () => {
  it('boşken her şeyin sunucuda olduğunu söyler', async () => {
    await renderWithProviders(<SyncQueueList items={[]} />);
    expect(screen.getByText('Bekleyen kayıt yok. Her şey sunucuda.')).toBeOnTheScreen();
  });

  it('kaydın türünü, deneme sayısını ve son hatayı Türkçe gösterir', async () => {
    await renderWithProviders(
      <SyncQueueList
        items={[
          { id: 1, table: 'hives', attemptCount: 0, lastError: null },
          { id: 2, table: 'inspections', attemptCount: 2, lastError: 'rejected:missing_parent' },
          { id: 3, table: 'feedings', attemptCount: 1, lastError: 'tuhaf_hata' },
        ]}
      />,
    );

    expect(screen.getByText('Kovan')).toBeOnTheScreen();
    expect(screen.getByText('Denetim')).toBeOnTheScreen();
    expect(
      screen.getByText('2 kez denendi · Bağlı olduğu kayıt henüz sunucuda değil'),
    ).toBeOnTheScreen();
    expect(screen.getByText('1 kez denendi · Bilinmeyen hata')).toBeOnTheScreen();
  });

  it('tanınmayan tablo adını genel bir etiketle gösterir', async () => {
    await renderWithProviders(
      <SyncQueueList items={[{ id: 1, table: 'yeni_tablo', attemptCount: 0, lastError: null }]} />,
    );
    expect(screen.getByText('Bilinmeyen hata')).toBeOnTheScreen();
  });
});
