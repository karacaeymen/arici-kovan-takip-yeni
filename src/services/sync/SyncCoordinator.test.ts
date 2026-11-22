import { type SyncChange, SyncRequestError } from '../../data/api/sync.client';
import { createFixedClock } from '../../lib/clock';
import { setErrorReporter } from '../../lib/observability/report';
import { HIVE_IDS, newHive, serverHive, setupSyncTest } from '../../test-utils/sync-fixtures';

import {
  backoffDelay,
  createSyncCoordinator,
  DEFAULT_BACKOFF,
  type Timer,
} from './SyncCoordinator';
import { createSyncPullService } from './SyncPullService';
import { createSyncPushService, type PushSummary } from './SyncPushService';
import { createSyncStore } from './syncStore';
import type { SyncTriggerReason } from './syncTriggers';

// Telefondaki güvenli depo Node'da yok; Supabase istemcisi yüklenirken sahtesi kullanılır.
jest.mock('expo-secure-store', () => ({}));
jest.mock('expo-sqlite', () => ({ openDatabaseSync: jest.fn() }));

const T0 = '2026-11-01T08:00:00.000Z';
const OK_PUSH: PushSummary = { sent: 1, retry: 0, rejected: 0 };
const OK_PULL = { applied: 0, stale: 0, skipped: 0 };

/** Elle ilerletilen sahte zamanlayıcı. */
function fakeTimer() {
  const pending = new Map<number, { callback: () => void; ms: number }>();
  let next = 1;
  const timer: Timer = {
    setTimeout: (callback, ms) => {
      pending.set(next, { callback, ms });
      return next++;
    },
    clearTimeout: (handle) => {
      pending.delete(handle as number);
    },
  };
  return {
    timer,
    delays: () => [...pending.values()].map((entry) => entry.ms),
    /** Bekleyen tüm zamanlayıcıları çalıştırır. */
    fire() {
      const entries = [...pending.values()];
      pending.clear();
      entries.forEach((entry) => entry.callback());
    },
  };
}

function setup() {
  const clock = createFixedClock(T0);
  const store = createSyncStore();
  const timers = fakeTimer();
  const calls: string[] = [];
  let trigger: ((reason: SyncTriggerReason) => void) | undefined;
  const unsubscribe = jest.fn();
  const deps = {
    push: { pushAll: jest.fn(async () => (calls.push('push'), OK_PUSH)) },
    pull: { pullAll: jest.fn(async () => (calls.push('pull'), OK_PULL)) },
    syncState: { markSynced: jest.fn() },
    store,
    clock,
    timer: timers.timer,
    triggers: {
      isOnline: jest.fn(async () => true),
      unsubscribe,
      subscribe: jest.fn((onTrigger: (reason: SyncTriggerReason) => void) => {
        trigger = onTrigger;
        return unsubscribe;
      }),
    },
  };
  const coordinator = createSyncCoordinator(deps);
  return {
    ...deps,
    coordinator,
    timers,
    calls,
    snapshot: () => store.getSnapshot(),
    trigger: (reason: SyncTriggerReason) => trigger?.(reason),
  };
}

