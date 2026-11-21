import { IDS } from '../../test-utils/domain-fixtures';
import { describeSyncedRepository, setupRepository } from '../../test-utils/repository-contract';

import { createQueenRepository } from './QueenRepository';

describeSyncedRepository({
  tableName: 'queens',
  create: createQueenRepository,
  sample: {
    id: IDS.record,
    businessId: IDS.business,
    hiveId: IDS.hive,
    birthYear: 2026,
    isMarked: true,
    origin: 'purchased' as const,
    introducedOn: '2026-05-01',
    endedOn: null,
    endReason: null,
    notes: null,
  },
  changes: { isMarked: false, notes: 'Boya silinmiş' },
});

describe('QueenRepository', () => {
  const queen = (id: string, introducedOn: string, endedOn: string | null) => ({
    id,
    businessId: IDS.business,
    hiveId: IDS.hive,
    birthYear: null,
    isMarked: false,
    origin: 'unknown' as const,
    introducedOn,
    endedOn,
    endReason: endedOn === null ? null : ('replaced' as const),
    notes: null,
  });

  it('kovanın kraliçe geçmişini yeniden eskiye listeler ve şu anki kraliçeyi bulur', () => {
    const { repo } = setupRepository({ create: createQueenRepository });
    repo.create(queen(IDS.record, '2025-04-01', '2026-04-30'));
    repo.create(queen(IDS.session, '2026-05-01', null));

    expect(repo.listByHive(IDS.hive).map((q) => q.introducedOn)).toEqual([
      '2026-05-01',
      '2025-04-01',
    ]);
    expect(repo.getCurrentForHive(IDS.hive)?.id).toBe(IDS.session);
  });

  it('kraliçesi olmayan kovanda şu anki kraliçe yoktur', () => {
    const { repo } = setupRepository({ create: createQueenRepository });
    repo.create(queen(IDS.record, '2025-04-01', '2026-04-30'));

    expect(repo.getCurrentForHive(IDS.hive)).toBeUndefined();
  });
});
