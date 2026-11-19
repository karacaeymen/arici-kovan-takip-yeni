import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

/** Telefondaki yerel veritabanı dosyasının adı. */
export const DATABASE_NAME = 'kovan.db';

export type AppDatabase = ExpoSQLiteDatabase<typeof schema>;

let instance: AppDatabase | undefined;

/**
 * Yerel veritabanını açar (ilk çağrıda) ve aynı bağlantıyı döndürür. Tembeldir: modül içe
 * aktarılınca değil, ilk kullanımda açılır; böylece testler yerel modülü yüklemek zorunda kalmaz.
 * `enableChangeListener`, `useLiveQuery` ile canlı dinleme için gereklidir.
 */
export function getDatabase(): AppDatabase {
  instance ??= drizzle(openDatabaseSync(DATABASE_NAME, { enableChangeListener: true }), { schema });
  return instance;
}
