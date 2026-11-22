import type { PullPage } from '../../data/api/sync.client';
import { setErrorReporter } from '../../lib/observability/report';
import {
  HIVE_IDS,
  newHive,
  serverHive,
  setupSyncTest,
  type SyncTestContext,
} from '../../test-utils/sync-fixtures';

import { createSyncPullService, SyncPullRowError } from './SyncPullService';

// Telefondaki güvenli depo Node'da yok; Supabase istemcisi yüklenirken sahtesi kullanılır.
jest.mock('expo-secure-store', () => ({}));
jest.mock('expo-sqlite', () => ({ openDatabaseSync: jest.fn() }));

const [A, B, C] = HIVE_IDS;
const NEWER = '2026-11-02T08:00:00+00:00';
const OLDER = '2026-10-20T08:00:00+00:00';

/** Sahte sunucu: verilen sayfaları sırayla döner. */
function fakeServer(pages: PullPage[]) {
  let index = 0;
  return {
    pull: jest.fn(async () => pages[index++] ?? { changes: [], cursor: 0, hasMore: false }),
  };
}

const page = (changes: PullPage['changes'], cursor: number, hasMore = false): PullPage => ({
  changes,
  cursor,
  hasMore,
});

describe('SyncPullService', () => {
  let ctx: SyncTestContext;
  const reporter = jest.fn();

  beforeEach(() => {
    ctx = setupSyncTest();
    reporter.mockReset();
    setErrorReporter(reporter);
  });
  afterAll(() => setErrorReporter(undefined));

  const service = (client: ReturnType<typeof fakeServer>, pageSize?: number) =>
    createSyncPullService({
      client,
      syncState: ctx.repos.syncState,
      targets: ctx.repos,
      ...(pageSize ? { pageSize } : {}),
    });

  it('sunucu satırlarını yerele yazar ve imleci kaydeder', async () => {
    const client = fakeServer([
      page([{ table: 'hives', row: { ...serverHive(A, 1, NEWER), syncSeq: 7 } }], 7),
    ]);

    await expect(service(client).pullAll()).resolves.toEqual({ applied: 1, stale: 0, skipped: 0 });

    expect(ctx.repos.hives.getById(A)).toMatchObject({ number: 1, updatedAt: NEWER });
    expect(ctx.repos.syncState.get().cursor).toBe(7);
    expect(ctx.repos.outbox.count()).toBe(0);
  });

  it('kayıtlı imleçten başlar; hasMore oldukça sonraki sayfayı ister', async () => {
    ctx.repos.syncState.saveCursor(5);
    const client = fakeServer([
      page([{ table: 'hives', row: serverHive(A, 1, NEWER) }], 8, true),
      page([{ table: 'hives', row: serverHive(B, 2, NEWER) }], 9),
    ]);

    await expect(service(client, 50).pullAll()).resolves.toMatchObject({ applied: 2 });

    expect(client.pull.mock.calls).toEqual([
      [5, 50],
      [8, 50],
    ]);
    expect(ctx.repos.syncState.get().cursor).toBe(9);
  });

  it('LWW: yereldeki daha yeni kayıt korunur, sunucudaki daha yeni kayıt yereldekini ezer', async () => {
    ctx.repos.hives.create(newHive(A, 1));
    ctx.repos.hives.create(newHive(B, 2));
    const client = fakeServer([
      page(
        [
          { table: 'hives', row: { ...serverHive(A, 10, OLDER) } },
          { table: 'hives', row: { ...serverHive(B, 20, NEWER) } },
        ],
        3,
      ),
    ]);

    await expect(service(client).pullAll()).resolves.toEqual({ applied: 1, stale: 1, skipped: 0 });

    expect(ctx.repos.hives.getById(A)?.number).toBe(1);
    expect(ctx.repos.hives.getById(B)?.number).toBe(20);
    // Sunucu daha yeniyse yereldeki gönderilmemiş eski değişiklik kuyruktan düşer.
    expect(ctx.repos.outbox.peek().map((entry) => entry.row.id)).toEqual([A]);
  });

  it('sunucudan gelen silme yerelde kaydı gizler', async () => {
    ctx.repos.hives.create(newHive(A, 1));
    const client = fakeServer([
      page([{ table: 'hives', row: { ...serverHive(A, 1, NEWER), deletedAt: NEWER } }], 4),
    ]);

    await service(client).pullAll();

    expect(ctx.repos.hives.getById(A)).toBeUndefined();
  });

  it('geçersiz satırı ve tanınmayan tabloyu atlar, bildirir; imleç yine ilerler', async () => {
    const client = fakeServer([
      page(
        [
          { table: 'hives', row: { ...serverHive(A, 1, NEWER), number: -3 } },
          { table: 'bilinmeyen', row: { id: B } },
          { table: 'hives', row: serverHive(C, 3, NEWER) },
        ],
        12,
      ),
    ]);

    await expect(service(client).pullAll()).resolves.toEqual({ applied: 1, stale: 0, skipped: 2 });

    expect(ctx.repos.hives.getById(A)).toBeUndefined();
    expect(ctx.repos.hives.getById(C)).toBeDefined();
    expect(ctx.repos.syncState.get().cursor).toBe(12);
    const errors = reporter.mock.calls.map(([error]) => error as SyncPullRowError);
    expect(errors.map((e) => e.message)).toEqual([
      `Sunucu satırı uygulanamadı: hives/${A} (geçersiz alan: number)`,
      `Sunucu satırı uygulanamadı: bilinmeyen/${B} (bilinmeyen tablo)`,
    ]);
    expect(reporter.mock.calls[0]?.[1]).toEqual({
      layer: 'service',
      feature: 'sync',
      operation: 'pull',
    });
  });

  it('istek başarısız olursa hatayı fırlatır; uygulanan sayfanın imleci kalır', async () => {
    const error = new Error('bağlantı koptu');
    const client = {
      pull: jest
        .fn()
        .mockResolvedValueOnce(page([{ table: 'hives', row: serverHive(A, 1, NEWER) }], 6, true))
        .mockRejectedValueOnce(error),
    };

    await expect(service(client).pullAll()).rejects.toBe(error);
    expect(ctx.repos.syncState.get().cursor).toBe(6);
  });

  it('sunucu devamı var deyip imleci ilerletmezse sonsuz döngüye girmez', async () => {
    ctx.repos.syncState.saveCursor(6);
    const client = fakeServer([page([], 6, true)]);

    await expect(service(client).pullAll()).rejects.toThrow('pull imleci ilerlemedi: 6');
  });
});
