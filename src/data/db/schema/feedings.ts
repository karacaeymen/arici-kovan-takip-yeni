import { index, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type { FeedType, FeedUnit } from '../../../domain/entities/feeding';

import { ownedColumns } from './columns';

export const feedings = sqliteTable(
  'feedings',
  {
    ...ownedColumns(),
    hiveId: text('hive_id').notNull(),
    fedOn: text('fed_on').notNull(),
    feedType: text('feed_type').notNull().$type<FeedType>(),
    amount: real('amount').notNull(),
    unit: text('unit').notNull().$type<FeedUnit>(),
    notes: text('notes'),
  },
  (t) => [
    index('feedings_business_id_idx').on(t.businessId),
    index('feedings_hive_id_idx').on(t.hiveId),
  ],
);

export type FeedingRow = typeof feedings.$inferSelect;
export type NewFeedingRow = typeof feedings.$inferInsert;
