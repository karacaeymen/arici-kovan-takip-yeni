import type { SyncTableName } from '../data/db/schema';
import { createOutboxRepository } from '../data/repositories/OutboxRepository';
import type {
  NewRecord,
  RecordChanges,
  RepositoryClock,
  SyncedRecord,
  SyncedRepository,
} from '../data/repositories/syncedRepository';
import { createFixedClock, type FixedClock } from '../lib/clock';

import { createTestDatabase, type TestDatabase } from './test-database';

export const T0 = '2026-11-01T08:00:00.000Z';

interface ContractOptions<T extends SyncedRecord> {
  tableName: SyncTableName;
  create: (db: TestDatabase, clock: RepositoryClock) => SyncedRepository<T>;
  /** Eklenecek örnek kayıt (ebeveyn kayıtların var olması gerekmez: yerelde FK yok). */
  sample: NewRecord<T>;
  /** Güncellemede kullanılacak değişiklik. */
  changes: RecordChanges<T>;
}

export interface ContractContext<R> {
  db: TestDatabase;
  clock: FixedClock;
  repo: R;
  outbox: ReturnType<typeof createOutboxRepository>;
}

/** Bellek içi veritabanı, sabit saat (T0) ve verilen repository ile test ortamı kurar. */
export function setupRepository<R>(options: {
  create: (db: TestDatabase, clock: RepositoryClock) => R;
}): ContractContext<R> {
  const db = createTestDatabase();
  const clock = createFixedClock(T0);
  return { db, clock, repo: options.create(db, clock), outbox: createOutboxRepository(db) };
}

/** Senkron edilen her repository'nin uyması gereken ortak davranış (TODO.md T1.5). */
export function describeSyncedRepository<T extends SyncedRecord>(options: ContractOptions<T>) {
  const { tableName, sample, changes } = options;
  let ctx: ContractContext<SyncedRepository<T>>;
  beforeEach(() => {
    ctx = setupRepository(options);
  });

  describe(`${tableName}: ortak repository davranışı`, () => {
    it('ekler, zaman damgalarını saatten yazar ve kaydın tamamını kuyruğa alır', () => {
      const created = ctx.repo.create(sample);

      expect(created).toMatchObject({ ...sample, createdAt: T0, updatedAt: T0, deletedAt: null });
      expect(ctx.repo.getById(sample.id)).toEqual(created);
      expect(ctx.outbox.peek()).toEqual([
        expect.objectContaining({ table: tableName, row: created, attemptCount: 0 }),
      ]);
    });

    it('günceller; updatedAt ilerler ve kuyrukta yalnızca son hal kalır', () => {
      ctx.repo.create(sample);
      ctx.clock.advance(60_000);
      const updated = ctx.repo.update(sample.id, changes);

      expect(updated).toMatchObject({ ...changes, createdAt: T0 });
      expect(updated.updatedAt).toBe('2026-11-01T08:01:00.000Z');
      expect(ctx.outbox.peek().map((c) => c.row)).toEqual([updated]);
    });

    it('saat ilerlemese bile güncellemede updatedAt 1 ms ileri gider', () => {
      ctx.repo.create(sample);
      expect(ctx.repo.update(sample.id, changes).updatedAt).toBe('2026-11-01T08:00:00.001Z');
    });

    it('siler: kayıt okumalardan kaybolur, satır deletedAt ile kalır ve kuyruğa girer', async () => {
      ctx.repo.create(sample);
      ctx.clock.advance(1_000);
      const removed = ctx.repo.remove(sample.id);

      expect(removed.deletedAt).toBe('2026-11-01T08:00:01.000Z');
      expect(ctx.repo.getById(sample.id)).toBeUndefined();
      expect(await ctx.repo.watchById(sample.id)).toEqual([]);
      expect(ctx.outbox.peek().map((c) => c.row.deletedAt)).toEqual([removed.deletedAt]);
    });

    it('olmayan ya da silinmiş kaydı güncellemez, kuyruğa da bir şey eklemez', () => {
      expect(() => ctx.repo.update(sample.id, changes)).toThrow('bulunamadı');
      ctx.repo.create(sample);
      ctx.repo.remove(sample.id);
      const before = ctx.outbox.count();

      expect(() => ctx.repo.update(sample.id, changes)).toThrow('bulunamadı');
      expect(() => ctx.repo.remove(sample.id)).toThrow('bulunamadı');
      expect(ctx.outbox.count()).toBe(before);
    });

    it('kuyruğa yazma hata verirse kayıt da geri alınır', () => {
      ctx.db.$client.exec('drop table outbox');

      expect(() => ctx.repo.create(sample)).toThrow();
      expect(ctx.repo.getById(sample.id)).toBeUndefined();
    });

    it('kayıt yazılamazsa kuyruğa da bir şey girmez', () => {
      ctx.repo.create(sample);
      ctx.outbox.markSent(ctx.outbox.peek().map((c) => c.id));

      expect(() => ctx.repo.create(sample)).toThrow(); // aynı kimlik ikinci kez eklenemez
      expect(ctx.outbox.count()).toBe(0);
    });

    it('sunucudan gelen daha yeni satırı kuyruğa eklemeden uygular, bekleyen eski değişikliği siler', () => {
      const local = ctx.repo.create(sample);
      const remote = { ...local, ...changes, updatedAt: '2026-11-02T08:00:00.000Z' } as T;

      expect(ctx.repo.applyRemote(remote)).toBe('applied');
      expect(ctx.repo.getById(sample.id)).toEqual(remote);
      expect(ctx.outbox.count()).toBe(0);
    });

    it('sunucudan gelen eski ya da aynı sürümü atlar', () => {
      const local = ctx.repo.create(sample);
      const older = { ...local, ...changes, updatedAt: '2026-10-31T08:00:00.000Z' } as T;

      expect(ctx.repo.applyRemote(older)).toBe('stale');
      expect(ctx.repo.applyRemote({ ...older, updatedAt: local.updatedAt })).toBe('stale');
      expect(ctx.repo.getById(sample.id)).toEqual(local);
      expect(ctx.outbox.count()).toBe(1);
    });

    it('yerelde olmayan kaydı sunucudan ekler', () => {
      const remote = { ...sample, createdAt: T0, updatedAt: T0, deletedAt: null } as T;

      expect(ctx.repo.applyRemote(remote)).toBe('applied');
      expect(ctx.repo.getById(sample.id)).toEqual(remote);
      expect(ctx.outbox.count()).toBe(0);
    });
  });
}
