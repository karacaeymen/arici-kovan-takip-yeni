import { getSyncClient } from '../../data/api/sync.client';
import { getRepositories } from '../../data/repositories';
import { systemClock } from '../../lib/clock';

import { createSyncCoordinator, type SyncCoordinator } from './SyncCoordinator';
import { createSyncPullService } from './SyncPullService';
import { createSyncPushService } from './SyncPushService';
import { createSyncStatusService, type SyncStatusService } from './SyncStatusService';
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

let statusService: SyncStatusService | undefined;

/** Senkron durumu ve bekleyen değişiklikler (ayarlar ekranı ve senkron şeridi, T1.9). */
export function getSyncStatusService(): SyncStatusService {
  statusService ??= createSyncStatusService({
    store: syncStore,
    outbox: getRepositories(systemClock).outbox,
    coordinator: getSyncCoordinator(),
    clock: systemClock,
  });
  return statusService;
}

export { syncStore } from './syncStore';
export type { SyncIssue, SyncSnapshot, SyncStatus, SyncStore } from './syncStore';
export type { PendingChange, SyncStatusService } from './SyncStatusService';
