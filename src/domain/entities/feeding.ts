import { z } from 'zod';

import { idSchema } from '../shared/ids';
import { checkSyncMeta, ownedEntityShape } from '../shared/sync-meta';
import { NOTES_MAX_LENGTH, optionalText } from '../shared/text';
import { calendarDateSchema } from '../shared/timestamps';

export const feedTypeSchema = z.enum(['sugar_syrup', 'fondant', 'pollen_patty', 'honey', 'other']);
export const feedUnitSchema = z.enum(['kg', 'l']);

/** Besleme kaydı (T3.4). Çoklu kovana besleme, kovan başına bir kayıt olarak saklanır. */
export const feedingFields = z.object({
  ...ownedEntityShape,
  hiveId: idSchema,
  fedOn: calendarDateSchema,
  feedType: feedTypeSchema,
  amount: z.number().positive().max(1000),
  unit: feedUnitSchema,
  notes: optionalText(NOTES_MAX_LENGTH),
});

export const feedingSchema = feedingFields.superRefine(checkSyncMeta);

export type FeedType = z.infer<typeof feedTypeSchema>;
export type FeedUnit = z.infer<typeof feedUnitSchema>;
export type Feeding = z.infer<typeof feedingSchema>;
