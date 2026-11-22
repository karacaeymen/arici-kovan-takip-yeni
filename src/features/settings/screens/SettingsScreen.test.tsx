import { Alert } from 'react-native';

import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';
import { createSyncStatusView } from '@/test-utils/sync-status-mock';

import { useAccount } from '../hooks/useAccount';
import { useSyncStatus } from '../hooks/useSyncStatus';

import { SettingsScreen } from './SettingsScreen';

jest.mock('../hooks/useSyncStatus', () => ({ useSyncStatus: jest.fn() }));
jest.mock('../hooks/useAccount', () => ({ useAccount: jest.fn() }));
const mockRouter = { push: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

const mockUseSyncStatus = jest.mocked(useSyncStatus);
const mockUseAccount = jest.mocked(useAccount);

function account(overrides: Partial<ReturnType<typeof useAccount>> = {}) {
  return {
    phone: '+90 532 123 45 67',
    signOut: jest.fn(async () => {}),
    signingOut: false,
    failed: false,
    ...overrides,
  };
}

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSyncStatus.mockReturnValue(createSyncStatusView());
    mockUseAccount.mockReturnValue(account());
  });

  it('senkron durumunu özetler ve ayrıntı ekranına gider', async () => {
    mockUseSyncStatus.mockReturnValue(createSyncStatusView({ status: 'offline', pendingCount: 2 }));
    await renderWithProviders(<SettingsScreen />);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Senkron durumu, İnternet yok · 2 kayıt bekliyor' }),
    );

    expect(mockRouter.push).toHaveBeenCalledWith('/settings/sync-status');
  });

  it('giriş yapılan numarayı gösterir', async () => {
    await renderWithProviders(<SettingsScreen />);
    expect(screen.getByText('+90 532 123 45 67')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Senkron durumu, Kayıtlar güncel' })).toBeTruthy();
  });

  it('çıkıştan önce onay ister; onaylanınca çıkış yapar', async () => {
    const view = account();
    mockUseAccount.mockReturnValue(view);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await renderWithProviders(<SettingsScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Çıkış yap' }));

    expect(alert).toHaveBeenCalledWith('Çıkış yapılsın mı?', expect.any(String), expect.any(Array));
    expect(view.signOut).not.toHaveBeenCalled();
    const buttons = alert.mock.calls[0]?.[2] ?? [];
    buttons.find((b) => b.style === 'destructive')?.onPress?.();
    expect(view.signOut).toHaveBeenCalledTimes(1);
    alert.mockRestore();
  });

  it('çıkış başarısızsa uyarı gösterir; numara yoksa göstermez', async () => {
    mockUseAccount.mockReturnValue(account({ failed: true, phone: null }));
    await renderWithProviders(<SettingsScreen />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Çıkış yapılamadı. İnternet bağlantını kontrol edip tekrar dene.',
    );
    expect(screen.queryByText('Giriş yapılan numara')).toBeNull();
  });
});
