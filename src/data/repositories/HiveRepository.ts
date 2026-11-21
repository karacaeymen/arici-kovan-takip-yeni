import { asc, eq } from 'drizzle-orm';

import type { Hive } from '../../domain/entities/hive';
import type { LocalDatabase } from '../db/client';
import { hives } from '../db/schema';

import { createSyncedRepository, type RepositoryClock } from './syncedRepository';

export function createHiveRepository(db: LocalDatabase, clock: RepositoryClock) {
  const base = createSyncedRepository<Hive>(db, clock, { tableName: 'hives', table: hives });
  return {
    ...base,
    /** Arılıktaki kovanlar, numaraya göre. */
    watchByApiary: (apiaryId: string) =>
      base.query(eq(hives.apiaryId, apiaryId), [asc(hives.number)]),
    listByApiary: (apiaryId: string) =>
      base.query(eq(hives.apiaryId, apiaryId), [asc(hives.number)]).all(),
    /** İşletmenin tüm kovanları, numaraya göre. */
    watchByBusiness: (businessId: string) =>
      base.query(eq(hives.businessId, businessId), [asc(hives.number)]),
    listByBusiness: (businessId: string) =>
      base.query(eq(hives.businessId, businessId), [asc(hives.number)]).all(),
  };
}

export type HiveRepository = ReturnType<typeof createHiveRepository>;
