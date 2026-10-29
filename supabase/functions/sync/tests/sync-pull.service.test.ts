import { assertEquals } from '@std/assert';

import type { ChangeRow, SyncRepository } from '../repositories/sync.repository.ts';
import { createSyncPullService } from '../services/sync-pull.service.ts';

function fakeRepo(rows: ChangeRow[]) {
  const calls: { cursor: number; limit: number }[] = [];
  const repository: SyncRepository = {
    applyChanges: () => Promise.reject(new Error('kullanılmamalı')),
    changesSince(cursor, limit) {
      calls.push({ cursor, limit });
      return Promise.resolve(rows.filter((row) => row.seq > cursor).slice(0, limit));
    },
  };
  return { repository, calls };
}

const rows: ChangeRow[] = [
  { table_name: 'businesses', seq: 3, row_data: { id: 'b1', owner_id: 'u1' } },
  { table_name: 'apiaries', seq: 5, row_data: { id: 'a1', business_id: 'b1' } },
  { table_name: 'hives', seq: 9, row_data: { id: 'h1', apiary_id: 'a1' } },
];

Deno.test('desteklenmeyen protokol sürümünde repository çağrılmaz', async () => {
  const { repository, calls } = fakeRepo(rows);
  const outcome = await createSyncPullService({ repository }).pull({
    protocolVersion: 2,
    cursor: 0,
    limit: 10,
  });
  assertEquals(outcome, { kind: 'unsupported_protocol', supported: 1 });
  assertEquals(calls.length, 0);
});

Deno.test('değişiklikler camelCase döner, imleç son satırın numarasıdır', async () => {
  const { repository } = fakeRepo(rows);
  const outcome = await createSyncPullService({ repository }).pull({
    protocolVersion: 1,
    cursor: 0,
    limit: 10,
  });
  assertEquals(outcome, {
    kind: 'ok',
    changes: [
      { table: 'businesses', row: { id: 'b1', ownerId: 'u1' } },
      { table: 'apiaries', row: { id: 'a1', businessId: 'b1' } },
      { table: 'hives', row: { id: 'h1', apiaryId: 'a1' } },
    ],
    cursor: 9,
    hasMore: false,
  });
});

Deno.test('limitten fazlası varsa hasMore true, imleç sayfanın sonundadır', async () => {
  const { repository, calls } = fakeRepo(rows);
  const outcome = await createSyncPullService({ repository }).pull({
    protocolVersion: 1,
    cursor: 0,
    limit: 2,
  });
  assertEquals(calls, [{ cursor: 0, limit: 3 }]);
  assertEquals(outcome.kind === 'ok' && [outcome.changes.length, outcome.cursor, outcome.hasMore], [
    2,
    5,
    true,
  ]);
});

Deno.test('yeni değişiklik yoksa imleç aynı kalır', async () => {
  const { repository } = fakeRepo(rows);
  const outcome = await createSyncPullService({ repository }).pull({
    protocolVersion: 1,
    cursor: 9,
    limit: 10,
  });
  assertEquals(outcome, { kind: 'ok', changes: [], cursor: 9, hasMore: false });
});
