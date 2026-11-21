import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { ownedColumns } from './columns';

export const harvests = sqliteTable(
  'harvests',
  {
    ...ownedColumns(),
    hiveId: text('hive_id').notNull(),
    harvestedOn: text('harvested_on').notNull(),
    frameCount: integer('frame_count'),
    weightKg: real('weight_kg'),
    withdrawalWarningAcknowledged: integer('withdrawal_warning_acknowledged', {
      mode: 'boolean',
    }).notNull(),
    notes: text('notes'),
  },
  (t) => [
    index('harvests_business_id_idx').on(t.businessId),
    index('harvests_hive_id_idx').on(t.hiveId),
  ],
);

export type HarvestRow = typeof harvests.$inferSelect;
export type NewHarvestRow = typeof harvests.$inferInsert;
