import { assertEquals } from '@std/assert';

import { createFixedClock } from '../../_shared/clock.ts';
import type { HealthRepository } from '../repositories/health.repository.ts';
import { createHealthService } from '../services/health.service.ts';

const clock = createFixedClock('2026-05-01T08:00:00Z');
const repo = (ping: HealthRepository['ping']): HealthRepository => ({ ping });

Deno.test('veritabanı cevap verirse durum ok', async () => {
  const service = createHealthService({ repository: repo(() => Promise.resolve(true)), clock });
  assertEquals(await service.check(), {
    status: 'ok',
    time: '2026-05-01T08:00:00.000Z',
    checks: { database: 'ok' },
  });
});

Deno.test('veritabanı false dönerse durum degraded', async () => {
  const service = createHealthService({ repository: repo(() => Promise.resolve(false)), clock });
  const report = await service.check();
  assertEquals(report.status, 'degraded');
  assertEquals(report.checks.database, 'error');
});

Deno.test('veritabanı hata fırlatırsa durum degraded olur, servis çökmez', async () => {
  const service = createHealthService({
    repository: repo(() => Promise.reject(new Error('bağlantı yok'))),
    clock,
  });
  assertEquals((await service.check()).status, 'degraded');
});
