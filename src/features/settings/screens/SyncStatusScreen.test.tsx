import { renderWithProviders, fireEvent, screen } from '@/test-utils/render';
import { createSyncStatusView } from '@/test-utils/sync-status-mock';

import { useSyncStatus } from '../hooks/useSyncStatus';

import { SyncStatusScreen, syncStatusTitle } from './SyncStatusScreen';

jest.mock('../hooks/useSyncStatus', () => ({ useSyncStatus: jest.fn() }));
const mockUseSyncStatus = jest.mocked(useSyncStatus);

describe('SyncStatusScreen', () => {
  it('durumu, son senkronu ve bekleyen kayıtları gösterir', async () => {
    mockUseSyncStatus.mockReturnValue(
      createSyncStatusView({
        status: 'offline',
        lastSyncedAt: '2026-11-22T08:00:00Z',
        pendingCount: 1,
        pending: [
          {
            id: 1,
            table: 'hives',
            rowId: 'k1',
            enqueuedAt: '2026-11-22T09:00:00Z',
            attemptCount: 1,
            lastError: 'network',
          },
        ],
      }),
    );
    await renderWithProviders(<SyncStatusScreen />);

    expect(syncStatusTitle()).toBe('Senkron durumu');
    expect(screen.getByRole('header', { name: 'İnternet yok' })).toBeOnTheScreen();
    expect(screen.getByText('Son senkron: 2 sa önce')).toBeOnTheScreen();
    expect(screen.getByText('1 kayıt gönderilmeyi bekliyor')).toBeOnTheScreen();
    expect(screen.getByText('Kovan')).toBeOnTheScreen();
    expect(screen.getByText('1 kez denendi · Bağlantı yoktu')).toBeOnTheScreen();
  });

  it('"Şimdi senkronla" basılınca senkronu başlatır', async () => {
    const view = createSyncStatusView();
    mockUseSyncStatus.mockReturnValue(view);
    await renderWithProviders(<SyncStatusScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Şimdi senkronla' }));

    expect(view.syncNow).toHaveBeenCalledTimes(1);
  });

  it('senkron sürerken düğme meşguldür; güncelleme gerekiyorsa basılamaz', async () => {
    mockUseSyncStatus.mockReturnValue(createSyncStatusView({ status: 'syncing' }));
    const { unmount } = await renderWithProviders(<SyncStatusScreen />);
    expect(screen.getByRole('button', { name: 'Şimdi senkronla' })).toBeBusy();
    await unmount();

    mockUseSyncStatus.mockReturnValue(createSyncStatusView({ status: 'updateRequired' }));
    await renderWithProviders(<SyncStatusScreen />);
    expect(screen.getByRole('button', { name: 'Şimdi senkronla' })).toBeDisabled();
  });
});
