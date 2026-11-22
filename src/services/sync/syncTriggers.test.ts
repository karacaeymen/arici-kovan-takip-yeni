import {
  createPlatformSyncTriggers,
  type PlatformApis,
  type SyncTriggerReason,
} from './syncTriggers';

// Gerçek modüller telefonda çalışır; Node'da yerlerine sahteleri konur.
jest.mock('react-native', () => ({
  AppState: { currentState: 'active', addEventListener: jest.fn(() => ({ remove: jest.fn() })) },
}));
jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(async () => ({ isConnected: false })),
  addNetworkStateListener: jest.fn(() => ({ remove: jest.fn() })),
}));

type NetworkState = { isConnected?: boolean; isInternetReachable?: boolean };

function fakePlatform(initialAppState: string = 'active') {
  let appListener: ((state: string) => void) | undefined;
  let networkListener: ((state: NetworkState) => void) | undefined;
  const removeApp = jest.fn();
  const removeNetwork = jest.fn();
  const apis = {
    appState: {
      currentState: initialAppState,
      addEventListener: jest.fn((_type: 'change', listener: (state: string) => void) => {
        appListener = listener;
        return { remove: removeApp };
      }),
    },
    network: {
      getNetworkStateAsync: jest.fn(async (): Promise<NetworkState> => ({ isConnected: true })),
      addNetworkStateListener: jest.fn((listener: (state: NetworkState) => void) => {
        networkListener = listener;
        return { remove: removeNetwork };
      }),
    },
  } satisfies PlatformApis;
  return {
    apis,
    removeApp,
    removeNetwork,
    setAppState: (state: string) => appListener?.(state),
    setNetwork: (state: NetworkState) => networkListener?.(state),
  };
}

function subscribe(platform: ReturnType<typeof fakePlatform>) {
  const reasons: SyncTriggerReason[] = [];
  const unsubscribe = createPlatformSyncTriggers(platform.apis).subscribe((reason) =>
    reasons.push(reason),
  );
  return { reasons, unsubscribe };
}

describe('senkron tetikleyicileri', () => {
  it('uygulama arka plandan öne gelince tetikler; zaten öndeyken tetiklemez', () => {
    const platform = fakePlatform('active');
    const { reasons } = subscribe(platform);

    platform.setAppState('active');
    platform.setAppState('background');
    platform.setAppState('active');
    platform.setAppState('inactive');
    platform.setAppState('active');

    expect(reasons).toEqual(['foreground', 'foreground']);
  });

  it('bağlantı geri gelince tetikler; bağlıyken gelen yeni olaylarda tekrar tetiklemez', () => {
    const platform = fakePlatform();
    const { reasons } = subscribe(platform);

    platform.setNetwork({ isConnected: true });
    platform.setNetwork({ isConnected: true, isInternetReachable: true });
    platform.setNetwork({ isConnected: false });
    platform.setNetwork({ isConnected: true, isInternetReachable: false });
    platform.setNetwork({ isConnected: true, isInternetReachable: true });

    expect(reasons).toEqual(['network', 'network']);
  });

  it('dinlemeyi bırakınca iki aboneliği de kaldırır', () => {
    const platform = fakePlatform();
    const { unsubscribe } = subscribe(platform);

    unsubscribe();

    expect(platform.removeApp).toHaveBeenCalledTimes(1);
    expect(platform.removeNetwork).toHaveBeenCalledTimes(1);
  });

  it.each([
    [{ isConnected: true }, true],
    [{ isConnected: true, isInternetReachable: true }, true],
    [{ isConnected: false }, false],
    [{ isConnected: true, isInternetReachable: false }, false],
    [{}, true],
  ])('isOnline %j → %s', async (state, expected) => {
    const platform = fakePlatform();
    platform.apis.network.getNetworkStateAsync.mockResolvedValueOnce(state);

    await expect(createPlatformSyncTriggers(platform.apis).isOnline()).resolves.toBe(expected);
  });

  it('ağ durumu okunamazsa bağlı sayar (denemek zararsızdır)', async () => {
    const platform = fakePlatform();
    platform.apis.network.getNetworkStateAsync.mockRejectedValueOnce(new Error('izin yok'));

    await expect(createPlatformSyncTriggers(platform.apis).isOnline()).resolves.toBe(true);
  });

  it("varsayılan olarak React Native AppState ve expo-network'ü kullanır", async () => {
    const triggers = createPlatformSyncTriggers();
    await expect(triggers.isOnline()).resolves.toBe(false);
    triggers.subscribe(() => {})();
  });
});
