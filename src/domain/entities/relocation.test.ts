import { IDS, issuePaths, OWNED } from '@/test-utils/domain-fixtures';

import { relocationSchema } from './relocation';

const valid = {
  ...OWNED,
  hiveId: IDS.hive,
  fromApiaryId: IDS.apiary,
  toApiaryId: IDS.apiary2,
  movedAt: '2026-10-02T06:00:00Z',
  notes: null,
};

describe('relocationSchema', () => {
  it('geçerli taşımayı kabul eder', () => {
    expect(relocationSchema.safeParse(valid).success).toBe(true);
  });

  it('aynı arılığa taşımayı reddeder', () => {
    const result = relocationSchema.safeParse({ ...valid, toApiaryId: IDS.apiary });
    expect(issuePaths(result)).toEqual(['toApiaryId']);
  });

  it('geçersiz taşıma zamanını reddeder', () => {
    expect(issuePaths(relocationSchema.safeParse({ ...valid, movedAt: '2026-10-02' }))).toEqual([
      'movedAt',
    ]);
  });
});
