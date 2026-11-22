import type { SyncTable } from '../../data/api/sync.client';
import type { OutboxRepository } from '../../data/repositories';
import type { Clock } from '../../lib/clock';

import type { SyncSnapshot, SyncStore } from './syncStore';

// Senkron durumunu arayüze açan servis (TODO.md T1.9): `syncStore` durumu, bekleyen değişiklikler
// (outbox) ve "Şimdi senkronla". Okuma akışı: Screen → `useSyncStatus` → bu servis → repository.

/** Bekleyen tek değişiklik (gösterim için; satırın içeriği taşınmaz). */
export interface PendingChange {
  id: number;
  table: SyncTable;
  rowId: string;
  enqueuedAt: string;
  attemptCount: number;
  /** Son denemenin hata kodu (ör. `network`, `rejected:missing_parent`). */
  lastError: string | null;
}

export type PendingQuery = ReturnType<OutboxRepository['watchPending']>;
export type PendingRow = Awaited<PendingQuery>[number];

export interface SyncStatusServiceDeps {
  store: Pick<SyncStore, 'getSnapshot' | 'subscribe'>;
  outbox: Pick<OutboxRepository, 'watchPending'>;
  coordinator: { sync(): Promise<unknown> };
  clock: Clock;
}

export function createSyncStatusService({
  store,
  outbox,
  coordinator,
  clock,
}: SyncStatusServiceDeps) {
  return {
    getSnapshot: (): SyncSnapshot => store.getSnapshot(),
    subscribe: (listener: () => void): (() => void) => store.subscribe(listener),

    /** Bekleyen değişikliklerin canlı sorgusu (`useLiveQuery` ile dinlenir). */
    watchPending: (): PendingQuery => outbox.watchPending(),

    toPendingChanges: (rows: readonly PendingRow[]): PendingChange[] =>
      rows.map((row) => ({
        id: row.id,
        table: row.tableName,
        rowId: row.rowId,
        enqueuedAt: row.enqueuedAt,
        attemptCount: row.attemptCount,
        lastError: row.lastError,
      })),

    /** Elle senkron; zaten çalışıyorsa yenisini başlatmaz (koordinatör). */
    async syncNow(): Promise<void> {
      await coordinator.sync();
    },

    /** "5 dk önce" gibi gösterimler için şimdiki zaman. */
    now: (): Date => clock.now(),
  };
}

export type SyncStatusService = ReturnType<typeof createSyncStatusService>;
