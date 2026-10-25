import { assertEquals } from '@std/assert';

import { createFixedClock } from '../clock.ts';
import { createLogger } from '../observability/logger.ts';

function setup() {
  const lines: { level: string; body: Record<string, unknown> }[] = [];
  const clock = createFixedClock('2026-05-01T08:00:00Z');
  const sink = (level: string, line: string) => lines.push({ level, body: JSON.parse(line) });
  return { lines, clock, sink };
}

Deno.test('logger: function ve route alanlı JSON satırı yazar', () => {
  const { lines, clock, sink } = setup();
  createLogger({ function: 'health', route: 'GET /health' }, { clock, sink }).info('ok', { ms: 3 });

  assertEquals(lines, [
    {
      level: 'info',
      body: {
        level: 'info',
        time: '2026-05-01T08:00:00.000Z',
        function: 'health',
        route: 'GET /health',
        msg: 'ok',
        ms: 3,
      },
    },
  ]);
});

Deno.test('logger: Error alanını ad, mesaj ve yığınla yazar', () => {
  const { lines, clock, sink } = setup();
  createLogger({ function: 'sync' }, { clock, sink }).error('failed', {
    error: new TypeError('kötü'),
  });

  const error = lines[0]?.body.error as Record<string, unknown>;
  assertEquals(lines[0]?.level, 'error');
  assertEquals(error.name, 'TypeError');
  assertEquals(error.message, 'kötü');
  assertEquals(typeof error.stack, 'string');
});

Deno.test('logger: child bağlamı ve seçenekleri devralır', () => {
  const { lines, clock, sink } = setup();
  createLogger({ function: 'sync' }, { clock, sink })
    .child({ route: 'POST /sync/push', userId: 'u1' })
    .warn('slow');

  assertEquals(lines[0]?.body.route, 'POST /sync/push');
  assertEquals(lines[0]?.body.userId, 'u1');
  assertEquals(lines[0]?.body.time, '2026-05-01T08:00:00.000Z');
});
