import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Senkron durumu; her zaman tek satırdır (`id = 1`). `cursor`, sunucudaki global `sync_seq`
 * sayısından en son çekilen değerdir; ilk senkronda 0'dır.
 */
export const syncState = sqliteTable(
  'sync_state',
  {
    id: integer('id').primaryKey().default(1),
    cursor: integer('cursor').notNull().default(0),
    lastSyncedAt: text('last_synced_at'),
  },
  (t) => [check('sync_state_single_row', sql`${t.id} = 1`)],
);

export type SyncStateRow = typeof syncState.$inferSelect;
export type NewSyncStateRow = typeof syncState.$inferInsert;
