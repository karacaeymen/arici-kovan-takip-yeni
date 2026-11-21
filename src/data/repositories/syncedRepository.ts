import { and, eq, isNull, type SQL } from 'drizzle-orm';
import type { AnySQLiteSelect, SQLiteColumn, SQLiteTable } from 'drizzle-orm/sqlite-core';

import { compareTimestamps } from '../../domain/shared/timestamps';
import type { LocalDatabase, LocalExecutor } from '../db/client';
import type { SyncTableName } from '../db/schema';

import { discardChanges, enqueueChange } from './OutboxRepository';

// Senkron edilen her varlık repository'sinin ortak çekirdeği (TODO.md T1.5).
// Her yerel yazma, outbox kaydıyla aynı transaction'dadır; okumalar silinmiş kayıtları göstermez.

/** `src/lib/clock.ts`'deki `Clock` ile aynı biçim (repository katmanı `lib`'i import edemez). */
export interface RepositoryClock {
  now(): Date;
}

/** Senkron edilen her kaydın ortak alanları. */
export interface SyncedRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Yeni kayıt: kimlik dahil tüm alanlar, zaman damgaları hariç (onları repository yazar). */
export type NewRecord<T extends SyncedRecord> = Omit<T, 'createdAt' | 'updatedAt' | 'deletedAt'>;

/** Güncellenebilir alanlar: kimlik, sahiplik ve zaman damgaları değişmez. */
export type RecordChanges<T extends SyncedRecord> = Partial<
  Omit<T, 'id' | 'businessId' | 'ownerId' | 'createdAt' | 'updatedAt' | 'deletedAt'>
>;

/** Sunucudan gelen satırın sonucu: uygulandı ya da yereldeki hal daha yeni/aynı olduğu için atlandı. */
export type RemoteApplyResult = 'applied' | 'stale';

/**
 * `useLiveQuery` ile dinlenebilen (`_` Drizzle'ın sorgu bilgisi), `await` edilince ya da
 * `.all()` ile sonuç veren sorgu.
 */
export type LiveQuery<T> = Pick<AnySQLiteSelect, '_'> & Pick<Promise<T>, 'then'> & { all(): T };

type SyncedTable = SQLiteTable & {
  id: SQLiteColumn;
  updatedAt: SQLiteColumn;
  deletedAt: SQLiteColumn;
};

interface SyncedRepositoryConfig {
  tableName: SyncTableName;
  table: SyncedTable;
}

export function createSyncedRepository<T extends SyncedRecord>(
  db: LocalDatabase,
  clock: RepositoryClock,
  { tableName, table }: SyncedRepositoryConfig,
) {
  const find = (ex: LocalExecutor, id: string) =>
    ex.select().from(table).where(eq(table.id, id)).get() as T | undefined;

  /** Saatten zaman damgası üretir; önceki damgadan geri ya da eşit kalırsa 1 ms ileri alır (LWW). */
  const stamp = (previous?: string): string => {
    const now = clock.now().getTime();
    const floor = previous === undefined ? -Infinity : Date.parse(previous) + 1;
    return new Date(Math.max(now, floor)).toISOString();
  };

  const write = (record: T, isNew: boolean): T => {
    db.transaction((tx) => {
      if (isNew)
        tx.insert(table)
          .values(record as never)
          .run();
      else
        tx.update(table)
          .set(record as never)
          .where(eq(table.id, record.id))
          .run();
      enqueueChange(tx, tableName, record, record.updatedAt);
    });
    return record;
  };

  const requireActive = (id: string): T => {
    const current = find(db, id);
    if (current === undefined || current.deletedAt !== null) {
      throw new Error(`${tableName} kaydı bulunamadı: ${id}`);
    }
    return current;
  };

  const activeWhere = (condition: SQL | undefined) => and(condition, isNull(table.deletedAt));

  return {
    /** Silinmemiş kaydı döndürür; yoksa `undefined`. */
    getById(id: string): T | undefined {
      const record = find(db, id);
      return record?.deletedAt === null ? record : undefined;
    },

    /** Yeni kayıt ekler ve kuyruğa alır. Kimlik (`id`) çağıran tarafından üretilir. */
    create(input: NewRecord<T>): T {
      const now = stamp();
      return write({ ...input, createdAt: now, updatedAt: now, deletedAt: null } as T, true);
    },

    /** Silinmemiş kaydın alanlarını değiştirir; `updatedAt` her zaman ileri gider. */
    update(id: string, changes: RecordChanges<T>): T {
      const current = requireActive(id);
      return write({ ...current, ...changes, id, updatedAt: stamp(current.updatedAt) }, false);
    },

    /** Kaydı siler: satır kalır, `deletedAt` dolar (diğer cihazlara da yayılsın diye). */
    remove(id: string): T {
      const current = requireActive(id);
      const now = stamp(current.updatedAt);
      return write({ ...current, updatedAt: now, deletedAt: now }, false);
    },

    /**
     * Sunucudan gelen satırı uygular (T1.6 pull). Kuyruğa **eklemez**. Yereldeki hal daha yeni
     * ya da aynıysa atlanır; uygulanırsa o kaydın gönderilmemiş eski değişikliği kuyruktan silinir.
     */
    applyRemote(row: T): RemoteApplyResult {
      return db.transaction((tx) => {
        const local = find(tx, row.id);
        if (local !== undefined && compareTimestamps(row.updatedAt, local.updatedAt) <= 0) {
          return 'stale';
        }
        if (local === undefined)
          tx.insert(table)
            .values(row as never)
            .run();
        else
          tx.update(table)
            .set(row as never)
            .where(eq(table.id, row.id))
            .run();
        discardChanges(tx, tableName, row.id);
        return 'applied';
      });
    },

    /** Silinmemiş kayıtların sorgusu; `useLiveQuery` ile dinlenir ya da `.all()` ile okunur. */
    query(condition?: SQL, orderBy: SQL[] = []): LiveQuery<T[]> {
      return db
        .select()
        .from(table)
        .where(activeWhere(condition))
        .orderBy(...orderBy) as unknown as LiveQuery<T[]>;
    },

    /** Tek kaydın canlı sorgusu (0 ya da 1 elemanlı liste). */
    watchById(id: string): LiveQuery<T[]> {
      return this.query(eq(table.id, id));
    },
  };
}

export type SyncedRepository<T extends SyncedRecord> = ReturnType<typeof createSyncedRepository<T>>;
