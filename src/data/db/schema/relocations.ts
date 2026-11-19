import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { ownedColumns } from './columns';

export const relocations = sqliteTable(
  'relocations',
  {
    ...ownedColumns(),
    hiveId: text('hive_id').notNull(),
    fromApiaryId: text('from_apiary_id').notNull(),
    toApiaryId: text('to_apiary_id').notNull(),
    movedAt: text('moved_at').notNull(),
    notes: text('notes'),
  },
  (t) => [
    index('relocations_business_id_idx').on(t.businessId),
    index('relocations_hive_id_idx').on(t.hiveId),
  ],
);

export type RelocationRow = typeof relocations.$inferSelect;
export type NewRelocationRow = typeof relocations.$inferInsert;
