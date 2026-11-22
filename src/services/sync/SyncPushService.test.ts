import type { PushResult, SyncChange } from '../../data/api/sync.client';
import { SyncRequestError } from '../../data/api/sync.client';
import { setErrorReporter } from '../../lib/observability/report';
import {
  HIVE_IDS,
  newHive,
  setupSyncTest,
  type SyncTestContext,
} from '../../test-utils/sync-fixtures';

import { createSyncPushService, SyncRejectedError } from './SyncPushService';

jest.mock('expo-sqlite', () => ({ openDatabaseSync: jest.fn() }));

type Status = Pick<PushResult, 'status' | 'reason'>;

/** Sahte sunucu: her değişiklik için `decide` ne derse o sonucu döner. */
function fakeServer(decide: (change: SyncChange) => Status = () => ({ status: 'applied' })) {
  const push = jest.fn(async (changes: SyncChange[]) =>
    changes.map((change) => ({ table: change.table, id: change.row.id, ...decide(change) })),
  );
  return { push };
}

describe('SyncPushService', () => {
  let ctx: SyncTestContext;
  const reporter = jest.fn();

  beforeEach(() => {
    ctx = setupSyncTest();
    reporter.mockReset();
    setErrorReporter(reporter);
  });
  afterAll(() => setErrorReporter(undefined));

  const createHives = (count: number) =>
    HIVE_IDS.slice(0, count).map((id, i) => ctx.repos.hives.create(newHive(id, i + 1)));

  it('kuyruk boşsa sunucuya gitmez', async () => {
    const client = fakeServer();
    const service = createSyncPushService({ outbox: ctx.repos.outbox, client });

    await expect(service.pushAll()).resolves.toEqual({ sent: 0, retry: 0, rejected: 0 });
    expect(client.push).not.toHaveBeenCalled();
  });

  it('kuyruğu sırayla gönderir; uygulanan ve stale olanları kuyruktan çıkarır', async () => {
    const [first, second] = createHives(2);
    const client = fakeServer((change) =>
      change.row.id === second!.id ? { status: 'stale' } : { status: 'applied' },
    );
    const service = createSyncPushService({ outbox: ctx.repos.outbox, client });

    await expect(service.pushAll()).resolves.toEqual({ sent: 2, retry: 0, rejected: 0 });
    expect(client.push).toHaveBeenCalledWith([
      { table: 'hives', row: first },
      { table: 'hives', row: second },
    ]);
    expect(ctx.repos.outbox.count()).toBe(0);
  });

  it('kuyruğu partiler halinde gönderir', async () => {
    createHives(5);
    const client = fakeServer();
    const service = createSyncPushService({ outbox: ctx.repos.outbox, client, batchSize: 2 });

    await expect(service.pushAll()).resolves.toMatchObject({ sent: 5 });
    expect(client.push.mock.calls.map(([changes]) => changes.length)).toEqual([2, 2, 1]);
  });

  it('missing_parent ve clock_skew kuyrukta kalır, aynı çalıştırmada tekrar gönderilmez', async () => {
    const [orphan, early, ok] = createHives(3);
    const client = fakeServer((change) => {
      if (change.row.id === orphan!.id) return { status: 'rejected', reason: 'missing_parent' };
      if (change.row.id === early!.id) return { status: 'rejected', reason: 'clock_skew' };
      return { status: 'applied' };
    });
    const service = createSyncPushService({ outbox: ctx.repos.outbox, client, batchSize: 2 });

    await expect(service.pushAll()).resolves.toEqual({ sent: 1, retry: 2, rejected: 0 });
    const sentIds = client.push.mock.calls.flatMap(([changes]) => changes.map((c) => c.row.id));
    expect(sentIds).toEqual([orphan!.id, early!.id, ok!.id]);
    expect(ctx.repos.outbox.peek()).toEqual([
      expect.objectContaining({
        row: orphan,
        attemptCount: 1,
        lastError: 'rejected:missing_parent',
      }),
      expect.objectContaining({ row: early, attemptCount: 1, lastError: 'rejected:clock_skew' }),
    ]);
    expect(reporter).not.toHaveBeenCalled();
  });

  it('kalıcı redleri kuyruktan çıkarır ve Sentry etiketiyle bildirir', async () => {
    const [bad] = createHives(2);
    const client = fakeServer((change) =>
      change.row.id === bad!.id
        ? { status: 'rejected', reason: 'invalid_row' }
        : { status: 'applied' },
    );
    const service = createSyncPushService({ outbox: ctx.repos.outbox, client });

    await expect(service.pushAll()).resolves.toEqual({ sent: 1, retry: 0, rejected: 1 });
    expect(ctx.repos.outbox.count()).toBe(0);
    expect(reporter).toHaveBeenCalledTimes(1);
    const [error, tags] = reporter.mock.calls[0] as [SyncRejectedError, unknown];
    expect(error).toBeInstanceOf(SyncRejectedError);
    expect(error.message).toContain(`hives/${bad!.id} (invalid_row)`);
    expect(tags).toEqual({ layer: 'service', feature: 'sync', operation: 'push' });
  });

  it('nedeni olmayan red unknown sayılır ve kalıcıdır', async () => {
    createHives(1);
    const client = fakeServer(() => ({ status: 'rejected' }));
    const service = createSyncPushService({ outbox: ctx.repos.outbox, client });

    await expect(service.pushAll()).resolves.toEqual({ sent: 0, retry: 0, rejected: 1 });
    expect(reporter.mock.calls[0]?.[0]).toHaveProperty(
      'message',
      expect.stringContaining('(unknown)'),
    );
  });

  it('istek başarısız olursa partiyi markFailed yapar ve hatayı fırlatır', async () => {
    createHives(2);
    const error = new SyncRequestError('network', 'Sunucuya ulaşılamadı');
    const client = { push: jest.fn().mockRejectedValue(error) };
    const service = createSyncPushService({ outbox: ctx.repos.outbox, client });

    await expect(service.pushAll()).rejects.toBe(error);
    expect(ctx.repos.outbox.peek()).toEqual([
      expect.objectContaining({ attemptCount: 1, lastError: 'network' }),
      expect.objectContaining({ attemptCount: 1, lastError: 'network' }),
    ]);
  });

  it('beklenmeyen hata da partiyi markFailed yapar', async () => {
    createHives(1);
    const client = { push: jest.fn().mockRejectedValue(new Error('bozuk')) };
    const service = createSyncPushService({ outbox: ctx.repos.outbox, client });

    await expect(service.pushAll()).rejects.toThrow('bozuk');
    expect(ctx.repos.outbox.peek()[0]).toMatchObject({ lastError: 'unknown' });
  });

  it('gönderim sürerken kayıt yeniden düzenlenirse yeni hali kaybolmaz, ardından o da gider', async () => {
    const [hive] = createHives(1);
    const client = {
      push: jest.fn(async (changes: SyncChange[]) => {
        if (client.push.mock.calls.length === 1) {
          ctx.clock.advance(1_000);
          ctx.repos.hives.update(hive!.id, { notes: 'Gönderim sırasında yazıldı' });
        }
        return changes.map((c) => ({ table: c.table, id: c.row.id, status: 'applied' as const }));
      }),
    };
    const service = createSyncPushService({ outbox: ctx.repos.outbox, client });

    await expect(service.pushAll()).resolves.toMatchObject({ sent: 2 });

    expect(client.push.mock.calls.map(([changes]) => changes[0]?.row.notes)).toEqual([
      null,
      'Gönderim sırasında yazıldı',
    ]);
    expect(ctx.repos.outbox.count()).toBe(0);
  });
});
