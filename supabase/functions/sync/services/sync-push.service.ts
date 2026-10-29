import type { SyncRepository } from '../repositories/sync.repository.ts';
import { createUserSyncRepository } from '../repositories/sync.repository.ts';
import {
  type Row,
  SYNC_PROTOCOL_VERSION,
  SYNC_TABLES,
  type SyncTable,
  toSnakeCaseRow,
} from './sync-protocol.ts';

export interface PushChange {
  table: SyncTable;
  row: Row;
}

/** Reddedilen satırın nedeni; istemci buna göre kaydı düzeltir ya da kullanıcıya gösterir. */
export type RejectReason =
  'invalid_row' | 'missing_parent' | 'forbidden' | 'clock_skew' | 'unknown';

export interface PushResult {
  table: SyncTable;
  id: string;
  status: 'applied' | 'stale' | 'rejected';
  reason?: RejectReason;
}

export type PushOutcome =
  { kind: 'ok'; results: PushResult[] } | { kind: 'unsupported_protocol'; supported: number };

export interface SyncPushService {
  push(input: { protocolVersion: number; changes: PushChange[] }): Promise<PushOutcome>;
}

/** Bir SQL çağrısında uygulanacak en fazla satır. */
export const DEFAULT_PUSH_BATCH_SIZE = 100;

export function createSyncPushService(deps: {
  repository: SyncRepository;
  batchSize?: number;
}): SyncPushService {
  const batchSize = deps.batchSize ?? DEFAULT_PUSH_BATCH_SIZE;
  return {
    async push({ protocolVersion, changes }) {
      if (protocolVersion !== SYNC_PROTOCOL_VERSION) {
        return { kind: 'unsupported_protocol', supported: SYNC_PROTOCOL_VERSION };
      }
      const results: PushResult[] = new Array(changes.length);
      // Ebeveyn tablolar önce uygulanır ki yabancı anahtarlar aynı istekte karşılansın.
      for (const table of SYNC_TABLES) {
        const indexes = changes.flatMap((change, index) => (change.table === table ? [index] : []));
        for (const batch of chunk(indexes, batchSize)) {
          const rows = batch.map((index) => toSnakeCaseRow(changes[index]!.row));
          const applied = await deps.repository.applyChanges(table, rows);
          if (applied.length !== batch.length) {
            throw new Error(
              `${table}: ${batch.length} satır gönderildi, ${applied.length} sonuç döndü`,
            );
          }
          batch.forEach((index, i) => {
            const outcome = applied[i]!;
            results[index] = {
              table,
              id: String(changes[index]!.row.id),
              status: outcome.status,
              ...(outcome.status === 'rejected' ? { reason: toRejectReason(outcome.error) } : {}),
            };
          });
        }
      }
      return { kind: 'ok', results };
    },
  };
}

/** SQLSTATE → istemcinin anlayacağı neden. */
export function toRejectReason(error: string | null): RejectReason {
  if (error === 'clock_skew') return 'clock_skew';
  if (error === '23503') return 'missing_parent';
  if (error === '42501') return 'forbidden';
  if (error?.startsWith('22') || error?.startsWith('23')) return 'invalid_row';
  return 'unknown';
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Kullanıcının oturumuyla çalışan servis (route bunu kullanır). */
export function createDefaultSyncPushService(authorization: string): SyncPushService {
  return createSyncPushService({ repository: createUserSyncRepository(authorization) });
}
