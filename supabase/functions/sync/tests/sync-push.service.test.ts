import { assertEquals, assertRejects } from '@std/assert';

import type { ApplyResultRow, SyncRepository } from '../repositories/sync.repository.ts';
import {
  createSyncPushService,
  type PushChange,
  toRejectReason,
} from '../services/sync-push.service.ts';

type Call = { table: string; rows: Record<string, unknown>[] };

/** Her satırı `decide` ile yanıtlayan sahte repository; çağrıları kaydeder. */
function fakeRepo(decide: (row: Record<string, unknown>) => ApplyResultRow = applied) {
  const calls: Call[] = [];
  const repository: SyncRepository = {
    applyChanges(table, rows) {
      calls.push({ table, rows });
      return Promise.resolve(rows.map(decide));
    },
    changesSince: () => Promise.reject(new Error('kullanılmamalı')),
  };
  return { repository, calls };
}

function applied(row: Record<string, unknown>): ApplyResultRow {
  return { id: String(row.id), status: 'applied', error: null };
}

const change = (table: PushChange['table'], id: string, extra = {}): PushChange => ({
  table,
  row: { id, updatedAt: '2026-10-01T08:00:00Z', ...extra },
});

Deno.test('desteklenmeyen protokol sürümünde repository çağrılmaz', async () => {
  const { repository, calls } = fakeRepo();
  const outcome = await createSyncPushService({ repository }).push({
    protocolVersion: 99,
    changes: [change('hives', 'h1')],
  });
  assertEquals(outcome, { kind: 'unsupported_protocol', supported: 1 });
  assertEquals(calls.length, 0);
});

Deno.test(
  'tablolar ebeveynden çocuğa sırayla uygulanır, sonuçlar girdi sırasıyla döner',
  async () => {
    const { repository, calls } = fakeRepo();
    const outcome = await createSyncPushService({ repository }).push({
      protocolVersion: 1,
      changes: [change('inspections', 'i1'), change('hives', 'h1'), change('apiaries', 'a1')],
    });
    assertEquals(
      calls.map((call) => call.table),
      ['apiaries', 'hives', 'inspections'],
    );
    assertEquals(outcome.kind === 'ok' && outcome.results.map((r) => `${r.table}:${r.id}`), [
      'inspections:i1',
      'hives:h1',
      'apiaries:a1',
    ]);
  },
);

Deno.test('satırlar snake_case olarak gönderilir', async () => {
  const { repository, calls } = fakeRepo();
  await createSyncPushService({ repository }).push({
    protocolVersion: 1,
    changes: [change('hives', 'h1', { apiaryId: 'a1' })],
  });
  assertEquals(calls[0]!.rows[0], {
    id: 'h1',
    updated_at: '2026-10-01T08:00:00Z',
    apiary_id: 'a1',
  });
});

Deno.test('partiler batchSize ile bölünür', async () => {
  const { repository, calls } = fakeRepo();
  const changes = ['h1', 'h2', 'h3', 'h4', 'h5'].map((id) => change('hives', id));
  await createSyncPushService({ repository, batchSize: 2 }).push({ protocolVersion: 1, changes });
  assertEquals(
    calls.map((call) => call.rows.map((row) => row.id)),
    [['h1', 'h2'], ['h3', 'h4'], ['h5']],
  );
});

Deno.test('reddedilen satır nedeniyle, diğerleri durumlarıyla döner', async () => {
  const { repository } = fakeRepo((row) =>
    row.id === 'bad'
      ? { id: 'bad', status: 'rejected', error: '23514' }
      : { id: String(row.id), status: 'stale', error: null },
  );
  const outcome = await createSyncPushService({ repository }).push({
    protocolVersion: 1,
    changes: [change('hives', 'ok'), change('hives', 'bad')],
  });
  assertEquals(outcome, {
    kind: 'ok',
    results: [
      { table: 'hives', id: 'ok', status: 'stale' },
      { table: 'hives', id: 'bad', status: 'rejected', reason: 'invalid_row' },
    ],
  });
});

Deno.test('veritabanı eksik sonuç dönerse hata fırlatılır', async () => {
  const repository: SyncRepository = {
    applyChanges: () => Promise.resolve([]),
    changesSince: () => Promise.resolve([]),
  };
  await assertRejects(() =>
    createSyncPushService({ repository }).push({
      protocolVersion: 1,
      changes: [change('hives', 'h1')],
    }),
  );
});

Deno.test('SQLSTATE → neden eşlemesi', () => {
  assertEquals(toRejectReason('clock_skew'), 'clock_skew');
  assertEquals(toRejectReason('23503'), 'missing_parent');
  assertEquals(toRejectReason('42501'), 'forbidden');
  assertEquals(toRejectReason('23514'), 'invalid_row');
  assertEquals(toRejectReason('22P02'), 'invalid_row');
  assertEquals(toRejectReason('XX000'), 'unknown');
  assertEquals(toRejectReason(null), 'unknown');
});
