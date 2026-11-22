import { renderWithProviders, screen } from '@/test-utils/render';

import { SyncSummary, type SyncSummaryProps } from './SyncSummary';

const base: SyncSummaryProps = {
  status: 'idle',
  lastSyncedAt: null,
  pendingCount: 0,
  nextRetryAt: null,
  rejectedCount: 0,
  now: new Date('2026-11-22T10:00:00Z'),
};

describe('SyncSummary', () => {
  it('durumu başlık olarak, hiç senkron yapılmadığını gösterir', async () => {
    await renderWithProviders(<SyncSummary {...base} />);

    expect(screen.getByRole('header', { name: 'Kayıtlar güncel' })).toBeOnTheScreen();
    expect(screen.getByText('Henüz senkron yapılmadı')).toBeOnTheScreen();
  });

  it('son senkronun ne kadar önce olduğunu gösterir', async () => {
    await renderWithProviders(<SyncSummary {...base} lastSyncedAt="2026-11-22T09:48:00Z" />);
    expect(screen.getByText('Son senkron: 12 dk önce')).toBeOnTheScreen();
  });

  it('hata, bekleyen ve reddedilen kayıt bilgilerini gösterir', async () => {
    await renderWithProviders(
      <SyncSummary
        {...base}
        status="error"
        pendingCount={3}
        nextRetryAt="2026-11-22T10:00:04Z"
        rejectedCount={1}
      />,
    );

    expect(screen.getByRole('header', { name: 'Gönderilemedi' })).toBeOnTheScreen();
    expect(screen.getByText('3 kayıt gönderilmeyi bekliyor')).toBeOnTheScreen();
    expect(screen.getByText('Bir sonraki deneme kısa süre içinde yapılacak.')).toBeOnTheScreen();
    expect(screen.getByText('1 kayıt sunucu tarafından kabul edilmedi.')).toBeOnTheScreen();
  });
});
