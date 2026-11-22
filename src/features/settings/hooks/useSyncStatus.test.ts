import { act, renderHook, waitFor } from '@testing-library/react-native';

import { outbox as outboxTable } from '@/data/db/schema';
import { createOutboxRepository } from '@/data/repositories/OutboxRepository';
import { createFixedClock } from '@/lib/clock';
import { createSyncStatusService, type SyncStatusService } from '@/services/sync/SyncStatusService';
import { createSyncStore, type SyncStore } from '@/services/sync/syncStore';
import { createTestDatabase } from '@/test-utils/test-database';

import { useSyncStatus } from './useSyncStatus';

// Gerçek `expo-sqlite` telefondadır; yalnızca "tablo değişti" bildirimi taklit edilir.
type ChangeListener = (event: { tableName: string }) => void;
const mockListeners = new Set<ChangeListener>();
jest.mock('expo-sqlite', () => ({
  addDatabaseChangeListener: (listener: ChangeListener) => {
    mockListeners.add(listener);
    return { remove: () => mockListeners.delete(listener) };
  },
}));

let mockService: SyncStatusService;
jest.mock('@/services/sync', () => ({ getSyncStatusService: () => mockService }));

const T0 = '2026-11-22T10:00:00.000Z';

function setup() {
  const db = createTestDatabase();
  const outbox = createOutboxRepository(db);
  const store: SyncStore = createSyncStore();
  const clock = createFixedClock(T0);
  const coordinator = { sync: jest.fn(async () => store.update({ lastSyncedAt: T0 })) };
  mockService = createSyncStatusService({ store, outbox, coordinator, clock });
  const enqueue = (rowId: string) => {
    db.transaction((tx) => {
      tx.insert(outboxTable)
        .values({ tableName: 'hives', rowId, payload: '{}', enqueuedAt: T0 })
        .run();
    });
    mockListeners.forEach((listener) => listener({ tableName: 'outbox' }));
  };
  return { store, clock, coordinator, enqueue };
}

describe('useSyncStatus', () => {
  beforeEach(() => mockListeners.clear());

  it('syncStore durumunu canlı verir', async () => {
    const t = setup();
    const { result } = await renderHook(() => useSyncStatus());
    expect(result.current.status).toBe('idle');

    await act(async () => t.store.update({ status: 'offline', issue: 'network' }));

    expect(result.current).toMatchObject({ status: 'offline', issue: 'network' });
  });

  it('bekleyen kayıtları yerel veritabanından canlı okur', async () => {
    const t = setup();
    const { result } = await renderHook(() => useSyncStatus());
    await waitFor(() => expect(result.current.pendingCount).toBe(0));

    await act(async () => t.enqueue('kovan-1'));

    await waitFor(() => expect(result.current.pendingCount).toBe(1));
    expect(result.current.pending[0]).toMatchObject({ table: 'hives', rowId: 'kovan-1' });
  });

  it('"Şimdi senkronla" koordinatörü çalıştırır', async () => {
    const t = setup();
    const { result } = await renderHook(() => useSyncStatus());

    await act(async () => {
      await result.current.syncNow();
    });

    expect(t.coordinator.sync).toHaveBeenCalledTimes(1);
    expect(result.current.lastSyncedAt).toBe(T0);
    expect(result.current.syncing).toBe(false);
  });

  it('şimdiki zamanı yarım dakikada bir yeniler', async () => {
    jest.useFakeTimers();
    try {
      const t = setup();
      const { result } = await renderHook(() => useSyncStatus());
      expect(result.current.now.toISOString()).toBe(T0);

      t.clock.advance(30_000);
      await act(async () => jest.advanceTimersByTime(30_000));

      expect(result.current.now.toISOString()).toBe('2026-11-22T10:00:30.000Z');
    } finally {
      jest.useRealTimers();
    }
  });
});
