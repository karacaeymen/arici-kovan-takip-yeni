import { z } from 'zod';

import { idSchema } from '../shared/ids';
import { checkSyncMeta, syncMetaShape } from '../shared/sync-meta';
import { requiredText } from '../shared/text';

/** Arıcılık işletmesi. Tüm veriler bir işletmeye bağlıdır; RLS bu kimlik üzerinden izole eder. */
export const businessFields = z.object({
  id: idSchema,
  /** İşletmeyi açan Supabase Auth kullanıcısı. */
  ownerId: idSchema,
  name: requiredText(100),
  ...syncMetaShape,
});

export const businessSchema = businessFields.superRefine(checkSyncMeta);

export type Business = z.infer<typeof businessSchema>;
