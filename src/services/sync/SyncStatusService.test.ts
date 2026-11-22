import { createFixedClock } from '../../lib/clock';
import { HIVE_IDS, newHive, setupSyncTest } from '../../test-utils/sync-fixtures';

import { createSyncStatusService } from './SyncStatusService';
import { createSyncStore } from './syncStore';

jest.mock('expo-secure-store', () => ({}));
jest.mock('expo-sqlite', () => ({ openDatabaseSync: jest.fn() }));

function setup() {
  const ctx = setupSyncTest();
  const store = createSyncStore();
  const coordinator = { sync: jest.fn(async () => store.getSnapshot()) };
  const clock = createFixedClock('2026-11-22T10:00:00Z');
  const service = createSyncStatusService({ store, outbox: ctx.repos.outbox, coordinator, clock });
  return { ...ctx, store, coordinator, service, clock };
}

describe('SyncStatusService', () => {
  it("senkron durumunu store'dan okur ve değişikliği bildirir", () => {
    const { store, service } = setup();
    const listener = jest.fn();
    service.subscribe(listener);

    store.update({ status: 'offline' });

    expect(service.getSnapshot().status).toBe('offline');
    expect(listener).toHaveBeenCalled();
  });

  it('bekleyen değişiklikleri kayıt içeriği olmadan, sırayla listeler', async () => {
    const { repos, service } = setup();
    repos.hives.create(newHive(HIVE_IDS[0], 1));
    repos.hives.create(newHive(HIVE_IDS[1], 2));
    repos.outbox.markFailed([repos.outbox.peek()[0]!.id], 'network');

    const rows = await service.watchPending();

    expect(service.toPendingChanges(rows)).toEqual([
      expect.objectContaining({
        table: 'hives',
        rowId: HIVE_IDS[0],
        attemptCount: 1,
        lastError: 'network',
      }),
      expect.objectContaining({ table: 'hives', rowId: HIVE_IDS[1], attemptCount: 0 }),
    ]);
    expect(service.toPendingChanges(rows)[0]).not.toHaveProperty('payload');
  });

  it('"Şimdi senkronla" koordinatörü çalıştırır; şimdiki zamanı saatten verir', async () => {
    const { coordinator, service } = setup();

    await service.syncNow();

    expect(coordinator.sync).toHaveBeenCalledTimes(1);
    expect(service.now().toISOString()).toBe('2026-11-22T10:00:00.000Z');
  });
});
