import { desc, eq } from 'drizzle-orm';

import type { Feeding } from '../../domain/entities/feeding';
import type { LocalDatabase } from '../db/client';
import { feedings } from '../db/schema';

import { createSyncedRepository, type RepositoryClock } from './syncedRepository';

export function createFeedingRepository(db: LocalDatabase, clock: RepositoryClock) {
  const base = createSyncedRepository<Feeding>(db, clock, {
    tableName: 'feedings',
    table: feedings,
  });
  return {
    ...base,
    /** Kovanın kayıtları, en yeniden eskiye (besleme tarihi). */
    watchByHive: (hiveId: string) =>
      base.query(eq(feedings.hiveId, hiveId), [desc(feedings.fedOn), desc(feedings.createdAt)]),
    listByHive: (hiveId: string) =>
      base
        .query(eq(feedings.hiveId, hiveId), [desc(feedings.fedOn), desc(feedings.createdAt)])
        .all(),
  };
}

export type FeedingRepository = ReturnType<typeof createFeedingRepository>;
