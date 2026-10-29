import { z } from 'zod';

import { idSchema } from '../shared/ids';
import { checkSyncMeta, ownedEntityShape } from '../shared/sync-meta';
import { NOTES_MAX_LENGTH, optionalText } from '../shared/text';
import { calendarDateSchema, compareCalendarDates } from '../shared/timestamps';

/**
 * İlaçlama kaydı (T3.3). Ürün referans içerikten seçilir; arınma süresi kayıt anında ürün
 * verisinden kopyalanır, böylece referans içerik sonradan değişse de eski kayıtların hesabı bozulmaz.
 */
export const treatmentFields = z.object({
  ...ownedEntityShape,
  hiveId: idSchema,
  productCode: z.string().trim().min(1).max(50),
  startedOn: calendarDateSchema,
  endedOn: calendarDateSchema.nullable(),
  dose: optionalText(100),
  /** Uygulama bitiminden sonra bal hasadı yapılmaması gereken gün sayısı. */
  withdrawalDays: z.int().min(0).max(365),
  notes: optionalText(NOTES_MAX_LENGTH),
});

export const treatmentSchema = treatmentFields.superRefine((value, ctx) => {
  checkSyncMeta(value, ctx);
  if (value.endedOn !== null && compareCalendarDates(value.endedOn, value.startedOn) < 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['endedOn'],
      message: 'Bitiş tarihi başlangıçtan önce olamaz',
    });
  }
});

export type Treatment = z.infer<typeof treatmentSchema>;
