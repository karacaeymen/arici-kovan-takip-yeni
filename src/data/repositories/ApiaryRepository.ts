import { asc, eq } from 'drizzle-orm';

import type { Apiary } from '../../domain/entities/apiary';
import type { LocalDatabase } from '../db/client';
import { apiaries } from '../db/schema';

import { createSyncedRepository, type RepositoryClock } from './syncedRepository';

export function createApiaryRepository(db: LocalDatabase, clock: RepositoryClock) {
  const base = createSyncedRepository<Apiary>(db, clock, {
    tableName: 'apiaries',
    table: apiaries,
  });
  return {
    ...base,
    /** İşletmenin arılıkları, ada göre. */
    watchByBusiness: (businessId: string) =>
      base.query(eq(apiaries.businessId, businessId), [asc(apiaries.name)]),
    listByBusiness: (businessId: string) =>
      base.query(eq(apiaries.businessId, businessId), [asc(apiaries.name)]).all(),
  };
}

export type ApiaryRepository = ReturnType<typeof createApiaryRepository>;
