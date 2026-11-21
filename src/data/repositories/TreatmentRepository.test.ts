import { IDS } from '../../test-utils/domain-fixtures';
import { describeSyncedRepository, setupRepository } from '../../test-utils/repository-contract';

import { createTreatmentRepository } from './TreatmentRepository';

describeSyncedRepository({
  tableName: 'treatments',
  create: createTreatmentRepository,
  sample: {
    id: IDS.record,
    businessId: IDS.business,
    hiveId: IDS.hive,
    productCode: 'oxalic-acid',
    startedOn: '2026-10-01',
    endedOn: null,
    dose: '50 ml',
    withdrawalDays: 0,
    notes: null,
  },
  changes: { endedOn: '2026-10-21' },
});

describe('TreatmentRepository', () => {
  it('kovanın ilaçlamalarını başlangıç tarihine göre yeniden eskiye listeler', () => {
    const { repo } = setupRepository({ create: createTreatmentRepository });
    const treatment = (id: string, startedOn: string) => ({
      id,
      businessId: IDS.business,
      hiveId: IDS.hive,
      productCode: 'x',
      startedOn,
      endedOn: null,
      dose: null,
      withdrawalDays: 14,
      notes: null,
    });
    repo.create(treatment(IDS.record, '2026-03-01'));
    repo.create(treatment(IDS.session, '2026-09-01'));

    expect(repo.listByHive(IDS.hive).map((t) => t.startedOn)).toEqual(['2026-09-01', '2026-03-01']);
  });
});
