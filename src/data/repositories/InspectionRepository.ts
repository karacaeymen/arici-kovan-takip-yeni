import { asc, desc, eq } from 'drizzle-orm';

import type { Inspection } from '../../domain/entities/inspection';
import type { LocalDatabase } from '../db/client';
import { inspections } from '../db/schema';

import { createSyncedRepository, type RepositoryClock } from './syncedRepository';

export function createInspectionRepository(db: LocalDatabase, clock: RepositoryClock) {
  const base = createSyncedRepository<Inspection>(db, clock, {
    tableName: 'inspections',
    table: inspections,
  });
  return {
    ...base,
    /** Kovanın kayıtları, en yeniden eskiye (denetim zamanı). */
    watchByHive: (hiveId: string) =>
      base.query(eq(inspections.hiveId, hiveId), [
        desc(inspections.inspectedAt),
        desc(inspections.createdAt),
      ]),
    listByHive: (hiveId: string) =>
      base
        .query(eq(inspections.hiveId, hiveId), [
          desc(inspections.inspectedAt),
          desc(inspections.createdAt),
        ])
        .all(),

    /** Toplu denetim oturumunun kayıtları (T3.2). */
    listBySession: (sessionId: string) =>
      base.query(eq(inspections.sessionId, sessionId), [asc(inspections.inspectedAt)]).all(),
  };
}

export type InspectionRepository = ReturnType<typeof createInspectionRepository>;
