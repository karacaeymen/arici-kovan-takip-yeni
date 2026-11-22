import * as Network from 'expo-network';
import { AppState, type AppStateStatus } from 'react-native';

// Senkronu kendiliğinden başlatan platform olayları (TODO.md T1.6): bağlantı geri gelince ve
// uygulama arka plandan öne gelince. Koordinatör bu arayüzü bilir, React Native'i bilmez.

export type SyncTriggerReason = 'network' | 'foreground';

export interface SyncTriggers {
  /** Olayları dinlemeye başlar; dönen fonksiyon dinlemeyi bırakır. */
  subscribe(onTrigger: (reason: SyncTriggerReason) => void): () => void;
  /** Şu an bağlantı var mı? Bilinmiyorsa `true` (denemek zararsızdır). */
  isOnline(): Promise<boolean>;
}

type NetworkState = Pick<Network.NetworkState, 'isConnected' | 'isInternetReachable'>;

/** Testlerde sahtesi verilen platform API'leri. */
export interface PlatformApis {
  appState: {
    currentState?: string | null;
    addEventListener(type: 'change', listener: (state: AppStateStatus) => void): { remove(): void };
  };
  network: {
    getNetworkStateAsync(): Promise<NetworkState>;
    addNetworkStateListener(listener: (state: NetworkState) => void): { remove(): void };
  };
}

const isReachable = (state: NetworkState): boolean =>
  state.isConnected !== false && state.isInternetReachable !== false;

export function createPlatformSyncTriggers(
  apis: PlatformApis = { appState: AppState, network: Network },
): SyncTriggers {
  return {
    subscribe(onTrigger) {
      let appState = apis.appState.currentState;
      let online: boolean | undefined;

      const appSubscription = apis.appState.addEventListener('change', (next) => {
        if (next === 'active' && appState !== 'active') onTrigger('foreground');
        appState = next;
      });
      const networkSubscription = apis.network.addNetworkStateListener((state) => {
        const reachable = isReachable(state);
        if (reachable && online !== true) onTrigger('network');
        online = reachable;
      });

      return () => {
        appSubscription.remove();
        networkSubscription.remove();
      };
    },

    async isOnline() {
      try {
        return isReachable(await apis.network.getNetworkStateAsync());
      } catch {
        return true;
      }
    },
  };
}
