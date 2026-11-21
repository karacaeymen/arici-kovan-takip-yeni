import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/** Senkron edilen tablolar, sunucuya ebeveynden çocuğa doğru uygulanma sırasıyla. */
export const SYNC_TABLE_NAMES = [
  'businesses',
  'apiaries',
  'hives',
  'queens',
  'inspections',
  'treatments',
  'feedings',
  'harvests',
  'relocations',
  'tasks',
] as const;

export type SyncTableName = (typeof SYNC_TABLE_NAMES)[number];

/**
 * Sunucuya gidecek değişikliklerin kuyruğu. Her kayıt, `POST /sync/push` için `{ table, row }`
 * çiftidir; `payload` satırın tamamıdır (camelCase JSON, en az `id` ve `updatedAt`).
 * Sıra `id` ile belirlenir (otomatik artan). Satır, repository'deki yazmayla aynı transaction'da eklenir.
 */
export const outbox = sqliteTable(
  'outbox',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    tableName: text('table_name').notNull().$type<SyncTableName>(),
    rowId: text('row_id').notNull(),
    payload: text('payload').notNull(),
    enqueuedAt: text('enqueued_at').notNull(),
    attemptCount: integer('attempt_count').notNull().default(0),
    lastError: text('last_error'),
  },
  (t) => [index('outbox_row_idx').on(t.tableName, t.rowId)],
);

export type OutboxRow = typeof outbox.$inferSelect;
export type NewOutboxRow = typeof outbox.$inferInsert;
