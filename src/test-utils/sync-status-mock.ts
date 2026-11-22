import type { SyncStatusView } from '../features/settings/hooks/useSyncStatus';

// Ayarlar ekranı testleri (T1.9) için `useSyncStatus` sonucunun sahtesi.

export function createSyncStatusView(overrides: Partial<SyncStatusView> = {}): SyncStatusView {
  return {
    status: 'idle',
    issue: null,
    lastSyncedAt: null,
    failureCount: 0,
    nextRetryAt: null,
    rejectedCount: 0,
    pending: [],
    pendingCount: 0,
    now: new Date('2026-11-22T10:00:00Z'),
    syncNow: jest.fn(async () => {}),
    syncing: false,
    ...overrides,
  };
}