/** Bekleyen promise zincirlerinin bitmesini bekler. */
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('SyncCoordinator', () => {
  const reporter = jest.fn();
  beforeEach(() => {
    reporter.mockReset();
    setErrorReporter(reporter);
  });
  afterAll(() => setErrorReporter(undefined));

  it('önce push sonra pull yapar; başarıda durumu ve son senkron zamanını yazar', async () => {
    const t = setup();

    await expect(t.coordinator.sync()).resolves.toMatchObject({ status: 'idle', lastSyncedAt: T0 });

    expect(t.calls).toEqual(['push', 'pull']);
    expect(t.syncState.markSynced).toHaveBeenCalledWith(T0);
    expect(t.timers.delays()).toEqual([]);
  });

  it('senkron sürerken durum syncing olur', async () => {
    const t = setup();
    const statuses: string[] = [];
    t.store.subscribe((s) => statuses.push(s.status));

    await t.coordinator.sync();

    expect(statuses).toEqual(['syncing', 'idle']);
  });

  it('bağlantı yoksa denemez, offline olur ve zamanlayıcı kurmaz', async () => {
    const t = setup();
    t.triggers.isOnline.mockResolvedValue(false);

    await expect(t.coordinator.sync()).resolves.toMatchObject({ status: 'offline' });

    expect(t.push.pushAll).not.toHaveBeenCalled();
    expect(t.timers.delays()).toEqual([]);
  });

  it('aynı anda iki senkron çalışmaz; arada gelen istek bitince bir kez daha çalıştırır', async () => {
    const t = setup();

    const first = t.coordinator.sync();
    const second = t.coordinator.sync();
    const third = t.coordinator.sync();
    const snapshots = await Promise.all([first, second, third]);

    expect(new Set(snapshots).size).toBe(1);

    expect(t.calls).toEqual(['push', 'pull', 'push', 'pull']);
  });

  describe('yeniden deneme (üstel bekleme)', () => {
    it('bekleme süresi her başarısızlıkta ikiye katlanır ve üst sınırda durur', () => {
      const delays = [1, 2, 3, 4, 10, 100].map((n) => backoffDelay(n, DEFAULT_BACKOFF));
      expect(delays).toEqual([2_000, 4_000, 8_000, 16_000, 300_000, 300_000]);
      expect(backoffDelay(0, DEFAULT_BACKOFF)).toBe(2_000);
    });

    it('ağ hatasında error olur ve beklemeyi artırarak tekrar dener; başarıda sıfırlanır', async () => {
      const t = setup();
      const networkError = new SyncRequestError('network', 'koptu');
      t.push.pushAll.mockRejectedValueOnce(networkError).mockRejectedValueOnce(networkError);

      await t.coordinator.sync();
      expect(t.snapshot()).toMatchObject({
        status: 'error',
        issue: 'network',
        failureCount: 1,
        nextRetryAt: '2026-11-01T08:00:02.000Z',
      });
      expect(t.timers.delays()).toEqual([2_000]);

      t.timers.fire();
      await flush();
      expect(t.snapshot()).toMatchObject({ status: 'error', failureCount: 2 });
      expect(t.timers.delays()).toEqual([4_000]);

      t.timers.fire();
      await flush();
      expect(t.snapshot()).toMatchObject({ status: 'idle', failureCount: 0, nextRetryAt: null });
      expect(t.timers.delays()).toEqual([]);
      expect(reporter).not.toHaveBeenCalled();
    });

    it('istek sırasında bağlantı gittiyse error değil offline olur, zamanlayıcı kurmaz', async () => {
      const t = setup();
      t.push.pushAll.mockRejectedValueOnce(new SyncRequestError('network', 'koptu'));
      t.triggers.isOnline.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

      await expect(t.coordinator.sync()).resolves.toMatchObject({ status: 'offline' });
      expect(t.timers.delays()).toEqual([]);
    });

    it('sunucu hatasını bildirir ve tekrar dener', async () => {
      const t = setup();
      const error = new SyncRequestError('server', 'Sunucu hatası (500)', 500);
      t.pull.pullAll.mockRejectedValueOnce(error);

      await expect(t.coordinator.sync()).resolves.toMatchObject({
        status: 'error',
        issue: 'server',
      });

      expect(reporter).toHaveBeenCalledWith(error, {
        layer: 'service',
        feature: 'sync',
        operation: 'sync',
      });
      expect(t.timers.delays()).toEqual([2_000]);
    });

    it('beklenmeyen hatayı bildirir ve unknown olarak tekrar dener', async () => {
      const t = setup();
      t.pull.pullAll.mockRejectedValueOnce(new Error('pull imleci ilerlemedi: 6'));

      await expect(t.coordinator.sync()).resolves.toMatchObject({
        status: 'error',
        issue: 'unknown',
      });
      expect(reporter).toHaveBeenCalledTimes(1);
      expect(t.timers.delays()).toEqual([2_000]);
    });

    it('kuyrukta tekrar denenecek değişiklik kalırsa pending_retry ile bekleyip tekrar dener', async () => {
      const t = setup();
      t.push.pushAll.mockResolvedValueOnce({ sent: 2, retry: 1, rejected: 1 });

      await expect(t.coordinator.sync()).resolves.toMatchObject({
        status: 'error',
        issue: 'pending_retry',
        lastSyncedAt: T0,
        rejectedCount: 1,
      });
      expect(t.timers.delays()).toEqual([2_000]);
    });
  });

  it('oturum yoksa signedOut olur ve tekrar denemez', async () => {
    const t = setup();
    t.push.pushAll.mockRejectedValueOnce(
      new SyncRequestError('unauthorized', 'Oturum gerekli', 401),
    );

    await expect(t.coordinator.sync()).resolves.toMatchObject({ status: 'signedOut' });
    expect(t.timers.delays()).toEqual([]);
    expect(reporter).not.toHaveBeenCalled();
  });

  it('sunucu güncelleme isterse senkron kalıcı olarak durur', async () => {
    const t = setup();
    t.push.pushAll.mockRejectedValueOnce(new SyncRequestError('update_required', 'eski', 426));

    await expect(t.coordinator.sync()).resolves.toMatchObject({ status: 'updateRequired' });
    await t.coordinator.sync();

    expect(t.push.pushAll).toHaveBeenCalledTimes(1);
    expect(t.timers.delays()).toEqual([]);
  });

  describe('otomatik tetikleme', () => {
    it('start ilk senkronu yapar; ağ gelince ve uygulama öne gelince yeniden senkronlar', async () => {
      const t = setup();

      t.coordinator.start();
      await flush();
      expect(t.push.pushAll).toHaveBeenCalledTimes(1);

      t.trigger('network');
      await flush();
      t.trigger('foreground');
      await flush();

      expect(t.push.pushAll).toHaveBeenCalledTimes(3);
    });

    it('tetiklenince bekleyen yeniden denemeyi iptal edip hemen dener', async () => {
      const t = setup();
      t.push.pushAll.mockRejectedValueOnce(new SyncRequestError('network', 'koptu'));
      t.coordinator.start();
      await flush();
      expect(t.timers.delays()).toEqual([2_000]);

      t.trigger('network');
      await flush();

      expect(t.timers.delays()).toEqual([]);
      expect(t.snapshot().status).toBe('idle');
    });

    it('start ikinci kez çağrılırsa yeniden abone olmaz', async () => {
      const t = setup();
      t.coordinator.start();
      t.coordinator.start();
      await flush();

      expect(t.triggers.subscribe).toHaveBeenCalledTimes(1);
      expect(t.push.pushAll).toHaveBeenCalledTimes(1);
    });

    it('stop tetikleyicileri ve bekleyen yeniden denemeyi kaldırır', async () => {
      const t = setup();
      t.push.pushAll.mockRejectedValueOnce(new SyncRequestError('network', 'koptu'));
      t.coordinator.start();
      await flush();

      t.coordinator.stop();

      expect(t.triggers.unsubscribe).toHaveBeenCalledTimes(1);
      expect(t.timers.delays()).toEqual([]);
      t.coordinator.stop();
      expect(t.triggers.unsubscribe).toHaveBeenCalledTimes(1);
    });
  });
});

