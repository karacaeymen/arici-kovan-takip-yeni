import type { SyncRepository } from '../repositories/sync.repository.ts';
import { createUserSyncRepository } from '../repositories/sync.repository.ts';
import {
  type Row,
  SYNC_PROTOCOL_VERSION,
  type SyncTable,
  toCamelCaseRow,
} from './sync-protocol.ts';

export interface PullChange {
  table: SyncTable;
  row: Row;
}

export type PullOutcome =
  | { kind: 'ok'; changes: PullChange[]; cursor: number; hasMore: boolean }
  | { kind: 'unsupported_protocol'; supported: number };

export interface SyncPullService {
  pull(input: { protocolVersion: number; cursor: number; limit: number }): Promise<PullOutcome>;
}

export function createSyncPullService(deps: { repository: SyncRepository }): SyncPullService {
  return {
    async pull({ protocolVersion, cursor, limit }) {
      if (protocolVersion !== SYNC_PROTOCOL_VERSION) {
        return { kind: 'unsupported_protocol', supported: SYNC_PROTOCOL_VERSION };
      }
      // Bir fazlası istenir: dönerse istemci hemen bir sonraki sayfayı çekmelidir.
      const rows = await deps.repository.changesSince(cursor, limit + 1);
      const page = rows.slice(0, limit);
      return {
        kind: 'ok',
        changes: page.map((row) => ({
          table: row.table_name as SyncTable,
          row: toCamelCaseRow(row.row_data),
        })),
        cursor: page.at(-1)?.seq ?? cursor,
        hasMore: rows.length > limit,
      };
    },
  };
}

/** Kullanıcının oturumuyla çalışan servis (route bunu kullanır). */
export function createDefaultSyncPullService(authorization: string): SyncPullService {
  return createSyncPullService({ repository: createUserSyncRepository(authorization) });
}
