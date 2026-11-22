import { fireEvent, renderWithProviders, screen } from '@/test-utils/render';
import { createSyncStatusView } from '@/test-utils/sync-status-mock';

import { useSyncStatus } from '../hooks/useSyncStatus';

import { TabsHeader, tabOptions, tabsScreenOptions } from './TabsHeader';

jest.mock('../hooks/useSyncStatus', () => ({ useSyncStatus: jest.fn() }));
const mockRouter = { push: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('@expo/vector-icons/Ionicons', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  return {
    __esModule: true,
    default: ({ name }: { name: string }) => createElement(Text, null, name),
  };
});

const mockUseSyncStatus = jest.mocked(useSyncStatus);

describe('TabsHeader', () => {
  beforeEach(() => jest.clearAllMocks());

  it('başlığı gösterir; her şey yolundayken senkron şeridi yoktur', async () => {
    mockUseSyncStatus.mockReturnValue(createSyncStatusView());
    await renderWithProviders(<TabsHeader title="Ana Sayfa" />);

    expect(screen.getByRole('header', { name: 'Ana Sayfa' })).toBeOnTheScreen();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('çevrimdışıyken şeridi gösterir; basınca senkron ayrıntılarına gider', async () => {
    mockUseSyncStatus.mockReturnValue(createSyncStatusView({ status: 'offline', pendingCount: 2 }));
    await renderWithProviders(<TabsHeader title="Ayarlar" />);

    expect(screen.getByText('2 kayıt bekliyor')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button'));

    expect(mockRouter.push).toHaveBeenCalledWith('/settings/sync-status');
  });
});

describe('sekme ayarları', () => {
  it('sekme başlıklarını ve simgelerini verir', async () => {
    expect(tabOptions('index').title).toBe('Ana Sayfa');
    expect(tabOptions('settings').title).toBe('Ayarlar');

    await renderWithProviders(
      <>{tabOptions('settings').tabBarIcon({ color: '#000', size: 24 })}</>,
    );
    expect(screen.getByText('settings-outline')).toBeOnTheScreen();
  });

  it('bütün sekmelerde senkron şeritli başlık kullanılır', async () => {
    mockUseSyncStatus.mockReturnValue(createSyncStatusView());
    await renderWithProviders(<>{tabsScreenOptions.header({ options: { title: 'Ayarlar' } })}</>);
    expect(screen.getByRole('header', { name: 'Ayarlar' })).toBeOnTheScreen();
  });
});
