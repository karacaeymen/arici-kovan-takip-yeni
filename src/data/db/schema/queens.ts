import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type { QueenEndReason, QueenOrigin } from '../../../domain/entities/queen';

import { ownedColumns } from './columns';

export const queens = sqliteTable(
  'queens',
  {
    ...ownedColumns(),
    hiveId: text('hive_id').notNull(),
    birthYear: integer('birth_year'),
    isMarked: integer('is_marked', { mode: 'boolean' }).notNull(),
    origin: text('origin').notNull().$type<QueenOrigin>(),
    introducedOn: text('introduced_on').notNull(),
    endedOn: text('ended_on'),
    endReason: text('end_reason').$type<QueenEndReason>(),
    notes: text('notes'),
  },
  (t) => [
    index('queens_business_id_idx').on(t.businessId),
    index('queens_hive_id_idx').on(t.hiveId),
  ],
);

export type QueenRow = typeof queens.$inferSelect;
export type NewQueenRow = typeof queens.$inferInsert;
