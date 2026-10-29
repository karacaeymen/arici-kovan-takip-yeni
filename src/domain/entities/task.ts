import { z } from 'zod';

import { idSchema } from '../shared/ids';
import { checkSyncMeta, ownedEntityShape } from '../shared/sync-meta';
import { NOTES_MAX_LENGTH, optionalText, requiredText } from '../shared/text';
import { calendarDateSchema, compareCalendarDates, timestampSchema } from '../shared/timestamps';

/** `rule`: takvim kural motorunun önerdiği görev (T4.6); `manual`: kullanıcının eklediği görev. */
export const taskSourceSchema = z.enum(['rule', 'manual']);
export const taskStatusSchema = z.enum(['pending', 'done', 'snoozed', 'dismissed']);

/** Takvim görevi. Bir arılığa, bir kovana ya da (ikisi de boşsa) tüm işletmeye ait olabilir. */
export const taskFields = z.object({
  ...ownedEntityShape,
  apiaryId: idSchema.nullable(),
  hiveId: idSchema.nullable(),
  source: taskSourceSchema,
  /** Görevi üreten kural (yalnızca `rule` kaynağında). */
  ruleId: z.string().trim().min(1).max(100).nullable(),
  /** Aynı önerinin tekrar üretilmesini önleyen anahtar (T4.6); yalnızca `rule` kaynağında. */
  dedupKey: z.string().trim().min(1).max(200).nullable(),
  title: requiredText(200),
  dueOn: calendarDateSchema,
  status: taskStatusSchema,
  completedAt: timestampSchema.nullable(),
  snoozedUntil: calendarDateSchema.nullable(),
  notes: optionalText(NOTES_MAX_LENGTH),
});

export const taskSchema = taskFields.superRefine((value, ctx) => {
  checkSyncMeta(value, ctx);
  const isRule = value.source === 'rule';
  const ruleFields = [value.ruleId, value.dedupKey];
  const ruleInfoValid = isRule
    ? ruleFields.every((field) => field !== null)
    : ruleFields.every((field) => field === null);
  if (!ruleInfoValid) {
    ctx.addIssue({
      code: 'custom',
      path: ['ruleId'],
      message: isRule
        ? 'Kural görevinde kural kimliği ve tekilleştirme anahtarı zorunlu'
        : 'Elle eklenen görevde kural bilgisi olamaz',
    });
  }
  if ((value.status === 'done') !== (value.completedAt !== null)) {
    ctx.addIssue({
      code: 'custom',
      path: ['completedAt'],
      message: 'Tamamlanma zamanı yalnızca tamamlanan görevde bulunur',
    });
  }
  if ((value.status === 'snoozed') !== (value.snoozedUntil !== null)) {
    ctx.addIssue({
      code: 'custom',
      path: ['snoozedUntil'],
      message: 'Erteleme tarihi yalnızca ertelenen görevde bulunur',
    });
  } else if (
    value.snoozedUntil !== null &&
    compareCalendarDates(value.snoozedUntil, value.dueOn) <= 0
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['snoozedUntil'],
      message: 'Erteleme tarihi görev tarihinden sonra olmalı',
    });
  }
});

export type TaskSource = z.infer<typeof taskSourceSchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type Task = z.infer<typeof taskSchema>;
