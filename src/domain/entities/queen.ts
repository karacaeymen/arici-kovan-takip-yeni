import { z } from 'zod';

import { idSchema } from '../shared/ids';
import { checkSyncMeta, ownedEntityShape } from '../shared/sync-meta';
import { NOTES_MAX_LENGTH, optionalText } from '../shared/text';
import { calendarDateSchema, compareCalendarDates } from '../shared/timestamps';

export const queenOriginSchema = z.enum(['own_rearing', 'purchased', 'swarm', 'unknown']);
export const queenEndReasonSchema = z.enum(['replaced', 'died', 'swarmed', 'unknown']);

/**
 * Kraliçe kaydı. Bir kovanın kraliçe geçmişi bu kayıtlardan oluşur; `endedOn` boş olan kayıt
 * kovanın şu anki kraliçesidir. İşaret rengi doğum yılından hesaplanır (T2.5).
 */
export const queenFields = z.object({
  ...ownedEntityShape,
  hiveId: idSchema,
  birthYear: z.int().min(2000).max(2100).nullable(),
  isMarked: z.boolean(),
  origin: queenOriginSchema,
  introducedOn: calendarDateSchema,
  endedOn: calendarDateSchema.nullable(),
  endReason: queenEndReasonSchema.nullable(),
  notes: optionalText(NOTES_MAX_LENGTH),
});

export const queenSchema = queenFields.superRefine((value, ctx) => {
  checkSyncMeta(value, ctx);
  if ((value.endedOn === null) !== (value.endReason === null)) {
    ctx.addIssue({
      code: 'custom',
      path: ['endReason'],
      message: 'Bitiş tarihi ve bitiş nedeni birlikte girilmeli',
    });
  }
  if (value.endedOn !== null && compareCalendarDates(value.endedOn, value.introducedOn) < 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['endedOn'],
      message: 'Bitiş tarihi veriliş tarihinden önce olamaz',
    });
  }
});

export type QueenOrigin = z.infer<typeof queenOriginSchema>;
export type QueenEndReason = z.infer<typeof queenEndReasonSchema>;
export type Queen = z.infer<typeof queenSchema>;
