import { and, asc, count, eq, inArray, sql } from 'drizzle-orm';

import type { LocalDatabase, LocalExecutor } from '../db/client';
import { outbox, type SyncTableName } from '../db/schema';

/** Sunucuya gönderilmeyi bekleyen bir değişiklik: `POST /sync/push` için `{ table, row }`. */
export interface OutboxChange {
  /** Kuyruktaki sıra numarası; gönderim bu sırayla yapılır. */
  id: number;
  table: SyncTableName;
  /** Satırın tamamı (camelCase; en az `id` ve `updatedAt`). */
  row: Record<string, unknown> & { id: string; updatedAt: string };
  enqueuedAt: string;
  attemptCount: number;
  lastError: string | null;
}

/**
 * Bir kaydın değişikliğini kuyruğa ekler. Diğer repository'ler bunu **kendi transaction'ları
 * içinde** çağırır; böylece kayıt ve kuyruk girdisi birlikte yazılır ya da birlikte geri alınır.
 * Aynı kaydın henüz gönderilmemiş eski girdisi silinir: sunucuya yalnızca son hali gider (LWW).
 */
export function enqueueChange(
  tx: LocalExecutor,
  table: SyncTableName,
  row: { id: string; updatedAt: string },
  enqueuedAt: string,
): void {
  discardChanges(tx, table, row.id);
  tx.insert(outbox)
    .values({ tableName: table, rowId: row.id, payload: JSON.stringify(row), enqueuedAt })
    .run();
}

/** Bir kaydın kuyruktaki bekleyen değişikliklerini siler (ör. sunucudan daha yeni hali geldiğinde). */
export function discardChanges(tx: LocalExecutor, table: SyncTableName, rowId: string): void {
  tx.delete(outbox)
    .where(and(eq(outbox.tableName, table), eq(outbox.rowId, rowId)))
    .run();
}

/** Senkron motorunun (T1.6) kuyruğu okuduğu ve işaretlediği repository. */
export function createOutboxRepository(db: LocalDatabase) {
  return {
    /** Kuyruğun başındaki en fazla `limit` değişikliği, eklenme sırasıyla döndürür. */
    peek(limit = 100): OutboxChange[] {
      return db
        .select()
        .from(outbox)
        .orderBy(asc(outbox.id))
        .limit(limit)
        .all()
        .map((entry) => ({
          id: entry.id,
          table: entry.tableName,
          row: JSON.parse(entry.payload) as OutboxChange['row'],
          enqueuedAt: entry.enqueuedAt,
          attemptCount: entry.attemptCount,
          lastError: entry.lastError,
        }));
    },

    /** Sunucunun kabul ettiği (ya da kalıcı olarak reddettiği) değişiklikleri kuyruktan çıkarır. */
    markSent(ids: number[]): void {
      if (ids.length === 0) return;
      db.delete(outbox).where(inArray(outbox.id, ids)).run();
    },

    /** Gönderilemeyen değişikliklerin deneme sayısını artırır ve son hatayı yazar. */
    markFailed(ids: number[], error: string): void {
      if (ids.length === 0) return;
      db.update(outbox)
        .set({ attemptCount: sql`${outbox.attemptCount} + 1`, lastError: error })
        .where(inArray(outbox.id, ids))
        .run();
    },

    /** Bekleyen değişiklik sayısı. */
    count(): number {
      return db.select({ value: count() }).from(outbox).get()?.value ?? 0;
    },

    /** Bekleyen değişikliklerin canlı sorgusu (senkron durum göstergesi için, T1.9). */
    watchPending() {
      return db.select().from(outbox).orderBy(asc(outbox.id));
    },
  };
}

export type OutboxRepository = ReturnType<typeof createOutboxRepository>;
