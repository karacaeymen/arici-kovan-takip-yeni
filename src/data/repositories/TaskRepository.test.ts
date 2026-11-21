import { IDS } from '../../test-utils/domain-fixtures';
import { describeSyncedRepository, setupRepository } from '../../test-utils/repository-contract';

import { createTaskRepository } from './TaskRepository';

describeSyncedRepository({
  tableName: 'tasks',
  create: createTaskRepository,
  sample: {
    id: IDS.record,
    businessId: IDS.business,
    apiaryId: null,
    hiveId: IDS.hive,
    source: 'manual' as const,
    ruleId: null,
    dedupKey: null,
    title: 'Ballık koy',
    dueOn: '2026-11-20',
    status: 'pending' as const,
    completedAt: null,
    snoozedUntil: null,
    notes: null,
  },
  changes: { status: 'done' as const, completedAt: '2026-11-20T10:00:00Z' },
});

describe('TaskRepository', () => {
  const task = (id: string, dueOn: string, dedupKey: string | null) => ({
    id,
    businessId: IDS.business,
    apiaryId: null,
    hiveId: IDS.hive,
    source: dedupKey === null ? ('manual' as const) : ('rule' as const),
    ruleId: dedupKey === null ? null : 'winter-feeding',
    dedupKey,
    title: 'Görev',
    dueOn,
    status: 'pending' as const,
    completedAt: null,
    snoozedUntil: null,
    notes: null,
  });

  it('görevleri tarihe göre listeler ve tekilleştirme anahtarıyla bulur', async () => {
    const { repo } = setupRepository({ create: createTaskRepository });
    repo.create(task(IDS.record, '2026-12-01', null));
    repo.create(task(IDS.session, '2026-11-15', 'winter-feeding:2026'));

    expect(repo.listByBusiness(IDS.business).map((t) => t.dueOn)).toEqual([
      '2026-11-15',
      '2026-12-01',
    ]);
    expect(await repo.watchByHive(IDS.hive)).toHaveLength(2);
    expect(repo.findByDedupKey(IDS.business, 'winter-feeding:2026')?.id).toBe(IDS.session);
    expect(repo.findByDedupKey(IDS.user, 'winter-feeding:2026')).toBeUndefined();
  });
});
