import { assertEquals } from '@std/assert';

import { requireUser } from '../auth/require-user.ts';
import { createRouter } from '../http/router.ts';
import { fakeJwt } from './fake-jwt.ts';

function app() {
  const router = createRouter('test');
  router.get('/', (c) => c.json(requireUser(c)));
  return router;
}

const call = (authorization?: string) =>
  app().request('/test', authorization ? { headers: { authorization } } : {});

Deno.test('kullanıcı belirteciyle kullanıcı kimliği ve başlık döner', async () => {
  const token = fakeJwt({ sub: 'user-1', role: 'authenticated', name: 'Arıcı Ömer' });
  const res = await call(`Bearer ${token}`);
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { userId: 'user-1', authorization: `Bearer ${token}` });
});

Deno.test('başlık yoksa 401', async () => {
  const res = await call();
  assertEquals(res.status, 401);
  assertEquals((await res.json()).error.code, 'unauthorized');
});

Deno.test('anon anahtarıyla gelen istek 401', async () => {
  const res = await call(`Bearer ${fakeJwt({ role: 'anon' })}`);
  assertEquals(res.status, 401);
});

Deno.test('bozuk belirteç 401', async () => {
  for (const value of [
    'Bearer',
    'Bearer abc',
    'Bearer a.%%%.c',
    'Basic xyz',
    'Bearer a.bnVsbA.c',
  ]) {
    assertEquals((await call(value)).status, 401, value);
  }
});

Deno.test('sub olmayan kullanıcı belirteci 401', async () => {
  const res = await call(`Bearer ${fakeJwt({ role: 'authenticated' })}`);
  assertEquals(res.status, 401);
});
