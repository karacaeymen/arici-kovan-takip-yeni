import { assertEquals, assertThrows } from '@std/assert';

import { createFixedClock, systemClock } from '../clock.ts';

Deno.test('createFixedClock verilen anı döner ve ileri alınabilir', () => {
  const clock = createFixedClock('2026-05-01T08:00:00Z');
  assertEquals(clock.now().toISOString(), '2026-05-01T08:00:00.000Z');
  clock.advance(60 * 60 * 1000);
  assertEquals(clock.now().toISOString(), '2026-05-01T09:00:00.000Z');
  clock.set('2027-01-01T00:00:00Z');
  assertEquals(clock.now().getUTCFullYear(), 2027);
});

Deno.test('createFixedClock geçersiz tarihte hata verir', () => {
  assertThrows(() => createFixedClock('tarih-degil'), Error, 'Geçersiz tarih');
});

Deno.test('systemClock gerçek zamanı döner', () => {
  const before = Date.now();
  const now = systemClock.now().getTime();
  assertEquals(now >= before && now <= Date.now(), true);
});
