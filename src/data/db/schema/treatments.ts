import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { ownedColumns } from './columns';

export const treatments = sqliteTable(
  'treatments',
  {
    ...ownedColumns(),
    hiveId: text('hive_id').notNull(),
    productCode: text('product_code').notNull(),
    startedOn: text('started_on').notNull(),
    endedOn: text('ended_on'),
    dose: text('dose'),
    withdrawalDays: integer('withdrawal_days').notNull(),
    notes: text('notes'),
  },
  (t) => [
    index('treatments_business_id_idx').on(t.businessId),
    index('treatments_hive_id_idx').on(t.hiveId),
  ],
);

export type TreatmentRow = typeof treatments.$inferSelect;
export type NewTreatmentRow = typeof treatments.$inferInsert;
