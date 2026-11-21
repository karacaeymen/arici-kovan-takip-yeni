import { desc, eq } from 'drizzle-orm';

import type { Treatment } from '../../domain/entities/treatment';
import type { LocalDatabase } from '../db/client';
import { treatments } from '../db/schema';

import { createSyncedRepository, type RepositoryClock } from './syncedRepository';

export function createTreatmentRepository(db: LocalDatabase, clock: RepositoryClock) {
  const base = createSyncedRepository<Treatment>(db, clock, {
    tableName: 'treatments',
    table: treatments,
  });
  return {
    ...base,
    /** Kovanın kayıtları, en yeniden eskiye (başlangıç tarihi). */
    watchByHive: (hiveId: string) =>
      base.query(eq(treatments.hiveId, hiveId), [
        desc(treatments.startedOn),
        desc(treatments.createdAt),
      ]),
    listByHive: (hiveId: string) =>
      base
        .query(eq(treatments.hiveId, hiveId), [
          desc(treatments.startedOn),
          desc(treatments.createdAt),
        ])
        .all(),
  };
}

export type TreatmentRepository = ReturnType<typeof createTreatmentRepository>;
