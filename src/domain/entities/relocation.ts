import { z } from 'zod';

import { idSchema } from '../shared/ids';
import { checkSyncMeta, ownedEntityShape } from '../shared/sync-meta';
import { NOTES_MAX_LENGTH, optionalText } from '../shared/text';
import { timestampSchema } from '../shared/timestamps';

/** Kovan taşıma kaydı (T2.6). Kovanın `apiaryId` alanı aynı işlemde hedef arılığa güncellenir. */
export const relocationFields = z.object({
  ...ownedEntityShape,
  hiveId: idSchema,
  fromApiaryId: idSchema,
  toApiaryId: idSchema,
  movedAt: timestampSchema,
  notes: optionalText(NOTES_MAX_LENGTH),
});

export const relocationSchema = relocationFields.superRefine((value, ctx) => {
  checkSyncMeta(value, ctx);
  if (value.fromApiaryId === value.toApiaryId) {
    ctx.addIssue({
      code: 'custom',
      path: ['toApiaryId'],
      message: 'Hedef arılık mevcut arılıktan farklı olmalı',
    });
  }
});

export type Relocation = z.infer<typeof relocationSchema>;
