import path from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import * as schema from '../data/db/schema';

/**
 * Testler için bellek içi SQLite veritabanı. Telefondakiyle aynı şema ve aynı `drizzle/` migration'ları
 * uygulanır; sürücü yalnızca Node'daki `better-sqlite3`'tür (cihaz gerekmez). Repository testleri (T1.5) de bunu kullanır.
 */
export function createTestDatabase() {
  const db = drizzle(new Database(':memory:'), { schema });
  migrate(db, { migrationsFolder: path.resolve(__dirname, '../../drizzle') });
  return db;
}

export type TestDatabase = ReturnType<typeof createTestDatabase>;
