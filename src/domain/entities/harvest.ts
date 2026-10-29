import { z } from 'zod';

import { idSchema } from '../shared/ids';
import { checkSyncMeta, ownedEntityShape } from '../shared/sync-meta';
import { NOTES_MAX_LENGTH, optionalText } from '../shared/text';
import { calendarDateSchema } from '../shared/timestamps';

/** Bal sağımı kaydı (T3.5). */
export const harvestFields = z.object({
  ...ownedEntityShape,
  hiveId: idSchema,
  harvestedOn: calendarDateSchema,
  frameCount: z.int().min(1).max(100).nullable(),
  weightKg: z.number().positive().max(1000).nullable(),
  /** Arınma süresi uyarısına rağmen kaydın bilerek girildiği (T3.5). */
  withdrawalWarningAcknowledged: z.boolean(),
  notes: optionalText(NOTES_MAX_LENGTH),
});

export const harvestSchema = harvestFields.superRefine((value, ctx) => {
  checkSyncMeta(value, ctx);
  if (value.frameCount === null && value.weightKg === null) {
    ctx.addIssue({
      code: 'custom',
      path: ['weightKg'],
      message: 'Çerçeve sayısı ya da ağırlıktan en az biri girilmeli',
    });
  }
});

export type Harvest = z.infer<typeof harvestSchema>;
