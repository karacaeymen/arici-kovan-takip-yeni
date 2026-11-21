import { IDS } from '../../test-utils/domain-fixtures';
import { describeSyncedRepository, setupRepository } from '../../test-utils/repository-contract';

import { createHiveRepository } from './HiveRepository';

describeSyncedRepository({
  tableName: 'hives',
  create: createHiveRepository,
  sample: {
    id: IDS.record,
    businessId: IDS.business,
    apiaryId: IDS.apiary,
    number: 7,
    name: null,
    status: 'active' as const,
    notes: null,
  },
  changes: { status: 'dead' as const, notes: 'Kışı çıkaramadı' },
});

describe('HiveRepository', () => {
  const hive = (id: string, apiaryId: string, number: number) => ({
    id,
    businessId: IDS.business,
    apiaryId,
    number,
    name: null,
    status: 'active' as const,
    notes: null,
  });

  it('arılıktaki kovanları numaraya göre listeler', async () => {
    const { repo } = setupRepository({ create: createHiveRepository });
    repo.create(hive(IDS.hive, IDS.apiary, 12));
    repo.create(hive(IDS.record, IDS.apiary, 3));
    repo.create(hive(IDS.session, IDS.apiary2, 1));

    expect(repo.listByApiary(IDS.apiary).map((h) => h.number)).toEqual([3, 12]);
    expect((await repo.watchByBusiness(IDS.business)).map((h) => h.number)).toEqual([1, 3, 12]);
  });

  it('başka arılığa taşınan kovan yeni arılığın listesinde görünür', () => {
    const { repo } = setupRepository({ create: createHiveRepository });
    repo.create(hive(IDS.hive, IDS.apiary, 5));
    repo.update(IDS.hive, { apiaryId: IDS.apiary2 });

    expect(repo.listByApiary(IDS.apiary)).toEqual([]);
    expect(repo.listByApiary(IDS.apiary2).map((h) => h.id)).toEqual([IDS.hive]);
  });
});
