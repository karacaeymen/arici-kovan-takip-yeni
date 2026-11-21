import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type { QueenStatus, Temperament, VarroaMethod } from '../../../domain/entities/inspection';

import { ownedColumns } from './columns';

export const inspections = sqliteTable(
  'inspections',
  {
    ...ownedColumns(),
    hiveId: text('hive_id').notNull(),
    sessionId: text('session_id'),
    inspectedAt: text('inspected_at').notNull(),
    beeFrames: integer('bee_frames'),
    broodFrames: integer('brood_frames'),
    honeyFrames: integer('honey_frames'),
    queenStatus: text('queen_status').$type<QueenStatus>(),
    varroaMethod: text('varroa_method').$type<VarroaMethod>(),
    varroaMiteCount: integer('varroa_mite_count'),
    varroaSampleSize: integer('varroa_sample_size'),
    temperament: text('temperament').$type<Temperament>(),
    notes: text('notes'),
  },
  (t) => [
    index('inspections_business_id_idx').on(t.businessId),
    index('inspections_hive_id_idx').on(t.hiveId),
  ],
);

export type InspectionRow = typeof inspections.$inferSelect;
export type NewInspectionRow = typeof inspections.$inferInsert;
