import { desc, eq } from 'drizzle-orm';

import type { Harvest } from '../../domain/entities/harvest';
import type { LocalDatabase } from '../db/client';
import { harvests } from '../db/schema';

import { createSyncedRepository, type RepositoryClock } from './syncedRepository';

export function createHarvestRepository(db: LocalDatabase, clock: RepositoryClock) {
  const base = createSyncedRepository<Harvest>(db, clock, {
    tableName: 'harvests',
    table: harvests,
  });
  return {
    ...base,
    /** Kovanın kayıtları, en yeniden eskiye (sağım tarihi). */
    watchByHive: (hiveId: string) =>
      base.query(eq(harvests.hiveId, hiveId), [
        desc(harvests.harvestedOn),
        desc(harvests.createdAt),
      ]),
    listByHive: (hiveId: string) =>
      base
        .query(eq(harvests.hiveId, hiveId), [desc(harvests.harvestedOn), desc(harvests.createdAt)])
        .all(),
  };
}

export type HarvestRepository = ReturnType<typeof createHarvestRepository>;
