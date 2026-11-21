import { IDS } from '../../test-utils/domain-fixtures';
import { describeSyncedRepository, setupRepository } from '../../test-utils/repository-contract';

import { createHarvestRepository } from './HarvestRepository';

describeSyncedRepository({
  tableName: 'harvests',
  create: createHarvestRepository,
  sample: {
    id: IDS.record,
    businessId: IDS.business,
    hiveId: IDS.hive,
    harvestedOn: '2026-08-20',
    frameCount: 6,
    weightKg: 12.5,
    withdrawalWarningAcknowledged: false,
    notes: null,
  },
  changes: { withdrawalWarningAcknowledged: true },
});

describe('HarvestRepository', () => {
  it('uyarı onayını true/false olarak okur ve sağımları yeniden eskiye listeler', () => {
    const { repo } = setupRepository({ create: createHarvestRepository });
    const harvest = (id: string, harvestedOn: string) => ({
      id,
      businessId: IDS.business,
      hiveId: IDS.hive,
      harvestedOn,
      frameCount: null,
      weightKg: 3,
      withdrawalWarningAcknowledged: true,
      notes: null,
    });
    repo.create(harvest(IDS.record, '2026-06-01'));
    repo.create(harvest(IDS.session, '2026-08-01'));

    const list = repo.listByHive(IDS.hive);
    expect(list.map((h) => h.harvestedOn)).toEqual(['2026-08-01', '2026-06-01']);
    expect(list[0]?.withdrawalWarningAcknowledged).toBe(true);
  });
});
