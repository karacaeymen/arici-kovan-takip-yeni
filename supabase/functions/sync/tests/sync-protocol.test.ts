import { assertEquals } from '@std/assert';

import { toCamelCaseRow, toSnakeCaseRow } from '../services/sync-protocol.ts';

Deno.test('camelCase → snake_case', () => {
  assertEquals(
    toSnakeCaseRow({ id: 'x', businessId: 'b', withdrawalWarningAcknowledged: true, notes: null }),
    { id: 'x', business_id: 'b', withdrawal_warning_acknowledged: true, notes: null },
  );
});

Deno.test('snake_case → camelCase', () => {
  assertEquals(toCamelCaseRow({ id: 'x', apiary_id: 'a', varroa_mite_count: 3 }), {
    id: 'x',
    apiaryId: 'a',
    varroaMiteCount: 3,
  });
});

Deno.test('iki yönlü dönüşüm alan adlarını korur', () => {
  const row = { hiveId: 'h', broodFrames: 4, snoozedUntil: '2026-01-01', isMarked: false };
  assertEquals(toCamelCaseRow(toSnakeCaseRow(row)), row);
});
