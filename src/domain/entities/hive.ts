import { z } from 'zod';

import { idSchema } from '../shared/ids';
import { checkSyncMeta, ownedEntityShape } from '../shared/sync-meta';
import { NOTES_MAX_LENGTH, optionalText } from '../shared/text';

/** Kovanın durumu. Yalnızca `active` kovanlar denetim ve takvim önerilerine girer. */
export const hiveStatusSchema = z.enum(['active', 'dead', 'sold', 'merged']);

/** Kovan. Numara işletme içinde kovanı tanıtır; QR etiketi kimlik (`id`) taşır (T2.7). */
export const hiveFields = z.object({
  ...ownedEntityShape,
  apiaryId: idSchema,
  number: z.int().min(1).max(99_999),
  name: optionalText(50),
  status: hiveStatusSchema,
  notes: optionalText(NOTES_MAX_LENGTH),
});

export const hiveSchema = hiveFields.superRefine(checkSyncMeta);

export type HiveStatus = z.infer<typeof hiveStatusSchema>;
export type Hive = z.infer<typeof hiveSchema>;
