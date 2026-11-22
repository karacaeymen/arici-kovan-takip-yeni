import { SyncRequestError } from '../../data/api/sync.client';
import type { SyncStateRepository } from '../../data/repositories';
import type { Clock } from '../../lib/clock';
import { reportError } from '../../lib/observability/report';
import { withServiceErrors } from '../../lib/observability/withServiceErrors';

import type { PullSummary } from './SyncPullService';
import type { PushSummary } from './SyncPushService';
import type { SyncIssue, SyncSnapshot, SyncStore } from './syncStore';
import type { SyncTriggers } from './syncTriggers';

// Senkron koordinatörü (TODO.md T1.6): önce push, sonra pull; aynı anda tek senkron; hata olursa
// üstel beklemeyle yeniden deneme; ağ gelince ve uygulama öne gelince kendiliğinden başlama.
// Arayüz bunu doğrudan kullanmaz; durumu `syncStore` üzerinden okur.

export interface BackoffOptions {
  /** İlk yeniden denemeden önceki bekleme. */
  baseMs: number;
  /** Beklemenin üst sınırı. */
  maxMs: number;
}

export const DEFAULT_BACKOFF: BackoffOptions = { baseMs: 2_000, maxMs: 5 * 60_000 };

/** `failureCount`. başarısızlıktan sonraki bekleme: base, 2×base, 4×base, … en fazla max. */
export function backoffDelay(failureCount: number, { baseMs, maxMs }: BackoffOptions): number {
  const exponent = Math.max(0, failureCount - 1);
  return Math.min(maxMs, baseMs * 2 ** Math.min(exponent, 30));
}

export interface Timer {
  setTimeout(callback: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

const systemTimer: Timer = {
  setTimeout: (callback, ms) => setTimeout(callback, ms),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export interface SyncCoordinatorDeps {
  push: { pushAll(): Promise<PushSummary> };
  pull: { pullAll(): Promise<PullSummary> };
  syncState: Pick<SyncStateRepository, 'markSynced'>;
  store: SyncStore;
  clock: Clock;
  triggers: SyncTriggers;
  timer?: Timer;
  backoff?: BackoffOptions;
}

const TAGS = { layer: 'service', feature: 'sync' } as const;

export function createSyncCoordinator({
  push,
  pull,
  syncState,
  store,
  clock,
  triggers,
  timer = systemTimer,
  backoff = DEFAULT_BACKOFF,
}: SyncCoordinatorDeps) {
  let running: Promise<SyncSnapshot> | null = null;
  let rerun = false;
  let retryHandle: unknown = null;
  let unsubscribe: (() => void) | null = null;

  const clearRetry = () => {
    if (retryHandle !== null) timer.clearTimeout(retryHandle);
    retryHandle = null;
  };

  const fail = (issue: SyncIssue, extra: Partial<SyncSnapshot> = {}) => {
    const failureCount = store.getSnapshot().failureCount + 1;
    const delay = backoffDelay(failureCount, backoff);
    store.update({
      status: 'error',
      issue,
      failureCount,
      ...extra,
      nextRetryAt: new Date(clock.now().getTime() + delay).toISOString(),
    });
    retryHandle = timer.setTimeout(() => {
      retryHandle = null;
      void sync();
    }, delay);
  };

  const handleError = async (error: unknown) => {
    if (!(error instanceof SyncRequestError)) {
      reportError(error, { ...TAGS, operation: 'sync' });
      return fail('unknown');
    }
    switch (error.kind) {
      case 'unauthorized':
        return store.update({ status: 'signedOut', issue: null, nextRetryAt: null });
      case 'update_required':
        return store.update({ status: 'updateRequired', issue: null, nextRetryAt: null });
      case 'network':
        if (!(await triggers.isOnline())) {
          return store.update({ status: 'offline', issue: 'network', nextRetryAt: null });
        }
        return fail('network');
      default:
        reportError(error, { ...TAGS, operation: 'sync' });
        return fail(error.kind);
    }
  };

  const runOnce = async (): Promise<void> => {
    clearRetry();
    if (store.getSnapshot().status === 'updateRequired') return;
    if (!(await triggers.isOnline())) {
      store.update({ status: 'offline', issue: 'network', nextRetryAt: null });
      return;
    }
    store.update({ status: 'syncing' });
    try {
      const pushed = await push.pushAll();
      await pull.pullAll();
      const now = clock.now().toISOString();
      syncState.markSynced(now);
      const result = { lastSyncedAt: now, rejectedCount: pushed.rejected };
      if (pushed.retry > 0) return fail('pending_retry', result);
      store.update({ ...result, status: 'idle', issue: null, failureCount: 0, nextRetryAt: null });
    } catch (error) {
      await handleError(error);
    }
  };

  /**
   * Senkronu başlatır. Zaten çalışıyorsa yenisini başlatmaz; mevcut bitince bir kez daha çalışır
   * (bu sırada yazılan kayıtlar da gitsin diye). Hiç fırlatmaz; sonucu `syncStore`'a yazar.
   */
  function sync(): Promise<SyncSnapshot> {
    if (running) {
      rerun = true;
      return running;
    }
    running = (async () => {
      try {
        do {
          rerun = false;
          await runOnce();
        } while (rerun);
        return store.getSnapshot();
      } finally {
        running = null;
      }
    })();
    return running;
  }

  return withServiceErrors(
    {
      sync,

      /** Otomatik tetikleyicileri bağlar ve ilk senkronu başlatır. İkinci çağrı bir şey yapmaz. */
      start(): void {
        if (unsubscribe) return;
        unsubscribe = triggers.subscribe(() => void sync());
        void sync();
      },

      /** Tetikleyicileri ve bekleyen yeniden denemeyi kaldırır (ör. oturum kapanınca). */
      stop(): void {
        unsubscribe?.();
        unsubscribe = null;
        clearRetry();
      },
    },
    { feature: 'sync' },
  );
}

export type SyncCoordinator = ReturnType<typeof createSyncCoordinator>;
