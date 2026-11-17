import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type { HiveStatus } from '../../../domain/entities/hive';

import { ownedColumns } from './columns';

export const hives = sqliteTable(
  'hives',
  {
    ...ownedColumns(),
    apiaryId: text('apiary_id').notNull(),
    number: integer('number').notNull(),
    name: text('name'),
    status: text('status').notNull().$type<HiveStatus>(),
    notes: text('notes'),
  },
  (t) => [
    index('hives_business_id_idx').on(t.businessId),
    index('hives_apiary_id_idx').on(t.apiaryId),
  ],
);

export type HiveRow = typeof hives.$inferSelect;
export type NewHiveRow = typeof hives.$inferInsert;
