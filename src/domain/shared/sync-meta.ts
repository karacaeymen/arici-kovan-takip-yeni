import { z } from 'zod';

import { idSchema } from './ids';
import { compareTimestamps, timestampSchema } from './timestamps';

/**
 * Senkron meta alanları. Çakışmalar "son yazan kazanır" (LWW) ile `updatedAt` üzerinden çözülür;
 * silme, kaydı kaldırmak yerine `deletedAt` doldurularak yapılır (diğer cihazlara yayılabilsin diye).
 */
export const syncMetaShape = {
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  deletedAt: timestampSchema.nullable(),
};

/** Bir işletmeye ait her kaydın ortak alanları (işletme kaydının kendisi hariç). */
export const ownedEntityShape = {
  id: idSchema,
  businessId: idSchema,
  ...syncMetaShape,
};

export type SyncMeta = z.infer<z.ZodObject<typeof syncMetaShape>>;

/** `updatedAt` ve `deletedAt`, `createdAt`'ten önce olamaz. Varlık şemalarında `superRefine` içinde çağrılır. */
export function checkSyncMeta(value: SyncMeta, ctx: z.RefinementCtx): void {
  if (compareTimestamps(value.updatedAt, value.createdAt) < 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['updatedAt'],
      message: 'Güncellenme zamanı oluşturulma zamanından önce olamaz',
    });
  }
  if (value.deletedAt !== null && compareTimestamps(value.deletedAt, value.createdAt) < 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['deletedAt'],
      message: 'Silinme zamanı oluşturulma zamanından önce olamaz',
    });
  }
}

/** Kaydın silinmiş (çöp kutusunda) olup olmadığı. */
export function isDeleted(value: Pick<SyncMeta, 'deletedAt'>): boolean {
  return value.deletedAt !== null;
}
