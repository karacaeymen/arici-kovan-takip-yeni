import { IDS } from '../../test-utils/domain-fixtures';
import { describeSyncedRepository, setupRepository } from '../../test-utils/repository-contract';

import { createInspectionRepository } from './InspectionRepository';

describeSyncedRepository({
  tableName: 'inspections',
  create: createInspectionRepository,
  sample: {
    id: IDS.record,
    businessId: IDS.business,
    hiveId: IDS.hive,
    sessionId: null,
    inspectedAt: '2026-10-05T09:30:00+03:00',
    beeFrames: 8,
    broodFrames: 4,
    honeyFrames: 2,
    queenStatus: 'seen' as const,
    varroaMethod: null,
    varroaMiteCount: null,
    varroaSampleSize: null,
    temperament: 'calm' as const,
    notes: null,
  },
  changes: { broodFrames: 5, notes: 'Yumurta görüldü' },
});

describe('InspectionRepository', () => {
  const inspection = (id: string, inspectedAt: string, sessionId: string | null) => ({
    id,
    businessId: IDS.business,
    hiveId: IDS.hive,
    sessionId,
    inspectedAt,
    beeFrames: null,
    broodFrames: null,
    honeyFrames: null,
    queenStatus: null,
    varroaMethod: null,
    varroaMiteCount: null,
    varroaSampleSize: null,
    temperament: null,
    notes: null,
  });

  it('kovanın denetimlerini yeniden eskiye, toplu oturumu sırasıyla listeler', () => {
    const { repo } = setupRepository({ create: createInspectionRepository });
    repo.create(inspection(IDS.record, '2026-09-01T08:00:00Z', null));
    repo.create(inspection(IDS.apiary, '2026-10-01T08:10:00Z', IDS.session));
    repo.create(inspection(IDS.apiary2, '2026-10-01T08:00:00Z', IDS.session));

    expect(repo.listByHive(IDS.hive).map((i) => i.id)).toEqual([
      IDS.apiary,
      IDS.apiary2,
      IDS.record,
    ]);
    expect(repo.listBySession(IDS.session).map((i) => i.id)).toEqual([IDS.apiary2, IDS.apiary]);
  });
});
