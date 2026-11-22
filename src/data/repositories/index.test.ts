import { createFixedClock } from '../../lib/clock';
import { createTestDatabase } from '../../test-utils/test-database';
import { SYNC_TABLE_NAMES } from '../db/schema';

import { createRepositories } from './index';

// `getRepositories` telefondaki veritabanını açar; burada yalnızca bellek içi veritabanı kullanılır.
jest.mock('expo-sqlite', () => ({ openDatabaseSync: jest.fn() }));

describe('createRepositories', () => {
  it('senkronlanan her tablo için, tablo adıyla, sunucu satırını uygulayabilen bir repository kurar', () => {
    const repos = createRepositories(
      createTestDatabase(),
      createFixedClock('2026-11-01T08:00:00Z'),
    );

    for (const table of SYNC_TABLE_NAMES) {
      expect(typeof repos[table].applyRemote).toBe('function');
    }
    expect(repos.outbox.count()).toBe(0);
    expect(repos.syncState.get().cursor).toBe(0);
  });
});
