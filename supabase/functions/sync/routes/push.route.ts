import { z } from 'zod';

import { requireUser } from '../../_shared/auth/require-user.ts';
import { AppError } from '../../_shared/http/errors.ts';
import { ok } from '../../_shared/http/response.ts';
import type { Router } from '../../_shared/http/router.ts';
import { parseBody } from '../../_shared/validation/parse.ts';
import {
  createDefaultSyncPushService,
  type SyncPushService,
} from '../services/sync-push.service.ts';
import { MAX_PUSH_CHANGES, SYNC_TABLES } from '../services/sync-protocol.ts';

const bodySchema = z.object({
  protocolVersion: z.int().positive(),
  changes: z
    .array(
      z.object({
        table: z.enum(SYNC_TABLES),
        // Alanların ayrıntılı doğrulaması veritabanı kısıtlarındadır; burada kimlik ve sürüm zorunlu.
        row: z.looseObject({ id: z.uuid(), updatedAt: z.iso.datetime({ offset: true }) }),
      }),
    )
    .min(1)
    .max(MAX_PUSH_CHANGES),
});

/** POST /sync/push — istemcideki değişiklikleri LWW ile sunucuya yazar; satır başına sonuç döner. */
export function registerPushRoute(
  app: Router,
  makeService: (authorization: string) => SyncPushService = createDefaultSyncPushService,
): void {
  app.post('/push', async (c) => {
    const user = requireUser(c);
    const body = await parseBody(c, bodySchema);
    const outcome = await makeService(user.authorization).push(body);
    if (outcome.kind === 'unsupported_protocol') {
      throw new AppError('unsupported_protocol', 426, 'Uygulamanın güncellenmesi gerekiyor.', {
        supported: outcome.supported,
      });
    }
    return ok(c, { results: outcome.results });
  });
}
