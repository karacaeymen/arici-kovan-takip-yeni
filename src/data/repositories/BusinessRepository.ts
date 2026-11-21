import { asc, eq } from 'drizzle-orm';

import type { Business } from '../../domain/entities/business';
import type { LocalDatabase } from '../db/client';
import { businesses } from '../db/schema';

import { createSyncedRepository, type RepositoryClock } from './syncedRepository';

export function createBusinessRepository(db: LocalDatabase, clock: RepositoryClock) {
  const base = createSyncedRepository<Business>(db, clock, {
    tableName: 'businesses',
    table: businesses,
  });
  return {
    ...base,
    /** Kullanıcının işletmeleri, ada göre. */
    watchByOwner: (ownerId: string) =>
      base.query(eq(businesses.ownerId, ownerId), [asc(businesses.name)]),
    listByOwner: (ownerId: string) =>
      base.query(eq(businesses.ownerId, ownerId), [asc(businesses.name)]).all(),
  };
}

export type BusinessRepository = ReturnType<typeof createBusinessRepository>;
