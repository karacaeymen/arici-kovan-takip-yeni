import { IDS, issuePaths, OWNED } from '@/test-utils/domain-fixtures';

import { feedingSchema } from './feeding';

const valid = {
  ...OWNED,
  hiveId: IDS.hive,
  fedOn: '2026-10-01',
  feedType: 'sugar_syrup',
  amount: 1.5,
  unit: 'l',
  notes: null,
};

describe('feedingSchema', () => {
  it('geçerli beslemeyi kabul eder', () => {
    expect(feedingSchema.safeParse(valid).success).toBe(true);
  });

  it.each([0, -2, 1001])('geçersiz miktarı reddeder: %p', (amount) => {
    expect(issuePaths(feedingSchema.safeParse({ ...valid, amount }))).toEqual(['amount']);
  });

  it('bilinmeyen besin tipini ve birimi reddeder', () => {
    expect(issuePaths(feedingSchema.safeParse({ ...valid, feedType: 'water' }))).toEqual([
      'feedType',
    ]);
    expect(issuePaths(feedingSchema.safeParse({ ...valid, unit: 'g' }))).toEqual(['unit']);
  });
});
