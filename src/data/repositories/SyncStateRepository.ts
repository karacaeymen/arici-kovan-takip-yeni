import { eq } from 'drizzle-orm';

import type { LocalDatabase } from '../db/client';
import { syncState } from '../db/schema';

/** Senkron motorunun kaldığı yer: sunucudan en son çekilen imleç ve son başarılı senkron zamanı. */
export interface SyncState {
  cursor: number;
  lastSyncedAt: string | null;
}

const INITIAL: SyncState = { cursor: 0, lastSyncedAt: null };

/** `sync_state` tablosu (her zaman tek satır, `id = 1`). Satır ilk yazmada oluşur. */
export function createSyncStateRepository(db: LocalDatabase) {
  const upsert = (values: Partial<SyncState>) =>
    db
      .insert(syncState)
      .values({ id: 1, ...values })
      .onConflictDoUpdate({ target: syncState.id, set: values })
      .run();

  return {
    get(): SyncState {
      const row = db.select().from(syncState).where(eq(syncState.id, 1)).get();
      return row ? { cursor: row.cursor, lastSyncedAt: row.lastSyncedAt } : { ...INITIAL };
    },

    /** Pull sayfası uygulandıktan sonra imleci ilerletir. */
    saveCursor(cursor: number): void {
      upsert({ cursor });
    },

    /** Push ve pull başarıyla bittiğinde çağrılır. */
    markSynced(at: string): void {
      upsert({ lastSyncedAt: at });
    },
  };
}

export type SyncStateRepository = ReturnType<typeof createSyncStateRepository>;
