import { createUserClient, type DbClient } from '../../_shared/db/client.ts';

/** `sync_apply_changes` satır sonucu. `error`: SQLSTATE kodu ya da `clock_skew`. */
export interface ApplyResultRow {
  id: string | null;
  status: 'applied' | 'stale' | 'rejected';
  error: string | null;
}

/** `sync_changes_since` satırı. */
export interface ChangeRow {
  table_name: string;
  seq: number;
  row_data: Record<string, unknown>;
}

export interface SyncRepository {
  /** Bir tablonun satırlarını tek işlemde, LWW ile uygular. Sonuçlar girdi sırasıyla döner. */
  applyChanges(table: string, rows: Record<string, unknown>[]): Promise<ApplyResultRow[]>;
  /** İmleçten sonraki değişiklikleri sırayla döndürür. */
  changesSince(cursor: number, limit: number): Promise<ChangeRow[]>;
}

/** SQL çağrıları yalnızca buradadır. İstemci kullanıcının JWT'siyle çalışır, RLS geçerlidir. */
export function createSyncRepository(client: DbClient): SyncRepository {
  return {
    async applyChanges(table, rows) {
      const { data, error } = await client.rpc('sync_apply_changes', {
        p_table: table,
        p_rows: rows,
      });
      if (error) throw new Error(`sync_apply_changes başarısız: ${error.message}`);
      return (data ?? []) as ApplyResultRow[];
    },
    async changesSince(cursor, limit) {
      const { data, error } = await client.rpc('sync_changes_since', {
        p_cursor: cursor,
        p_limit: limit,
      });
      if (error) throw new Error(`sync_changes_since başarısız: ${error.message}`);
      return ((data ?? []) as ChangeRow[]).map((row) => ({ ...row, seq: Number(row.seq) }));
    },
  };
}

/** Kullanıcının `Authorization` başlığıyla çalışan repository. */
export function createUserSyncRepository(authorization: string): SyncRepository {
  return createSyncRepository(createUserClient(authorization));
}
