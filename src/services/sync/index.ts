import { getSyncClient } from '../../data/api/sync.client';
import { getRepositories } from '../../data/repositories';
import { systemClock } from '../../lib/clock';

import { createSyncCoordinator, type SyncCoordinator } from './SyncCoordinator';
import { createSyncPullService } from './SyncPullService';
import { createSyncPushService } from './SyncPushService';
import { syncStore } from './syncStore';
import { createPlatformSyncTriggers } from './syncTriggers';

// Senkron motorunun gerçek bağımlılıklarla kurulduğu tek yer (TODO.md T1.6). Oturum açılınca
// `getSyncCoordinator().start()`, kapanınca `stop()` çağrılır (T1.7). Arayüz durumu
// `syncStore`'dan okur (T1.9 `useSyncStatus`).

let coordinator: SyncCoordinator | undefined;

export function getSyncCoordinator(): SyncCoordinator {
  if (!coordinator) {
    const repositories = getRepositories(systemClock);
    const client = getSyncClient();
    syncStore.update({ lastSyncedAt: repositories.syncState.get().lastSyncedAt });
    coordinator = createSyncCoordinator({
      push: createSyncPushService({ outbox: repositories.outbox, client }),
      pull: createSyncPullService({
        client,
        syncState: repositories.syncState,
        targets: repositories,
      }),
      syncState: repositories.syncState,
      store: syncStore,
      clock: systemClock,
      triggers: createPlatformSyncTriggers(),
    });
  }
  return coordinator;
}

export { syncStore } from './syncStore';
export type { SyncIssue, SyncSnapshot, SyncStatus, SyncStore } from './syncStore';
