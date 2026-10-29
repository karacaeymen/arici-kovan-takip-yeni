import { z } from 'zod';

import { requireUser } from '../../_shared/auth/require-user.ts';
import { AppError } from '../../_shared/http/errors.ts';
import { ok } from '../../_shared/http/response.ts';
import type { Router } from '../../_shared/http/router.ts';
import { parseQuery } from '../../_shared/validation/parse.ts';
import {
  createDefaultSyncPullService,
  type SyncPullService,
} from '../services/sync-pull.service.ts';
import { DEFAULT_PULL_LIMIT, MAX_PULL_LIMIT } from '../services/sync-protocol.ts';

const querySchema = z.object({
  protocolVersion: z.coerce.number().int().positive(),
  cursor: z.coerce.number().int().min(0).max(Number.MAX_SAFE_INTEGER).default(0),
  limit: z.coerce.number().int().min(1).max(MAX_PULL_LIMIT).default(DEFAULT_PULL_LIMIT),
});

/** GET /sync/pull?protocolVersion=1&cursor=0&limit=200 — imleçten sonraki değişiklikleri döndürür. */
export function registerPullRoute(
  app: Router,
  makeService: (authorization: string) => SyncPullService = createDefaultSyncPullService,
): void {
  app.get('/pull', async (c) => {
    const user = requireUser(c);
    const query = parseQuery(c, querySchema);
    const outcome = await makeService(user.authorization).pull(query);
    if (outcome.kind === 'unsupported_protocol') {
      throw new AppError('unsupported_protocol', 426, 'Uygulamanın güncellenmesi gerekiyor.', {
        supported: outcome.supported,
      });
    }
    const { changes, cursor, hasMore } = outcome;
    return ok(c, { changes, cursor, hasMore });
  });
}
