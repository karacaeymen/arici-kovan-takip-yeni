import { IDS, issuePaths, OWNED } from '@/test-utils/domain-fixtures';

import { hiveSchema } from './hive';

const valid = {
  ...OWNED,
  apiaryId: IDS.apiary,
  number: 12,
  name: null,
  status: 'active',
  notes: null,
};

describe('hiveSchema', () => {
  it('geçerli kovanı kabul eder', () => {
    expect(hiveSchema.safeParse(valid).success).toBe(true);
  });

  it.each([0, -1, 1.5, 100_000])('geçersiz kovan numarasını reddeder: %p', (number) => {
    expect(issuePaths(hiveSchema.safeParse({ ...valid, number }))).toEqual(['number']);
  });

  it('bilinmeyen durumu reddeder', () => {
    expect(issuePaths(hiveSchema.safeParse({ ...valid, status: 'lost' }))).toEqual(['status']);
  });

  it('arılık kimliği zorunludur', () => {
    expect(issuePaths(hiveSchema.safeParse({ ...valid, apiaryId: null }))).toEqual(['apiaryId']);
  });
});
