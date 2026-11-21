import { assertEquals } from '@std/assert';

import { userAuthorization } from '../../_shared/tests/fake-jwt.ts';
import { createRouter } from '../../_shared/http/router.ts';
import { registerPullRoute } from '../routes/pull.route.ts';
import type { PullOutcome, SyncPullService } from '../services/sync-pull.service.ts';

function appWith(outcome: PullOutcome) {
  const received: { input?: unknown } = {};
  const app = createRouter('sync');
  registerPullRoute(app, (): SyncPullService => ({
    pull: (input) => {
      received.input = input;
      return Promise.resolve(outcome);
    },
  }));
  return { app, received };
}

const okOutcome: PullOutcome = {
  kind: 'ok',
  changes: [{ table: 'hives', row: { id: 'h1' } }],
  cursor: 42,
  hasMore: false,
};

const get = (app: ReturnType<typeof appWith>['app'], query: string, auth = true) =>
  app.request(
    `/sync/pull${query}`,
    auth ? { headers: { authorization: userAuthorization() } } : {},
  );

Deno.test('GET /sync/pull → 200; varsayılan imleç ve limit uygulanır', async () => {
  const { app, received } = appWith(okOutcome);
  const res = await get(app, '?protocolVersion=1');
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { changes: okOutcome.changes, cursor: 42, hasMore: false });
  assertEquals(received.input, { protocolVersion: 1, cursor: 0, limit: 200 });
});

Deno.test('imleç ve limit sorgudan okunur', async () => {
  const { app, received } = appWith(okOutcome);
  await get(app, '?protocolVersion=1&cursor=17&limit=50');
  assertEquals(received.input, { protocolVersion: 1, cursor: 17, limit: 50 });
});

Deno.test('oturum yoksa 401', async () => {
  const { app } = appWith(okOutcome);
  assertEquals((await get(app, '?protocolVersion=1', false)).status, 401);
});

Deno.test('geçersiz sorgu → 400', async () => {
  const { app } = appWith(okOutcome);
  for (const query of [
    '',
    '?protocolVersion=1&cursor=-1',
    '?protocolVersion=1&limit=501',
    '?protocolVersion=x',
  ]) {
    const res = await get(app, query);
    assertEquals(res.status, 400, query);
  }
});

Deno.test('desteklenmeyen protokol → 426', async () => {
  const { app } = appWith({ kind: 'unsupported_protocol', supported: 1 });
  const res = await get(app, '?protocolVersion=5');
  assertEquals(res.status, 426);
});
