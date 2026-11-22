import { createRepositories } from '../data/repositories';
import { createFixedClock, type FixedClock } from '../lib/clock';

import { IDS } from './domain-fixtures';
import { createTestDatabase, type TestDatabase } from './test-database';

// Senkron motoru testleri (T1.6) için ortak kurulum ve örnek satırlar.

export const T0 = '2026-11-01T08:00:00.000Z';

export interface SyncTestContext {
  db: TestDatabase;
  clock: FixedClock;
  repos: ReturnType<typeof createRepositories>;
}

/** Bellek içi veritabanı, sabit saat (T0) ve tüm repository'ler. */
export function setupSyncTest(): SyncTestContext {
  const db = createTestDatabase();
  const clock = createFixedClock(T0);
  return { db, clock, repos: createRepositories(db, clock) };
}

/** Yerelde yeni kovan kaydı (repository'nin `create` girdisi). */
export const newHive = (id: string, number: number) => ({
  id,
  businessId: IDS.business,
  apiaryId: IDS.apiary,
  number,
  name: null,
  status: 'active' as const,
  notes: null,
});

/**
 * Sunucunun `GET /sync/pull` ile döndürdüğü kovan satırı: Postgres zaman damgaları `+00:00`
 * biçimindedir ve sunucu yerelde olmayan sütunlar da gönderebilir.
 */
export const serverHive = (id: string, number: number, updatedAt: string) => ({
  ...newHive(id, number),
  createdAt: '2026-10-01T08:00:00+00:00',
  updatedAt,
  deletedAt: null,
});

export const HIVE_IDS = [
  '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e11',
  '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e12',
  '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e13',
  '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e14',
  '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e15',
] as const;
