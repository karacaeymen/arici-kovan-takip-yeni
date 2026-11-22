import {
  type PushResult,
  type RejectReason,
  type SyncClient,
  SyncRequestError,
} from '../../data/api/sync.client';
import type { OutboxRepository } from '../../data/repositories';
import { reportError } from '../../lib/observability/report';

// Push: outbox'taki değişiklikleri sırayla sunucuya gönderir (TODO.md T1.6).

/** Tekrar denendiğinde düzelebilecek redler; diğerleri kalıcıdır. */
const RETRYABLE_REASONS: readonly RejectReason[] = [
  // Ebeveyn kayıt henüz sunucuda değil (ör. sonraki partide gidecek).
  'missing_parent',
  // Cihaz saati ileride; sunucu saati yetişince kabul edilir.
  'clock_skew',
];

export const DEFAULT_PUSH_BATCH_SIZE = 100;

export interface PushSummary {
  /** Sunucunun uyguladığı ya da daha yenisi olduğu için atladığı (`stale`) değişiklik. */
  sent: number;
  /** Sonraki denemeye kalan değişiklik. */
  retry: number;
  /** Kalıcı olarak reddedilip kuyruktan çıkarılan değişiklik. */
  rejected: number;
}

export interface SyncPushServiceDeps {
  outbox: OutboxRepository;
  client: Pick<SyncClient, 'push'>;
  batchSize?: number;
}

/** Kalıcı reddi Sentry'ye götüren hata (satırın içeriği değil, yalnızca tablo/kimlik/neden). */
export class SyncRejectedError extends Error {
  constructor(readonly result: PushResult) {
    super(
      `Sunucu değişikliği reddetti: ${result.table}/${result.id} (${result.reason ?? 'unknown'})`,
    );
    this.name = 'SyncRejectedError';
  }
}

export function createSyncPushService({
  outbox,
  client,
  batchSize = DEFAULT_PUSH_BATCH_SIZE,
}: SyncPushServiceDeps) {
  return {
    /**
     * Kuyruk boşalana kadar partiler halinde gönderir. Bir çalıştırmada her girdi en fazla bir kez
     * denenir. Ağ/sunucu hatasında partinin tamamı `markFailed` olur ve hata yukarı fırlatılır
     * (yeniden deneme ve bekleme koordinatörün işidir).
     */
    async pushAll(): Promise<PushSummary> {
      const summary: PushSummary = { sent: 0, retry: 0, rejected: 0 };
      const attempted = new Set<number>();

      for (;;) {
        const batch = outbox
          .peek(batchSize + attempted.size)
          .filter((entry) => !attempted.has(entry.id))
          .slice(0, batchSize);
        if (batch.length === 0) return summary;
        batch.forEach((entry) => attempted.add(entry.id));

        let results: PushResult[];
        try {
          results = await client.push(batch.map(({ table, row }) => ({ table, row })));
        } catch (error) {
          outbox.markFailed(
            batch.map((entry) => entry.id),
            error instanceof SyncRequestError ? error.kind : 'unknown',
          );
          throw error;
        }

        const done: number[] = [];
        const retryByReason = new Map<string, number[]>();
        results.forEach((result, i) => {
          const entryId = batch[i]!.id;
          if (result.status !== 'rejected') {
            done.push(entryId);
            summary.sent += 1;
            return;
          }
          const reason = result.reason ?? 'unknown';
          if (RETRYABLE_REASONS.includes(reason)) {
            const error = `rejected:${reason}`;
            retryByReason.set(error, [...(retryByReason.get(error) ?? []), entryId]);
            summary.retry += 1;
            return;
          }
          // Kalıcı red: tekrar göndermek sonucu değiştirmez; kuyruğu tıkamasın diye çıkarılır.
          done.push(entryId);
          summary.rejected += 1;
          reportError(new SyncRejectedError(result), {
            layer: 'service',
            feature: 'sync',
            operation: 'push',
          });
        });

        outbox.markSent(done);
        retryByReason.forEach((ids, error) => outbox.markFailed(ids, error));
      }
    },
  };
}

export type SyncPushService = ReturnType<typeof createSyncPushService>;
