import type { z } from 'zod';

import {
  MAX_PULL_LIMIT,
  type PullPage,
  SYNC_TABLES,
  type SyncClient,
  type SyncTable,
} from '../../data/api/sync.client';
import type { RemoteApplyResult, SyncStateRepository } from '../../data/repositories';
import {
  apiarySchema,
  businessSchema,
  feedingSchema,
  harvestSchema,
  hiveSchema,
  inspectionSchema,
  queenSchema,
  relocationSchema,
  taskSchema,
  treatmentSchema,
} from '../../domain/entities';
import { reportError } from '../../lib/observability/report';

// Pull: sunucudaki değişiklikleri imleçten itibaren sayfa sayfa çekip yerel veritabanına uygular
// (TODO.md T1.6). Çakışma LWW ile repository'nin `applyRemote`'unda çözülür.

/** Sunucudan gelen satır, uygulanmadan önce domain şemasıyla doğrulanır. */
const ROW_SCHEMAS: Record<SyncTable, z.ZodType> = {
  businesses: businessSchema,
  apiaries: apiarySchema,
  hives: hiveSchema,
  queens: queenSchema,
  inspections: inspectionSchema,
  treatments: treatmentSchema,
  feedings: feedingSchema,
  harvests: harvestSchema,
  relocations: relocationSchema,
  tasks: taskSchema,
};

/** Sunucu satırını yerele yazan repository (her varlık repository'si bunu sağlar). */
export interface RemoteRowTarget {
  // `never`: her varlık repository'si kendi satır tipini alır; doğrulanmış satır aşağıda verilir.
  applyRemote(row: never): RemoteApplyResult;
}

export const DEFAULT_PULL_PAGE_SIZE = 200;

export interface PullSummary {
  applied: number;
  /** Yereldeki hal daha yeni ya da aynı olduğu için atlanan satır. */
  stale: number;
  /** Doğrulamadan geçmeyen ya da tanınmayan tablodan gelen satır. */
  skipped: number;
}

export interface SyncPullServiceDeps {
  client: Pick<SyncClient, 'pull'>;
  syncState: Pick<SyncStateRepository, 'get' | 'saveCursor'>;
  targets: Record<SyncTable, RemoteRowTarget>;
  pageSize?: number;
}

/** Uygulanamayan sunucu satırı (değerler değil, yalnızca tablo/kimlik/alan yolları bildirilir). */
export class SyncPullRowError extends Error {
  constructor(table: string, id: unknown, detail: string) {
    super(`Sunucu satırı uygulanamadı: ${table}/${String(id)} (${detail})`);
    this.name = 'SyncPullRowError';
  }
}

const isSyncTable = (table: string): table is SyncTable =>
  (SYNC_TABLES as readonly string[]).includes(table);

export function createSyncPullService({
  client,
  syncState,
  targets,
  pageSize = DEFAULT_PULL_PAGE_SIZE,
}: SyncPullServiceDeps) {
  const limit = Math.min(pageSize, MAX_PULL_LIMIT);

  const applyChange = ({ table, row }: PullPage['changes'][number], summary: PullSummary): void => {
    if (!isSyncTable(table)) {
      return skip(summary, new SyncPullRowError(table, row.id, 'bilinmeyen tablo'));
    }
    const parsed = ROW_SCHEMAS[table].safeParse(row);
    if (!parsed.success) {
      const paths = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
      return skip(summary, new SyncPullRowError(table, row.id, `geçersiz alan: ${paths}`));
    }
    const apply = targets[table].applyRemote as (value: unknown) => RemoteApplyResult;
    summary[apply(parsed.data)] += 1;
  };

  return {
    /**
     * `hasMore` false olana kadar sayfaları çeker. Her sayfa uygulandıktan sonra imleç kaydedilir;
     * yarıda kesilirse aynı sayfa yeniden çekilir (LWW sayesinde ikinci uygulama zararsızdır).
     */
    async pullAll(): Promise<PullSummary> {
      const summary: PullSummary = { applied: 0, stale: 0, skipped: 0 };
      let { cursor } = syncState.get();

      for (;;) {
        const page = await client.pull(cursor, limit);
        page.changes.forEach((change) => applyChange(change, summary));
        if (page.cursor > cursor) syncState.saveCursor(page.cursor);
        if (!page.hasMore) return summary;
        if (page.cursor <= cursor) {
          // Sunucu "devamı var" deyip imleci ilerletmezse sonsuz döngüye girmeyelim.
          throw new Error(`pull imleci ilerlemedi: ${cursor}`);
        }
        cursor = page.cursor;
      }
    },
  };
}

function skip(summary: PullSummary, error: SyncPullRowError): void {
  summary.skipped += 1;
  reportError(error, { layer: 'service', feature: 'sync', operation: 'pull' });
}

export type SyncPullService = ReturnType<typeof createSyncPullService>;
