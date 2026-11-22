import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';

import * as serverProtocol from '../../../supabase/functions/sync/services/sync-protocol';
import { SYNC_TABLE_NAMES } from '../db/schema';

import {
  createSyncClient,
  type FunctionsInvoker,
  MAX_PULL_LIMIT,
  MAX_PUSH_CHANGES,
  type SyncChange,
  SYNC_PROTOCOL_VERSION,
  SYNC_TABLES,
  SyncRequestError,
  toSyncError,
} from './sync.client';

const ID_1 = '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e01';
const ID_2 = '0b6f2d3e-6f0a-4c1e-9d2b-1a2b3c4d5e02';
const change = (id: string, table: SyncChange['table'] = 'hives'): SyncChange => ({
  table,
  row: { id, updatedAt: '2026-11-01T08:00:00.000Z', number: 1 },
});

function setup(response: { data?: unknown; error?: unknown } | (() => never)) {
  const invoke = jest.fn<
    ReturnType<FunctionsInvoker['invoke']>,
    Parameters<FunctionsInvoker['invoke']>
  >(async () => {
    if (typeof response === 'function') return response();
    return { data: response.data ?? null, error: response.error ?? null };
  });
  return { invoke, client: createSyncClient({ invoke }) };
}

const expectKind = async (promise: Promise<unknown>, kind: SyncRequestError['kind']) => {
  await expect(promise).rejects.toBeInstanceOf(SyncRequestError);
  await expect(promise).rejects.toMatchObject({ kind });
};

describe('sync istemcisi: sunucu sözleşmesiyle uyum', () => {
  it('protokol sürümü, tablo sırası ve sınırlar sunucudakiyle aynıdır', () => {
    expect(SYNC_PROTOCOL_VERSION).toBe(serverProtocol.SYNC_PROTOCOL_VERSION);
    expect(SYNC_TABLES).toEqual(serverProtocol.SYNC_TABLES);
    expect(MAX_PUSH_CHANGES).toBe(serverProtocol.MAX_PUSH_CHANGES);
    expect(MAX_PULL_LIMIT).toBe(serverProtocol.MAX_PULL_LIMIT);
  });

  it('tablo listesi yerel veritabanının outbox tablolarıyla aynıdır', () => {
    expect(SYNC_TABLES).toEqual(SYNC_TABLE_NAMES);
  });
});

describe('push', () => {
  it('değişiklikleri protokol sürümüyle POST /sync/push olarak gönderir', async () => {
    const results = [
      { table: 'hives', id: ID_1, status: 'applied' },
      { table: 'hives', id: ID_2, status: 'rejected', reason: 'missing_parent' },
    ];
    const { invoke, client } = setup({ data: { results } });

    await expect(client.push([change(ID_1), change(ID_2)])).resolves.toEqual(results);
    expect(invoke).toHaveBeenCalledWith('sync/push', {
      method: 'POST',
      body: { protocolVersion: 1, changes: [change(ID_1), change(ID_2)] },
      timeout: 30_000,
    });
  });

  it('boş listede sunucuya gitmez', async () => {
    const { invoke, client } = setup({ data: { results: [] } });
    await expect(client.push([])).resolves.toEqual([]);
    expect(invoke).not.toHaveBeenCalled();
  });

  it(`${MAX_PUSH_CHANGES} değişiklikten fazlasını tek istekte göndermez`, async () => {
    const { invoke, client } = setup({ data: { results: [] } });
    const tooMany = Array.from({ length: MAX_PUSH_CHANGES + 1 }, () => change(ID_1));
    await expect(client.push(tooMany)).rejects.toThrow('en fazla 500');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('sunucunun tanımadığımız red nedenini unknown sayar', async () => {
    const { client } = setup({
      data: { results: [{ table: 'hives', id: ID_1, status: 'rejected', reason: 'yeni_neden' }] },
    });
    await expect(client.push([change(ID_1)])).resolves.toEqual([
      { table: 'hives', id: ID_1, status: 'rejected', reason: 'unknown' },
    ]);
  });

  it('sonuç sayısı ya da sırası gönderilenle eşleşmezse invalid_response verir', async () => {
    const swapped = setup({
      data: {
        results: [
          { table: 'hives', id: ID_2, status: 'applied' },
          { table: 'hives', id: ID_1, status: 'applied' },
        ],
      },
    });
    await expectKind(swapped.client.push([change(ID_1), change(ID_2)]), 'invalid_response');

    const missing = setup({ data: { results: [] } });
    await expectKind(missing.client.push([change(ID_1)]), 'invalid_response');
  });

  it('sözleşmeye uymayan yanıtta invalid_response verir', async () => {
    const { client } = setup({ data: { sonuc: 'tamam' } });
    await expectKind(client.push([change(ID_1)]), 'invalid_response');
  });
});

describe('pull', () => {
  it('imleç, sınır ve protokol sürümüyle GET /sync/pull ister', async () => {
    const page = {
      changes: [{ table: 'hives', row: { id: ID_1 } }],
      cursor: 42,
      hasMore: true,
    };
    const { invoke, client } = setup({ data: page });

    await expect(client.pull(10, 200)).resolves.toEqual(page);
    expect(invoke).toHaveBeenCalledWith('sync/pull?protocolVersion=1&cursor=10&limit=200', {
      method: 'GET',
      body: undefined,
      timeout: 30_000,
    });
  });

  it('sınırı 1 ile 500 arasında tutar', async () => {
    const { invoke, client } = setup({ data: { changes: [], cursor: 0, hasMore: false } });
    await client.pull(0, 10_000);
    await client.pull(0, 0);
    expect(invoke.mock.calls.map(([name]) => name)).toEqual([
      'sync/pull?protocolVersion=1&cursor=0&limit=500',
      'sync/pull?protocolVersion=1&cursor=0&limit=1',
    ]);
  });

  it('sözleşmeye uymayan yanıtta invalid_response verir', async () => {
    const { client } = setup({ data: { changes: [], cursor: -1, hasMore: false } });
    await expectKind(client.pull(0, 200), 'invalid_response');
  });
});

describe('hata çevirisi', () => {
  const httpError = (status: number) => new FunctionsHttpError(new Response(null, { status }));

  it.each([
    [401, 'unauthorized'],
    [426, 'update_required'],
    [500, 'server'],
    [429, 'server'],
    [400, 'server'],
  ] as const)('HTTP %i → %s', async (status, kind) => {
    const { client } = setup({ error: httpError(status) });
    await expectKind(client.pull(0, 200), kind);
    expect(toSyncError(httpError(status)).status).toBe(status);
  });

  it('bağlantı hatası ve istek sırasında fırlatılan hata network olur', async () => {
    await expectKind(setup({ error: new FunctionsFetchError({}) }).client.pull(0, 1), 'network');
    const thrown = setup(() => {
      throw new Error('AbortError');
    });
    await expectKind(thrown.client.pull(0, 1), 'network');
  });

  it('ağ geçidi hatası ve durum kodu olmayan HTTP hatası server olur', () => {
    expect(toSyncError(new FunctionsRelayError({})).kind).toBe('server');
    expect(toSyncError({ name: 'FunctionsHttpError', context: {} }).kind).toBe('server');
  });

  it('zaten çevrilmiş hatayı olduğu gibi bırakır', () => {
    const error = new SyncRequestError('update_required', 'eski');
    expect(toSyncError(error)).toBe(error);
    expect(toSyncError(undefined).kind).toBe('network');
  });
});
