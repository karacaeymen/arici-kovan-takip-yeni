import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import { getSyncStatusService } from '../../../services/sync';

const NOW_REFRESH_MS = 30_000;

/**
 * Senkron durumu (TODO.md T1.9): `syncStore` → bu hook → bileşen. Bekleyen değişiklikler yerel
 * veritabanından canlı okunur; "5 dk önce" gibi gösterimler için `now` yarım dakikada bir yenilenir.
 */
export function useSyncStatus() {
  const service = getSyncStatusService();
  const snapshot = useSyncExternalStore(service.subscribe, service.getSnapshot);
  const pendingQuery = useMemo(() => service.watchPending(), [service]);
  const { data } = useLiveQuery(pendingQuery);
  const pending = useMemo(() => service.toPendingChanges(data), [service, data]);

  const [now, setNow] = useState(() => service.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(service.now()), NOW_REFRESH_MS);
    return () => clearInterval(timer);
  }, [service]);

  const [syncing, setSyncing] = useState(false);
  const syncNow = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await service.syncNow();
      setNow(service.now());
    } finally {
      setSyncing(false);
    }
  };

  return { ...snapshot, pending, pendingCount: pending.length, now, syncNow, syncing };
}

export type SyncStatusView = ReturnType<typeof useSyncStatus>;
