import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { idColumn, syncColumns } from './columns';

/** İşletme. Tablo adı sunucudakiyle aynı (`businesses`); dosya adı TODO.md'deki gibi tekil. */
export const businesses = sqliteTable('businesses', {
  id: idColumn(),
  ownerId: text('owner_id').notNull(),
  name: text('name').notNull(),
  ...syncColumns(),
});

export type BusinessRow = typeof businesses.$inferSelect;
export type NewBusinessRow = typeof businesses.$inferInsert;
