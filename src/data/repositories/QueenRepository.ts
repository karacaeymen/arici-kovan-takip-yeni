import { and, desc, eq, isNull } from 'drizzle-orm';

import type { Queen } from '../../domain/entities/queen';
import type { LocalDatabase } from '../db/client';
import { queens } from '../db/schema';

import { createSyncedRepository, type RepositoryClock } from './syncedRepository';

export function createQueenRepository(db: LocalDatabase, clock: RepositoryClock) {
  const base = createSyncedRepository<Queen>(db, clock, { tableName: 'queens', table: queens });
  return {
    ...base,
    /** Kovanın kayıtları, en yeniden eskiye (verilme tarihi). */
    watchByHive: (hiveId: string) =>
      base.query(eq(queens.hiveId, hiveId), [desc(queens.introducedOn), desc(queens.createdAt)]),
    listByHive: (hiveId: string) =>
      base
        .query(eq(queens.hiveId, hiveId), [desc(queens.introducedOn), desc(queens.createdAt)])
        .all(),

    /** Kovanın şu anki kraliçesi (bitiş tarihi olmayan en son kayıt). */
    getCurrentForHive: (hiveId: string) =>
      base
        .query(and(eq(queens.hiveId, hiveId), isNull(queens.endedOn)), [desc(queens.introducedOn)])
        .all()[0],
  };
}

export type QueenRepository = ReturnType<typeof createQueenRepository>;
