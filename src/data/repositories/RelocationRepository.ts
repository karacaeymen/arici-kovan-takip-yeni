import { desc, eq } from 'drizzle-orm';

import type { Relocation } from '../../domain/entities/relocation';
import type { LocalDatabase } from '../db/client';
import { relocations } from '../db/schema';

import { createSyncedRepository, type RepositoryClock } from './syncedRepository';

export function createRelocationRepository(db: LocalDatabase, clock: RepositoryClock) {
  const base = createSyncedRepository<Relocation>(db, clock, {
    tableName: 'relocations',
    table: relocations,
  });
  return {
    ...base,
    /** Kovanın kayıtları, en yeniden eskiye (taşıma zamanı). */
    watchByHive: (hiveId: string) =>
      base.query(eq(relocations.hiveId, hiveId), [
        desc(relocations.movedAt),
        desc(relocations.createdAt),
      ]),
    listByHive: (hiveId: string) =>
      base
        .query(eq(relocations.hiveId, hiveId), [
          desc(relocations.movedAt),
          desc(relocations.createdAt),
        ])
        .all(),
  };
}

export type RelocationRepository = ReturnType<typeof createRelocationRepository>;
