import { index, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type { LocationSource } from '../../../domain/entities/apiary';

import { ownedColumns } from './columns';

export const apiaries = sqliteTable(
  'apiaries',
  {
    ...ownedColumns(),
    name: text('name').notNull(),
    climateProfileCode: text('climate_profile_code'),
    latitude: real('latitude'),
    longitude: real('longitude'),
    locationSource: text('location_source').$type<LocationSource>(),
    notes: text('notes'),
  },
  (t) => [index('apiaries_business_id_idx').on(t.businessId)],
);

export type ApiaryRow = typeof apiaries.$inferSelect;
export type NewApiaryRow = typeof apiaries.$inferInsert;
