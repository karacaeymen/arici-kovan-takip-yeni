import { z } from 'zod';

import { getSupabaseClient } from '../supabase/client';

// `sync` Edge Function'ının istemcisi (TODO.md T1.6). Sözleşmenin kaynağı:
// `supabase/functions/sync/services/sync-protocol.ts`. Sunucu tarafı değişirse buradaki sabitler de
// değişir; protokol sürümü uyuşmazsa sunucu 426 döner.

export const SYNC_PROTOCOL_VERSION = 1;

/** Senkronlanan tablolar, ebeveynden çocuğa (sunucudaki `SYNC_TABLES` ile aynı sıra). */
export const SYNC_TABLES = [
  'businesses',
  'apiaries',
  'hives',
  'queens',
  'inspections',
  'treatments',
  'feedings',
  'harvests',
  'relocations',
  'tasks',
] as const;
export type SyncTable = (typeof SYNC_TABLES)[number];

/** Tek push isteğindeki en fazla değişiklik. */
export const MAX_PUSH_CHANGES = 500;
/** Tek pull isteğinde istenebilecek en fazla değişiklik. */
export const MAX_PULL_LIMIT = 500;

export const REJECT_REASONS = [
  'invalid_row',
  'missing_parent',
  'forbidden',
  'clock_skew',
  'unknown',
] as const;
export type RejectReason = (typeof REJECT_REASONS)[number];

/** Sunucuya giden değişiklik: satırın tamamı, camelCase (snake_case'e sunucu çevirir). */
export interface SyncChange {
  table: SyncTable;
  row: Record<string, unknown> & { id: string; updatedAt: string };
}

const pushResponseSchema = z.object({
  results: z.array(
    z.object({
      table: z.enum(SYNC_TABLES),
      id: z.string(),
      status: z.enum(['applied', 'stale', 'rejected']),
      // Sunucu ileride yeni bir neden eklerse istemci onu `unknown` sayar.
      reason: z.enum(REJECT_REASONS).optional().catch('unknown'),
    }),
  ),
});
export type PushResult = z.infer<typeof pushResponseSchema>['results'][number];

const pullResponseSchema = z.object({
  // Tablo adı burada serbest bırakılır: tanımadığı tabloyu atlamak servisin işidir.
  changes: z.array(z.object({ table: z.string(), row: z.record(z.string(), z.unknown()) })),
  cursor: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});
export type PullPage = z.infer<typeof pullResponseSchema>;

/**
 * Senkron isteğinin hatası. `kind`, senkron motorunun ne yapacağını belirler:
 * - `network`: bağlantı yok/koptu → üstel beklemeyle tekrar denenir.
 * - `unauthorized` (401): oturum yok → giriş yapılana kadar beklenir.
 * - `update_required` (426): protokol eski → uygulama güncellenmeden senkron durur.
 * - `server` (5xx, 429, diğer): sunucu hatası → tekrar denenir ve bildirilir.
 * - `invalid_response`: yanıt sözleşmeye uymuyor → tekrar denenir ve bildirilir.
 */
export type SyncErrorKind =
  'network' | 'unauthorized' | 'update_required' | 'server' | 'invalid_response';

export class SyncRequestError extends Error {
  constructor(
    readonly kind: SyncErrorKind,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'SyncRequestError';
  }
}

/** Supabase istemcisinin `functions` bölümünün kullandığımız kısmı (testlerde sahtesi verilir). */
export interface FunctionsInvoker {
  invoke(
    name: string,
    options: { method: 'GET' | 'POST'; body?: Record<string, unknown>; timeout?: number },
  ): Promise<{ data: unknown; error: unknown }>;
}

export interface SyncClient {
  /** Değişiklikleri gönderir; sonuçlar gönderilen sırayla döner. */
  push(changes: SyncChange[]): Promise<PushResult[]>;
  /** `cursor`'dan sonraki değişikliklerin bir sayfası. */
  pull(cursor: number, limit: number): Promise<PullPage>;
}

const REQUEST_TIMEOUT_MS = 30_000;

export function createSyncClient(functions: FunctionsInvoker): SyncClient {
  const call = async (
    name: string,
    method: 'GET' | 'POST',
    body?: Record<string, unknown>,
  ): Promise<unknown> => {
    let response: { data: unknown; error: unknown };
    try {
      response = await functions.invoke(name, { method, body, timeout: REQUEST_TIMEOUT_MS });
    } catch (error) {
      throw toSyncError(error);
    }
    if (response.error) throw toSyncError(response.error);
    return response.data;
  };

  return {
    async push(changes) {
      if (changes.length === 0) return [];
      if (changes.length > MAX_PUSH_CHANGES) {
        throw new Error(`Tek istekte en fazla ${MAX_PUSH_CHANGES} değişiklik gönderilebilir`);
      }
      const data = await call('sync/push', 'POST', {
        protocolVersion: SYNC_PROTOCOL_VERSION,
        changes,
      });
      const { results } = parse(pushResponseSchema, data, 'push');
      const matches =
        results.length === changes.length &&
        results.every((result, i) => result.id === changes[i]?.row.id);
      if (!matches) {
        throw new SyncRequestError(
          'invalid_response',
          'push: sonuçlar gönderilen sırayla eşleşmiyor',
        );
      }
      return results;
    },

    async pull(cursor, limit) {
      const query = new URLSearchParams({
        protocolVersion: String(SYNC_PROTOCOL_VERSION),
        cursor: String(cursor),
        limit: String(Math.min(Math.max(limit, 1), MAX_PULL_LIMIT)),
      });
      const data = await call(`sync/pull?${query.toString()}`, 'GET');
      return parse(pullResponseSchema, data, 'pull');
    },
  };
}

function parse<T>(schema: z.ZodType<T>, data: unknown, operation: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new SyncRequestError('invalid_response', `${operation}: yanıt sözleşmeye uymuyor`);
  }
  return result.data;
}

/** Supabase `functions.invoke` hatalarını (`FunctionsHttpError`, `FunctionsFetchError`, …) çevirir. */
export function toSyncError(error: unknown): SyncRequestError {
  if (error instanceof SyncRequestError) return error;
  const { name, context } = (error ?? {}) as { name?: unknown; context?: unknown };
  if (name === 'FunctionsHttpError') {
    const status = (context as { status?: unknown } | undefined)?.status;
    if (typeof status === 'number') {
      if (status === 401) return new SyncRequestError('unauthorized', 'Oturum gerekli', status);
      if (status === 426) {
        return new SyncRequestError(
          'update_required',
          'Uygulamanın güncellenmesi gerekiyor',
          status,
        );
      }
      return new SyncRequestError('server', `Sunucu hatası (${status})`, status);
    }
    return new SyncRequestError('server', 'Sunucu hatası');
  }
  if (name === 'FunctionsRelayError')
    return new SyncRequestError('server', 'Supabase ağ geçidi hatası');
  // FunctionsFetchError, zaman aşımı (AbortError) ve diğer fetch hataları bağlantı sorunudur.
  return new SyncRequestError('network', 'Sunucuya ulaşılamadı');
}

let client: SyncClient | undefined;

/** Uygulamanın Supabase istemcisiyle çalışan senkron istemcisi. */
export function getSyncClient(): SyncClient {
  client ??= createSyncClient(getSupabaseClient().functions);
  return client;
}
