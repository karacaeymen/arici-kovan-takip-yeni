import { z } from 'zod';

import { idSchema } from '../shared/ids';
import { checkSyncMeta, ownedEntityShape } from '../shared/sync-meta';
import { NOTES_MAX_LENGTH, optionalText } from '../shared/text';
import { timestampSchema } from '../shared/timestamps';

export const queenStatusSchema = z.enum(['seen', 'eggs_seen', 'not_seen', 'queenless']);
export const varroaMethodSchema = z.enum(['alcohol_wash', 'sugar_roll', 'sticky_board']);
export const temperamentSchema = z.enum(['calm', 'nervous', 'aggressive']);

const frameCount = z.int().min(0).max(40);

/** Kovan denetimi (T3.1). Toplu denetim oturumundaki kayıtlar `sessionId` ile gruplanır (T3.2). */
export const inspectionFields = z.object({
  ...ownedEntityShape,
  hiveId: idSchema,
  sessionId: idSchema.nullable(),
  inspectedAt: timestampSchema,
  beeFrames: frameCount.nullable(),
  broodFrames: frameCount.nullable(),
  honeyFrames: frameCount.nullable(),
  queenStatus: queenStatusSchema.nullable(),
  varroaMethod: varroaMethodSchema.nullable(),
  /** Örnekte sayılan akar. */
  varroaMiteCount: z.int().min(0).max(10_000).nullable(),
  /** Örnekteki arı sayısı; yapışkan tabla yönteminde kullanılmaz. */
  varroaSampleSize: z.int().min(1).max(10_000).nullable(),
  temperament: temperamentSchema.nullable(),
  notes: optionalText(NOTES_MAX_LENGTH),
});

export const inspectionSchema = inspectionFields.superRefine((value, ctx) => {
  checkSyncMeta(value, ctx);
  const { varroaMethod, varroaMiteCount, varroaSampleSize } = value;
  if ((varroaMethod === null) !== (varroaMiteCount === null)) {
    ctx.addIssue({
      code: 'custom',
      path: ['varroaMiteCount'],
      message: 'Varroa yöntemi ve akar sayısı birlikte girilmeli',
    });
  }
  const needsSample = varroaMethod === 'alcohol_wash' || varroaMethod === 'sugar_roll';
  if (needsSample !== (varroaSampleSize !== null)) {
    ctx.addIssue({
      code: 'custom',
      path: ['varroaSampleSize'],
      message: needsSample
        ? 'Bu yöntemde örnekteki arı sayısı girilmeli'
        : 'Örnek arı sayısı yalnızca yıkama ve pudra şekeri yönteminde girilir',
    });
  }
});

export type QueenStatus = z.infer<typeof queenStatusSchema>;
export type VarroaMethod = z.infer<typeof varroaMethodSchema>;
export type Temperament = z.infer<typeof temperamentSchema>;
export type Inspection = z.infer<typeof inspectionSchema>;
