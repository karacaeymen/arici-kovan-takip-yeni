import { syncState } from '../db/schema';
import { createTestDatabase } from '../../test-utils/test-database';

import { createSyncStateRepository } from './SyncStateRepository';

describe('SyncStateRepository', () => {
  it('ilk senkrondan önce imleç 0, son senkron zamanı boştur', () => {
    const repo = createSyncStateRepository(createTestDatabase());
    expect(repo.get()).toEqual({ cursor: 0, lastSyncedAt: null });
  });

  it('imleci ve son senkron zamanını birbirini silmeden yazar', () => {
    const db = createTestDatabase();
    const repo = createSyncStateRepository(db);

    repo.saveCursor(12);
    repo.markSynced('2026-11-01T08:00:00.000Z');
    repo.saveCursor(40);

    expect(repo.get()).toEqual({ cursor: 40, lastSyncedAt: '2026-11-01T08:00:00.000Z' });
    expect(db.select().from(syncState).all()).toHaveLength(1);
  });
});
