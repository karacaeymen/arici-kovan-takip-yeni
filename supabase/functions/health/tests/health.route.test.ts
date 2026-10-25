import { assertEquals } from '@std/assert';

import { createRouter } from '../../_shared/http/router.ts';
import { registerHealthRoute } from '../routes/health.route.ts';
import type { HealthReport, HealthService } from '../services/health.service.ts';

// Route testi: servis stub'lanır, yalnızca istek → yanıt eşlemesi denenir.
function appWith(report: HealthReport | Error) {
  const service: HealthService = {
    check: () => (report instanceof Error ? Promise.reject(report) : Promise.resolve(report)),
  };
  const app = createRouter('health');
  registerHealthRoute(app, service);
  return app;
}

const okReport: HealthReport = {
  status: 'ok',
  time: '2026-05-01T08:00:00.000Z',
  checks: { database: 'ok' },
};

Deno.test('GET /health → 200 ve rapor', async () => {
  const res = await appWith(okReport).request('/health');
  assertEquals(res.status, 200);
  assertEquals(await res.json(), okReport);
});

Deno.test('veritabanı yoksa GET /health → 503', async () => {
  const res = await appWith({
    ...okReport,
    status: 'degraded',
    checks: { database: 'error' },
  }).request('/health');
  assertEquals(res.status, 503);
});

Deno.test('bilinmeyen yol → 404, ortak hata biçimi', async () => {
  const res = await appWith(okReport).request('/health/yok');
  assertEquals(res.status, 404);
  assertEquals((await res.json()).error.code, 'not_found');
});

Deno.test('servis beklenmeyen hata fırlatırsa → 500 internal_error', async () => {
  const res = await appWith(new Error('patladı')).request('/health');
  assertEquals(res.status, 500);
  assertEquals((await res.json()).error.code, 'internal_error');
});

Deno.test('CORS ön isteği (OPTIONS) yanıtlanır', async () => {
  const res = await appWith(okReport).request('/health', { method: 'OPTIONS' });
  assertEquals(res.status, 204);
  assertEquals(res.headers.get('access-control-allow-origin'), '*');
});
