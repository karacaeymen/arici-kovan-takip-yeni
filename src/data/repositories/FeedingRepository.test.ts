import { IDS } from '../../test-utils/domain-fixtures';
import { describeSyncedRepository, setupRepository } from '../../test-utils/repository-contract';

import { createFeedingRepository } from './FeedingRepository';

describeSyncedRepository({
  tableName: 'feedings',
  create: createFeedingRepository,
  sample: {
    id: IDS.record,
    businessId: IDS.business,
    hiveId: IDS.hive,
    fedOn: '2026-10-10',
    feedType: 'sugar_syrup' as const,
    amount: 1.5,
    unit: 'l' as const,
    notes: null,
  },
  changes: { amount: 2.25 },
});

describe('FeedingRepository', () => {
  it('miktarı ondalık olarak korur ve beslemeleri yeniden eskiye listeler', () => {
    const { repo } = setupRepository({ create: createFeedingRepository });
    const feeding = (id: string, fedOn: string) => ({
      id,
      businessId: IDS.business,
      hiveId: IDS.hive,
      fedOn,
      feedType: 'fondant' as const,
      amount: 0.75,
      unit: 'kg' as const,
      notes: null,
    });
    repo.create(feeding(IDS.record, '2026-02-01'));
    repo.create(feeding(IDS.session, '2026-02-15'));

    const list = repo.listByHive(IDS.hive);
    expect(list.map((f) => f.fedOn)).toEqual(['2026-02-15', '2026-02-01']);
    expect(list[0]?.amount).toBe(0.75);
  });
});
