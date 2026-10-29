import { IDS, issuePaths, OWNED } from '@/test-utils/domain-fixtures';

import { taskSchema } from './task';

const ruleTask = {
  ...OWNED,
  apiaryId: IDS.apiary,
  hiveId: null,
  source: 'rule',
  ruleId: 'VarroaTreatmentRule',
  dedupKey: `VarroaTreatmentRule:${IDS.apiary}:2026-09`,
  title: 'Varroa ilaçlaması',
  dueOn: '2026-09-10',
  status: 'pending',
  completedAt: null,
  snoozedUntil: null,
  notes: null,
};

const manualTask = { ...ruleTask, source: 'manual', ruleId: null, dedupKey: null };

describe('taskSchema', () => {
  it('kural ve elle eklenen görevi kabul eder', () => {
    expect(taskSchema.safeParse(ruleTask).success).toBe(true);
    expect(taskSchema.safeParse(manualTask).success).toBe(true);
  });

  it('kural görevinde kural bilgisini zorunlu tutar', () => {
    expect(issuePaths(taskSchema.safeParse({ ...ruleTask, dedupKey: null }))).toEqual(['ruleId']);
  });

  it('elle eklenen görevde kural bilgisini reddeder', () => {
    const result = taskSchema.safeParse({ ...manualTask, ruleId: 'SpringCheckRule' });
    expect(issuePaths(result)).toEqual(['ruleId']);
  });

  it('tamamlanan görevde tamamlanma zamanı ister', () => {
    const done = { ...ruleTask, status: 'done', completedAt: '2026-09-10T15:00:00Z' };
    expect(taskSchema.safeParse(done).success).toBe(true);
    expect(issuePaths(taskSchema.safeParse({ ...done, completedAt: null }))).toEqual([
      'completedAt',
    ]);
    expect(
      issuePaths(taskSchema.safeParse({ ...ruleTask, completedAt: done.completedAt })),
    ).toEqual(['completedAt']);
  });

  it('ertelenen görevde görev tarihinden sonraki erteleme tarihini ister', () => {
    const snoozed = { ...ruleTask, status: 'snoozed', snoozedUntil: '2026-09-12' };
    expect(taskSchema.safeParse(snoozed).success).toBe(true);
    expect(issuePaths(taskSchema.safeParse({ ...snoozed, snoozedUntil: null }))).toEqual([
      'snoozedUntil',
    ]);
    expect(issuePaths(taskSchema.safeParse({ ...snoozed, snoozedUntil: '2026-09-10' }))).toEqual([
      'snoozedUntil',
    ]);
    expect(issuePaths(taskSchema.safeParse({ ...ruleTask, snoozedUntil: '2026-09-12' }))).toEqual([
      'snoozedUntil',
    ]);
  });
});