describe('SyncCoordinator: gerçek push/pull servisleriyle', () => {
  it('çevrimdışı yazılan kayıt ağ gelince gider; sunucudaki değişiklik yerele iner', async () => {
    const { repos, clock } = setupSyncTest();
    const [local, remote] = HIVE_IDS;
    const server = { rows: [] as SyncChange[], cursor: 0 };
    const client = {
      push: jest.fn(async (changes: SyncChange[]) => {
        server.rows.push(...changes);
        return changes.map((c) => ({ table: c.table, id: c.row.id, status: 'applied' as const }));
      }),
      pull: jest.fn(async (cursor: number) => ({
        changes: cursor < 1 ? [{ table: 'hives', row: serverHive(remote!, 9, T0) }] : [],
        cursor: 1,
        hasMore: false,
      })),
    };
    let online = false;
    let onTrigger: () => void = () => {};
    const coordinator = createSyncCoordinator({
      push: createSyncPushService({ outbox: repos.outbox, client }),
      pull: createSyncPullService({ client, syncState: repos.syncState, targets: repos }),
      syncState: repos.syncState,
      store: createSyncStore(),
      clock,
      triggers: {
        isOnline: async () => online,
        subscribe: (listener) => {
          onTrigger = () => listener('network');
          return () => {};
        },
      },
    });

    coordinator.start();
    await flush();
    repos.hives.create(newHive(local!, 1));
    expect(client.push).not.toHaveBeenCalled();
    expect(repos.outbox.count()).toBe(1);

    online = true;
    onTrigger();
    await flush();

    expect(server.rows.map((c) => c.row.id)).toEqual([local]);
    expect(repos.outbox.count()).toBe(0);
    expect(repos.hives.getById(remote!)?.number).toBe(9);
    expect(repos.syncState.get()).toEqual({ cursor: 1, lastSyncedAt: T0 });
    coordinator.stop();
  });
});
