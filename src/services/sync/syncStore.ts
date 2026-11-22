// Senkron durumunun reaktif deposu (TODO.md T1.6). Motor yazar; arayüz yalnızca okur:
// `syncStore` → `useSyncStatus` (T1.9, `useSyncExternalStore`) → bileşen. Metin tutmaz; kodları
// kullanıcıya gösterilecek metne çevirmek arayüzün (i18n) işidir.

/**
 * - `idle`: son deneme başarılı (ya da henüz denenmedi).
 * - `syncing`: gönderiliyor/çekiliyor.
 * - `offline`: bağlantı yok; ağ gelince kendiliğinden denenir.
 * - `error`: deneme başarısız; `nextRetryAt`'te tekrar denenecek.
 * - `signedOut`: oturum yok; giriş yapılınca denenir.
 * - `updateRequired`: sunucu bu sürümü kabul etmiyor; uygulama güncellenmeli.
 */
export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error' | 'signedOut' | 'updateRequired';

/** Son başarısızlığın nedeni (`error` durumunda). */
export type SyncIssue = 'network' | 'server' | 'invalid_response' | 'pending_retry' | 'unknown';

export interface SyncSnapshot {
  status: SyncStatus;
  issue: SyncIssue | null;
  /** Son başarılı senkronun zamanı (ISO). */
  lastSyncedAt: string | null;
  /** Art arda başarısız deneme sayısı; başarıda sıfırlanır. */
  failureCount: number;
  /** Bir sonraki otomatik denemenin zamanı (ISO). */
  nextRetryAt: string | null;
  /** Son senkronda sunucunun kalıcı olarak reddettiği değişiklik sayısı. */
  rejectedCount: number;
}

export const INITIAL_SYNC_SNAPSHOT: SyncSnapshot = {
  status: 'idle',
  issue: null,
  lastSyncedAt: null,
  failureCount: 0,
  nextRetryAt: null,
  rejectedCount: 0,
};

export type SyncListener = (snapshot: SyncSnapshot) => void;

export interface SyncStore {
  /** Anlık durum. Değişmediği sürece aynı nesne döner (`useSyncExternalStore` bunu bekler). */
  getSnapshot(): SyncSnapshot;
  /** Her değişiklikte çağrılır; dönen fonksiyon aboneliği kaldırır. */
  subscribe(listener: SyncListener): () => void;
  update(patch: Partial<SyncSnapshot>): void;
}

export function createSyncStore(initial: Partial<SyncSnapshot> = {}): SyncStore {
  let snapshot: SyncSnapshot = { ...INITIAL_SYNC_SNAPSHOT, ...initial };
  const listeners = new Set<SyncListener>();

  return {
    getSnapshot: () => snapshot,

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    update(patch) {
      const keys = Object.keys(patch) as (keyof SyncSnapshot)[];
      if (keys.every((key) => patch[key] === snapshot[key])) return;
      snapshot = { ...snapshot, ...patch };
      listeners.forEach((listener) => listener(snapshot));
    },
  };
}

/** Uygulamanın senkron durumu (tek örnek). */
export const syncStore = createSyncStore();
