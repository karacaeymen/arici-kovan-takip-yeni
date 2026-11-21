import { IDS } from '../../test-utils/domain-fixtures';
import { describeSyncedRepository, setupRepository } from '../../test-utils/repository-contract';

import { createRelocationRepository } from './RelocationRepository';

describeSyncedRepository({
  tableName: 'relocations',
  create: createRelocationRepository,
  sample: {
    id: IDS.record,
    businessId: IDS.business,
    hiveId: IDS.hive,
    fromApiaryId: IDS.apiary,
    toApiaryId: IDS.apiary2,
    movedAt: '2026-06-01T05:00:00Z',
    notes: null,
  },
  changes: { notes: 'Kekik için yaylaya' },
});

describe('RelocationRepository', () => {
  it('kovanın taşıma geçmişini yeniden eskiye listeler', () => {
    const { repo } = setupRepository({ create: createRelocationRepository });
    const relocation = (id: string, movedAt: string) => ({
      id,
      businessId: IDS.business,
      hiveId: IDS.hive,
      fromApiaryId: IDS.apiary,
      toApiaryId: IDS.apiary2,
      movedAt,
      notes: null,
    });
    repo.create(relocation(IDS.record, '2026-04-01T05:00:00Z'));
    repo.create(relocation(IDS.session, '2026-07-01T05:00:00Z'));

    expect(repo.listByHive(IDS.hive).map((r) => r.id)).toEqual([IDS.session, IDS.record]);
  });
});
