import { assertEquals } from '@std/assert';

import { userAuthorization } from '../../_shared/tests/fake-jwt.ts';
import { createRouter } from '../../_shared/http/router.ts';
import { registerPushRoute } from '../routes/push.route.ts';
import type { PushOutcome, SyncPushService } from '../services/sync-push.service.ts';

// Route testi: servis stub'lanır; doğrulama, kimlik ve yanıt eşlemesi denenir.
function appWith(outcome: PushOutcome) {
  const received: { authorization?: string; input?: unknown } = {};
  const app = createRouter('sync');
  registerPushRoute(app, (authorization): SyncPushService => {
    received.authorization = authorization;
    return {
      push: (input) => {
        received.input = input;
        return Promise.resolve(outcome);
      },
    };
  });
  return { app, received };
}

const HIVE = '30000000-0000-4000-8000-000000000001';
const validBody = {
  protocolVersion: 1,
  changes: [{ table: 'hives', row: { id: HIVE, updatedAt: '2026-10-01T08:00:00Z', number: 3 } }],
};
const okOutcome: PushOutcome = {
  kind: 'ok',
  results: [{ table: 'hives', id: HIVE, status: 'applied' }],
};

const post = (app: ReturnType<typeof appWith>['app'], body: unknown, authorization?: string) =>
  app.request('/sync/push', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(authorization ? { authorization } : {}),
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

Deno.test(
  'POST /sync/push → 200 ve satır sonuçları; servis kullanıcı başlığıyla kurulur',
  async () => {
    const { app, received } = appWith(okOutcome);
    const authorization = userAuthorization();
    const res = await post(app, validBody, authorization);
    assertEquals(res.status, 200);
    assertEquals(await res.json(), { results: okOutcome.results });
    assertEquals(received.authorization, authorization);
    assertEquals(received.input, validBody);
  },
);

Deno.test('oturum yoksa 401, servis çağrılmaz', async () => {
  const { app, received } = appWith(okOutcome);
  const res = await post(app, validBody);
  assertEquals(res.status, 401);
  assertEquals(received.input, undefined);
});

Deno.test('geçersiz gövde → 400 validation_failed', async () => {
  const { app } = appWith(okOutcome);
  const cases = [
    { ...validBody, changes: [] },
    { ...validBody, changes: [{ table: 'users', row: validBody.changes[0]!.row }] },
    { ...validBody, changes: [{ table: 'hives', row: { id: 'x', updatedAt: '2026-10-01' } }] },
    { changes: validBody.changes },
  ];
  for (const body of cases) {
    const res = await post(app, body, userAuthorization());
    assertEquals(res.status, 400, JSON.stringify(body));
    assertEquals((await res.json()).error.code, 'validation_failed');
  }
});

Deno.test('JSON olmayan gövde → 400 bad_request', async () => {
  const { app } = appWith(okOutcome);
  const res = await post(app, '{bozuk', userAuthorization());
  assertEquals(res.status, 400);
  assertEquals((await res.json()).error.code, 'bad_request');
});

Deno.test('desteklenmeyen protokol → 426', async () => {
  const { app } = appWith({ kind: 'unsupported_protocol', supported: 1 });
  const res = await post(app, { ...validBody, protocolVersion: 2 }, userAuthorization());
  assertEquals(res.status, 426);
  const body = await res.json();
  assertEquals(body.error.code, 'unsupported_protocol');
  assertEquals(body.error.details, { supported: 1 });
});
